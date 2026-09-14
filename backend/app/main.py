from __future__ import annotations

import asyncio
import json
import logging
import os
import tempfile
import time
from pathlib import Path

import httpx
from fastapi import BackgroundTasks, Depends, FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from .auth import create_access_token, decode_access_token, hash_password, verify_password
from .chat_context import build_context_block
from .chat_prompt import CHAT_HISTORY_LIMIT, CHAT_SYSTEM_PROMPT, build_chat_input, chat_input_item
from .database import decode_payload, encode_payload, get_connection, init_db, row_to_dict, set_database_path
from .logging_config import configure_logging
from .rate_limit import Limiter, client_ip, client_keys
from . import hazard_runtime
from . import precip_runtime
from . import s2s_runtime
from . import weather_runtime
from .hazards import (
    BAND_ORDER,
    CLIMATOLOGY_LABEL,
    DATA_SOURCES,
    DISCHARGE_CLIMATOLOGY_LABEL,
    DROUGHT_WEIGHTS,
    FLOOD_WEIGHTS,
    HAZARD_LIMITS,
    SEVERITY_BANDS,
    advisories_for,
    resolve_region,
)
from .diagnosis import (
    SUPPORTED_IMAGE_ANALYSIS_TYPES,
    diagnose_crop_image,
    format_image_analysis_response,
)
from .domain import (
    build_activity_rows,
    build_advisory_payload,
    generate_sample_activities,
    infer_calendar_type,
    infer_crop_name,
    infer_weeks,
    json_dumps,
    parse_json_list,
    serialize_advisory,
    serialize_calendar,
    serialize_calendar_activity,
    serialize_cycle,
)
from .schemas import (
    ChatReply,
    ChatRequest,
    CommodityResponse,
    CommodityTrendResponse,
    ContactMessageRequest,
    ContactMessageResponse,
    CropDiagnosisRequest,
    FAQResponse,
    HazardOverrideRequest,
    HealthResponse,
    ImageAnalysisRequest,
    LegalDocumentResponse,
    LegalSection,
    MarketCenterResponse,
    ProductionCycleCreateRequest,
    ProductionCycleUpdateRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserResponse,
)
from .spreadsheet_parser import (
    build_calendar_preview_payload_from_files,
    build_advisory_preview_payload,
    build_committed_calendar_payload,
    build_committed_advisory_payload,
    discard_preview_payload,
    get_preview_payload,
)


configure_logging()

logger = logging.getLogger(__name__)

BACKEND_ROOT = Path(__file__).resolve().parent.parent

# `CHAT_SYSTEM_PROMPT`, `CHAT_HISTORY_LIMIT`, `build_chat_input` and
# `chat_input_item` moved to `chat_prompt` for room to grow. They are imported
# by name above rather than reached through the module so that
# `main.build_chat_input` keeps resolving -- moving a prompt into its own file
# should not break everything that already knew where to find it.


def is_serverless_runtime() -> bool:
    return os.getenv("VERCEL") == "1" or bool(os.getenv("VERCEL_ENV"))


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def load_local_env() -> None:
    """Load `.env` for local runs, and `.env.example` only when asked.

    `.env.example` used to be loaded automatically whenever `APP_ENV` was not
    the exact string "production". That is a trap on any host that is not
    Vercel: forget to set one variable and the example file supplies
    `SECRET_KEY=change-me-for-production` and `DEBUG=true` to a live server,
    silently, with nothing in the logs to say so.

    It stays available because it is genuinely useful for a first run on a fresh
    clone, but now it has to be asked for by name.
    """
    if is_serverless_runtime():
        return

    load_env_file(BACKEND_ROOT / ".env")
    if os.getenv("USE_EXAMPLE_ENV", "").lower() in ("1", "true", "yes"):
        load_env_file(BACKEND_ROOT / ".env.example")


def resolve_database_path(configured_path: str | None) -> str:
    if is_serverless_runtime():
        if configured_path and Path(configured_path).is_absolute():
            return configured_path
        database_name = Path(configured_path).name if configured_path else "agromet.db"
        return str(Path(tempfile.gettempdir()) / database_name)

    return configured_path or str(BACKEND_ROOT / "agromet.db")


load_local_env()


APP_NAME = os.getenv("APP_NAME", "AgroMet Backend")
APP_ENV = os.getenv("APP_ENV", "production" if is_serverless_runtime() else "development")
DEBUG = os.getenv("DEBUG", "false" if APP_ENV == "production" else "true").lower() == "true"
SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
FRONTEND_ORIGINS = [origin.strip() for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",") if origin.strip()]
LOCAL_DEV_ORIGIN_REGEX = r"https?://(localhost|127\.0\.0\.1)(:\d+)?$" if APP_ENV != "production" else None
DATABASE_PATH = resolve_database_path(os.getenv("DATABASE_PATH"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
# A ceiling on the answer, in tokens. Nothing bounded this before, so a single
# question could bill for a two-thousand-word essay that a farmer on a phone was
# never going to read. The prompt asks for about 120 words; this is roughly
# three times that, so it caps the pathological case without truncating a normal
# answer mid-sentence.
OPENAI_MAX_OUTPUT_TOKENS = int(os.getenv("OPENAI_MAX_OUTPUT_TOKENS", "400"))
# Low, not zero. These are questions with correct answers -- planting windows,
# what a rainfall figure means -- and invention is the failure mode that matters.
OPENAI_TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", "0.3"))
# Shorter than the 30s this used to allow. On a serverless host the platform
# kills the invocation on its own schedule, and a fallback answer served at 20s
# is worth more than a platform error page at 30.
OPENAI_TIMEOUT_SECONDS = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "20"))

# The chat quota. See `rate_limit.py` for what these can and cannot promise.
CHAT_RATE_LIMIT = int(os.getenv("CHAT_RATE_LIMIT", "20"))
CHAT_RATE_WINDOW_SECONDS = int(os.getenv("CHAT_RATE_WINDOW_SECONDS", "900"))
CHAT_DAILY_LIMIT = int(os.getenv("CHAT_DAILY_LIMIT", "120"))
KINDWISE_API_KEY = os.getenv("KINDWISE_API_KEY", "")
KINDWISE_CROP_HEALTH_API_KEY = os.getenv("KINDWISE_CROP_HEALTH_API_KEY", KINDWISE_API_KEY)
KINDWISE_PLANT_ID_API_KEY = os.getenv("KINDWISE_PLANT_ID_API_KEY", KINDWISE_API_KEY)
KINDWISE_CROP_HEALTH_URL = os.getenv("KINDWISE_CROP_HEALTH_URL", "https://crop.kindwise.com")
KINDWISE_PLANT_ID_URL = os.getenv("KINDWISE_PLANT_ID_URL", "https://api.plant.id/v3")
AMBEE_API_KEY = os.getenv("AMBEE_API_KEY", "")
HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "")
AMBEE_BASE_URL = os.getenv("AMBEE_BASE_URL", "https://api.ambeedata.com")

set_database_path(DATABASE_PATH)
init_db()

app = FastAPI(title=APP_NAME, debug=DEBUG)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_origin_regex=LOCAL_DEV_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FAQ_MESSAGES = {
    "when-to-plant-maize": "In Ghana, maize is typically planted at the start of the rains. Target April to June for the major season and September to November for the minor season, depending on local rainfall onset.",
    "when-to-plant-rice": "Rice planting depends on irrigation and region. Rainfed systems usually start with the first dependable rains, while irrigated rice can be staggered year-round.",
    "maize-fertilizer": "Use a soil test where possible. A practical starting point is a balanced basal NPK application followed by a nitrogen top-dress at early vegetative growth.",
    "rainy-season-farming": "Prepare fields early, use drainage where needed, and match planting windows to local rainfall onset instead of fixed calendar dates.",
}

# The legal documents, served as structured sections. Kept here beside
# FAQ_MESSAGES because both are static published copy rather than data.
#
# One source of truth on purpose: this wording previously existed only in the
# web app's TermsOfService.jsx / PrivacyPolicy.jsx, so the mobile app had no way
# to show it without a second copy that would drift. Both clients now render
# these same sections in their own components.
LEGAL_DOCUMENTS = {
    "terms": {
        "title": "Terms of Service",
        "summary": "Please read these terms carefully before using AgroMet.",
        "updated": "April 2026",
        "sections": [
            {
                "title": "Acceptance of Terms",
                "body": "By accessing or using AgroMet, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our services.",
            },
            {
                "title": "User Responsibilities",
                "body": "As a user of AgroMet, you agree to:",
                "items": [
                    "Provide accurate and complete information when creating an account",
                    "Keep your account credentials secure and confidential",
                    "Notify us immediately of any unauthorized access to your account",
                    "Use our services in compliance with all applicable laws and regulations",
                ],
            },
            {
                "title": "Limitation of Liability",
                "body": "AgroMet provides advisories as guidance based on the best available data. Our liability is limited to the fullest extent permitted by law. We are not responsible for any indirect, incidental, or consequential damages resulting from reliance on the service.",
            },
            {
                "title": "Changes to These Terms",
                "body": "We reserve the right to update or modify these Terms at any time. Material changes will be communicated through the platform. Your continued use of AgroMet after changes take effect constitutes acceptance of the updated Terms.",
            },
        ],
    },
    "privacy": {
        "title": "Privacy Policy",
        "summary": "How AgroMet collects, uses and protects your information.",
        "updated": "April 2026",
        "sections": [
            {
                "title": "Information We Collect",
                "body": "We may collect the following types of information:",
                "items": [
                    "Personal identification information (name, email, phone)",
                    "Usage data describing how you interact with our services",
                    "Cookies and similar tracking technologies",
                    "Location data when you opt in to localized advisories",
                ],
            },
            {
                "title": "How We Use Your Information",
                "body": "We use the information we collect to:",
                "items": [
                    "Provide, operate, and maintain the AgroMet platform",
                    "Personalize advisories and recommendations to your location",
                    "Communicate with you about updates, alerts, and support",
                    "Analyze usage patterns to improve the product",
                ],
            },
            {
                "title": "Data Security",
                "body": "We take the security of your personal information seriously and implement administrative, technical, and physical safeguards designed to protect it against unauthorized access, alteration, disclosure, or destruction.",
            },
            {
                "title": "Third-Party Services",
                "body": "We may engage vetted third-party service providers to help us operate and improve AgroMet. These providers have access to your information only to perform tasks on our behalf and are contractually obligated to protect it.",
            },
            # DRAFT, awaiting sign-off. Written because the policy did not say
            # this at all while the app was already doing it: a farmer's typed
            # question, their voice recording and their crop photo all leave
            # Ghana to reach a provider abroad, and "vetted third-party service
            # providers" above does not disclose that in a way anyone could act
            # on. Replace the wording with whatever the agency approves, but do
            # not ship the assistant with nothing here.
            {
                "title": "AgroMet AI and Your Questions",
                "body": "When you ask AgroMet AI a question, record one by voice, or send a crop photo, that content is sent to an artificial intelligence provider outside Ghana to produce the answer. Alongside your question we send the region you have selected in the app and the crops you have listed, so the answer can be specific to your area. We do not send your name, your phone number or your email address.",
                "items": [
                    "Your questions are used to produce your answer, not to identify you",
                    "Conversations are not stored on our servers; they stay on your phone and clear themselves",
                    "Do not include personal details, identity numbers or payment information in a question",
                    "Answers are guidance and can be wrong; check anything critical with your district extension officer",
                ],
            },
            {
                "title": "Changes to This Privacy Policy",
                "body": "We may update this Privacy Policy from time to time. Material changes will be posted on this page with a new effective date. We encourage you to review this policy periodically.",
            },
        ],
    },
}


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    payload = decode_access_token(token, SECRET_KEY)
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.")

    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, email, name, created_at FROM users WHERE email = ?",
            (email,),
        ).fetchone()

    user = row_to_dict(row)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authenticated user no longer exists.")
    return user


def serialize_user(user: dict) -> UserResponse:
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user.get("name"),
        created_at=user["created_at"],
    )


def get_optional_user(authorization: str | None) -> dict | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        return get_current_user(token)
    except HTTPException:
        return None


def save_diagnosis_record(owner_id: int, diagnosis: dict, crop: str | None, region: str | None) -> int:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO diagnosis_records(
                owner_id, provider_product, status, plant, disease, confidence, severity,
                source, crop_context, region_context, result_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                owner_id,
                diagnosis.get("providerProduct"),
                diagnosis.get("status"),
                diagnosis.get("plant"),
                diagnosis.get("disease"),
                diagnosis.get("confidence"),
                diagnosis.get("severity"),
                diagnosis.get("source"),
                crop,
                region,
                encode_payload(diagnosis),
            ),
        )
    return cursor.lastrowid


def serialize_diagnosis_record(record: dict) -> dict:
    result = decode_payload(record.get("result_json"))
    return {
        "id": record["id"],
        "providerProduct": record.get("provider_product"),
        "status": record.get("status"),
        "plant": record.get("plant"),
        "disease": record.get("disease"),
        "confidence": record.get("confidence"),
        "severity": record.get("severity"),
        "source": record.get("source"),
        "cropContext": record.get("crop_context"),
        "regionContext": record.get("region_context"),
        "createdAt": record.get("created_at"),
        "result": result,
    }


def normalize_record(record: dict) -> dict:
    payload = decode_payload(record.get("payload_json"))
    normalized = {
        "id": record["id"],
        "dataType": record["data_type"],
        "createdAt": record["created_at"],
        "updatedAt": record["updated_at"],
        "uploadDate": record["created_at"],
        "status": "processed",
        "fileName": record.get("file_name"),
        "fileSize": record.get("file_size"),
        "fileContentType": record.get("file_content_type"),
    }
    normalized.update(payload)
    return normalized


def insert_calendar_from_record(connection, record_id: int, data_type: str, payload: dict) -> dict | None:
    if data_type not in {"crop-calendar", "poultry-calendar", "enhanced-calendar"}:
        return None

    calendar_type = infer_calendar_type(data_type, payload)
    crop = infer_crop_name(data_type, payload)
    title = str(payload.get("title") or payload.get("fileName") or f"{crop.title()} Calendar").strip()
    description = str(payload.get("description") or "")
    region_code = str(payload.get("regionCode") or payload.get("region") or "")
    district_code = str(payload.get("districtCode") or payload.get("district") or "")

    try:
        year = int(payload.get("year")) if payload.get("year") not in (None, "") else None
    except (TypeError, ValueError):
        year = None

    total_weeks = infer_weeks(payload, calendar_type)
    sample_activities = generate_sample_activities(title, crop, calendar_type)
    activity_rows = build_activity_rows(sample_activities, total_weeks)
    metadata = {
        "majorSeason": {"startMonth": "April"} if calendar_type == "seasonal" else {},
        "fileData": {
            "filename": payload.get("fileName") or payload.get("originalFilename"),
            "totalRecords": len(activity_rows),
            "sheets": {},
        },
    }

    cursor = connection.execute(
        """
        INSERT INTO calendars(
            source_record_id, title, description, calendar_type, crop, region_code, region,
            district_code, district, year, total_weeks, cycle_duration, breed_type,
            sample_activities_json, metadata_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            record_id,
            title,
            description,
            calendar_type,
            crop,
            region_code,
            region_code,
            district_code,
            district_code,
            year,
            total_weeks,
            total_weeks if calendar_type == "cycle" else None,
            payload.get("breedCode") or payload.get("breedType"),
            json_dumps(sample_activities),
            json_dumps(metadata),
        ),
    )
    calendar_id = cursor.lastrowid

    for activity in activity_rows:
        connection.execute(
            """
            INSERT INTO calendar_activities(calendar_id, activity_code, activity_name, start_week, end_week, production_week, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                calendar_id,
                activity["activityCode"],
                activity["activityName"],
                activity["startWeek"],
                activity["endWeek"],
                activity["productionWeek"],
                json_dumps(activity),
            ),
        )

    row = connection.execute("SELECT * FROM calendars WHERE id = ?", (calendar_id,)).fetchone()
    return serialize_calendar(row_to_dict(row))


def insert_calendar_from_parsed_payload(connection, record_id: int | None, data_type: str, payload: dict) -> dict:
    calendar_type = payload.get("calendarType") or infer_calendar_type(data_type, payload)
    crop = payload.get("crop") or infer_crop_name(data_type, payload)
    title = str(payload.get("title") or f"{crop} Calendar").strip()
    description = str(payload.get("description") or "")
    region_code = str(payload.get("regionCode") or payload.get("region") or "")
    district_code = str(payload.get("districtCode") or payload.get("district") or "")
    total_weeks = infer_weeks(payload, calendar_type)
    sample_activities = payload.get("sampleActivities") or [item.get("activityName") for item in payload.get("activities", [])[:6]]
    metadata = {
        "fileData": {
            "totalRecords": len(payload.get("activities", [])),
            "sheets": payload.get("sheets", []),
        },
        "previewWarnings": payload.get("warnings", []),
        "seasons": payload.get("seasons", []),
    }

    cursor = connection.execute(
        """
        INSERT INTO calendars(
            source_record_id, title, description, calendar_type, crop, region_code, region,
            district_code, district, year, total_weeks, cycle_duration, breed_type,
            sample_activities_json, metadata_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            record_id,
            title,
            description,
            calendar_type,
            crop,
            region_code,
            region_code,
            district_code,
            district_code,
            payload.get("year"),
            total_weeks,
            total_weeks if calendar_type == "cycle" else None,
            payload.get("breedType"),
            json_dumps(sample_activities),
            json_dumps(metadata),
        ),
    )
    calendar_id = cursor.lastrowid

    for activity in payload.get("activities", []):
        connection.execute(
            """
            INSERT INTO calendar_activities(calendar_id, activity_code, activity_name, start_week, end_week, production_week, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                calendar_id,
                activity.get("activityCode") or activity.get("activityName"),
                activity.get("activityName"),
                activity.get("startWeek"),
                activity.get("endWeek"),
                activity.get("productionWeek"),
                json_dumps(activity.get("metadata") or activity),
            ),
        )

    row = connection.execute("SELECT * FROM calendars WHERE id = ?", (calendar_id,)).fetchone()
    return serialize_calendar(row_to_dict(row))


def insert_weekly_advisory(connection, record_id: int | None, advisory_type: str, payload: dict) -> dict:
    advisory_record, activities = build_advisory_payload(payload, advisory_type)
    cursor = connection.execute(
        """
        INSERT INTO weekly_advisories(
            source_record_id, advisory_type, title, description, region_code, region, district_code,
            district, crop, commodity_code, poultry_type_code, breed_code, year, season,
            summary, weather_forecast_json, advisories_json, sms_advisory
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            record_id,
            advisory_record["advisoryType"],
            advisory_record["title"],
            advisory_record["description"],
            advisory_record["regionCode"],
            advisory_record["region"],
            advisory_record["districtCode"],
            advisory_record["district"],
            advisory_record["crop"],
            advisory_record["commodityCode"],
            advisory_record["poultryTypeCode"],
            advisory_record["breedCode"],
            advisory_record["year"],
            advisory_record["season"],
            advisory_record["summary"],
            json_dumps(advisory_record["weatherForecast"]),
            json_dumps(advisory_record["advisories"]),
            advisory_record["smsAdvisory"],
        ),
    )
    advisory_id = cursor.lastrowid
    for item in activities:
        connection.execute(
            """
            INSERT INTO weekly_advisory_activities(advisory_id, activity, week_label, activity_type)
            VALUES (?, ?, ?, ?)
            """,
            (advisory_id, item["activity"], item["weekLabel"], item["activityType"]),
        )
    row = connection.execute("SELECT * FROM weekly_advisories WHERE id = ?", (advisory_id,)).fetchone()
    return serialize_advisory(row_to_dict(row))


def advisory_list_item(advisory: dict) -> dict:
    item = serialize_advisory(advisory)
    with get_connection() as connection:
        activity_rows = connection.execute(
            "SELECT activity, week_label FROM weekly_advisory_activities WHERE advisory_id = ? ORDER BY id ASC",
            (advisory["id"],),
        ).fetchall()
    activities = [row_to_dict(row) for row in activity_rows]
    item["activityCount"] = len(activities)
    item["activities"] = [row["activity"] for row in activities]
    item["weekLabels"] = [row.get("week_label") for row in activities if row.get("week_label")]
    return item


def fetch_calendar_activities(connection, calendar_id: int, current_week: int | None = None, start_week: int | None = None, end_week: int | None = None) -> list[dict]:
    clauses = ["calendar_id = ?"]
    params: list[object] = [calendar_id]

    if current_week is not None:
        clauses.append("start_week <= ? AND end_week >= ?")
        params.extend([current_week, current_week])
    else:
        if start_week is not None:
            clauses.append("end_week >= ?")
            params.append(start_week)
        if end_week is not None:
            clauses.append("start_week <= ?")
            params.append(end_week)

    query = f"""
        SELECT * FROM calendar_activities
        WHERE {' AND '.join(clauses)}
        ORDER BY start_week, id
    """
    rows = connection.execute(query, params).fetchall()
    return [serialize_calendar_activity(row_to_dict(row)) for row in rows]


# --- Google Translate fallback (free, high-quality Ghanaian language support) ---

GOOGLE_LANG_MAP = {
    "en": "en",
    "tw": "ak",   # Twi/Akan
    "ee": "ee",   # Ewe
    "gaa": "gaa", # Ga
    "dag": "dag", # Dagbani
    "ha": "ha",   # Hausa
    "fat": "ak",  # Fante → Akan (closest)
    "nzi": "ak",  # Nzema → Akan (closest)
    "ki": "ki",   # Kikuyu
}


async def google_translate_with_client(client: httpx.AsyncClient, text: str, src_lang: str, tgt_lang: str) -> str | None:
    """Translate using Google Translate free endpoint. High quality for Ghanaian languages."""
    src_code = GOOGLE_LANG_MAP.get(src_lang, src_lang)
    tgt_code = GOOGLE_LANG_MAP.get(tgt_lang, tgt_lang)
    try:
        response = await client.get(
            "https://translate.googleapis.com/translate_a/single",
            params={"client": "gtx", "sl": src_code, "tl": tgt_code, "dt": "t", "q": text},
        )
        response.raise_for_status()
        data = response.json()
        # Response format: [[["translated text","original text",...],...],...]
        if isinstance(data, list) and data and isinstance(data[0], list):
            # Concatenate all translated segments
            result = "".join(segment[0] for segment in data[0] if segment and segment[0])
            if result and result.lower() != text.lower():
                return result
    except Exception as exc:
        print(f"[GoogleTranslate] Translation failed: {exc}")
    return None


async def google_translate_fallback(text: str, src_lang: str, tgt_lang: str) -> str | None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        return await google_translate_with_client(client, text, src_lang, tgt_lang)


async def ambee_request(path: str, *, params: dict, timeout: float = 20.0) -> dict:
    if not AMBEE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ambee integration is unavailable because the API key is not configured.",
        )

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(
                f"{AMBEE_BASE_URL.rstrip('/')}/{path.lstrip('/')}",
                headers={
                    "Content-type": "application/json",
                    "x-api-key": AMBEE_API_KEY,
                },
                params=params,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as exc:
        response_text = exc.response.text.strip() if exc.response is not None and exc.response.text else ""
        detail = {
            "message": "Ambee upstream request failed.",
            "upstreamStatus": exc.response.status_code if exc.response is not None else None,
            "path": path,
            "params": params,
            "upstreamBody": response_text[:300] if response_text else None,
        }
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from exc
    except Exception as exc:  # pragma: no cover - defensive proxy handling
        detail = {
            "message": "Ambee upstream request failed.",
            "path": path,
            "params": params,
            "error": str(exc),
        }
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from exc


# One limiter for the process. Module scope on purpose: a limiter rebuilt per
# request counts nothing.
chat_limiter = Limiter(
    limit=CHAT_RATE_LIMIT,
    window_seconds=CHAT_RATE_WINDOW_SECONDS,
    daily_limit=CHAT_DAILY_LIMIT,
)


class ChatOutcome:
    """What one attempt at an answer produced.

    A tuple did for two values. It stopped doing when there were four, and the
    third and fourth are the point of this: `reason` is what turns "the
    assistant is degraded" into something an operator can act on, and `usage` is
    the only number that makes the bill visible.
    """

    __slots__ = ("text", "degraded", "reason", "usage")

    def __init__(self, text: str, degraded: bool, reason: str | None = None, usage: dict | None = None) -> None:
        self.text = text
        self.degraded = degraded
        self.reason = reason
        self.usage = usage


def fallback_reply(message: str, region: str | None) -> str:
    """The answer served when the model cannot be reached.

    Kept because a chat box that answers something beats a 502, and worded so it
    never pretends to have read the question: the client labels it, and this
    text has to survive being read without that label.
    """
    where = region or "your area"
    return (
        f"I cannot reach the AgroMet assistant right now, so this is general guidance rather than "
        f"an answer to your question. For {where}, watch the rainfall timing, keep field drainage "
        f"clear, use good seed, and check your crop for pests weekly. Please ask me again shortly."
    )


def extract_reply_text(payload: dict) -> str | None:
    """The assistant's words out of a Responses API payload."""
    for item in payload.get("output", []) or []:
        for content in item.get("content", []) or []:
            text = content.get("text")
            if text and text.strip():
                return text
    return None


async def build_chat_reply(
    message: str,
    conversation_history: list[dict],
    user_context: dict | None = None,
    context_block: str | None = None,
) -> ChatOutcome:
    """The reply, and whether it is the real thing.

    Every failure here ends in the same fallback and an HTTP 200, which is
    deliberate -- see `fallback_reply`. What changed is that the *reason* now
    survives: `no_key`, `timeout`, `upstream_error` and `empty_output` used to be
    one indistinguishable degraded answer, and the first of those is the one it
    usually was not.
    """
    context = user_context if isinstance(user_context, dict) else {}
    region = context.get("region")

    if not OPENAI_API_KEY:
        logger.warning("Chat asked for an answer with no OPENAI_API_KEY configured.")
        return ChatOutcome(fallback_reply(message, region), True, "no_key")

    started = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=OPENAI_TIMEOUT_SECONDS) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": OPENAI_MODEL,
                    "input": build_chat_input(message, conversation_history, context_block),
                    "max_output_tokens": OPENAI_MAX_OUTPUT_TOKENS,
                    "temperature": OPENAI_TEMPERATURE,
                },
            )
            response.raise_for_status()
            payload = response.json()
    except httpx.TimeoutException:
        logger.warning(
            "Chat completion timed out after %.1fs; serving the fallback reply.",
            time.perf_counter() - started,
        )
        return ChatOutcome(fallback_reply(message, region), True, "timeout")
    except Exception:
        # Falling through to the canned reply is deliberate: a chat box that
        # answers something beats a 502. Swallowing the reason was not.
        logger.exception("Chat completion failed; serving the fallback reply.")
        return ChatOutcome(fallback_reply(message, region), True, "upstream_error")

    usage = payload.get("usage") if isinstance(payload.get("usage"), dict) else None
    text = extract_reply_text(payload)

    if not text:
        # A 200 with nothing in it. Rare, and it used to be silent: the fallback
        # went out looking exactly like a missing key.
        logger.warning("Chat completion returned no text; serving the fallback reply.")
        return ChatOutcome(fallback_reply(message, region), True, "empty_output", usage)

    logger.info(
        "Chat answered in %.2fs (model=%s, input_tokens=%s, output_tokens=%s)",
        time.perf_counter() - started,
        OPENAI_MODEL,
        (usage or {}).get("input_tokens"),
        (usage or {}).get("output_tokens"),
    )
    return ChatOutcome(text, False, None, usage)


@app.get("/api/health", response_model=HealthResponse)
def api_health():
    return HealthResponse(status="healthy", app=APP_NAME)


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="healthy", app=APP_NAME)


@app.get("/api/integrations/status")
def integrations_status():
    return {
        "success": True,
        "data": {
            "kindwise": {
                "cropHealthConfigured": bool(KINDWISE_CROP_HEALTH_API_KEY),
                "plantIdConfigured": bool(KINDWISE_PLANT_ID_API_KEY),
            },
            "translation": {
                "provider": "google-translate-fallback",
                "serverTtsEnabled": False,
            },
            "ambee": {
                "configured": bool(AMBEE_API_KEY),
                "baseUrl": AMBEE_BASE_URL,
            },
            # The assistant's own provider, and the one that was missing here.
            # Without it, "why is every chat answer generic?" could not be
            # answered from the outside, which is exactly when you need to ask.
            "openai": {
                "configured": bool(OPENAI_API_KEY),
                "model": OPENAI_MODEL,
                "transcribeModel": TRANSCRIPTION_MODEL,
            },
        },
    }


@app.post("/api/v1/auth/register", response_model=RegisterResponse)
def register(payload: RegisterRequest):
    with get_connection() as connection:
        existing = connection.execute("SELECT id FROM users WHERE email = ?", (payload.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered.")

        cursor = connection.execute(
            "INSERT INTO users(email, name, password_hash) VALUES (?, ?, ?)",
            (payload.email, payload.name, hash_password(payload.password)),
        )
        user_id = cursor.lastrowid
        row = connection.execute(
            "SELECT id, email, name, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

    return RegisterResponse(user=serialize_user(row_to_dict(row)))


@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?",
            (form_data.username,),
        ).fetchone()

    user = row_to_dict(row)
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password.")

    token = create_access_token(user["email"], SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenResponse(
        access_token=token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=serialize_user(user),
    )


@app.get("/api/v1/auth/me", response_model=UserResponse)
def me(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)


@app.post("/api/chat", response_model=ChatReply)
async def chat(
    payload: ChatRequest,
    request: Request,
    x_device_id: str | None = Header(default=None, alias="X-Device-Id"),
):
    """Answer one question from a farmer.

    Three things happen before the model is called, in this order because each
    is cheaper than the next: the quota is checked, the live figures for this
    farmer's area are gathered, and only then is anything billed.

    The 429 is the one path here that is not a 200. It has to be: an answer that
    said "you have asked too many questions" in the assistant's own voice would
    be indistinguishable from the assistant refusing to help, and the client
    needs to tell those apart to know whether retrying is worth anything.
    """
    keys = client_keys(x_device_id, client_ip(request.headers, request.client.host if request.client else None))
    decision = chat_limiter.check(keys)
    if not decision.allowed:
        logger.info("Chat request refused by the quota (%s).", decision.reason)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=decision.message,
            headers={"Retry-After": str(decision.retry_after)},
        )
    chat_limiter.record(keys)

    context = payload.userContext
    context_block = await build_context_block(
        payload.message,
        region=context.region,
        district=context.district,
        town=context.town,
        crops=context.crops,
    )

    outcome = await build_chat_reply(
        payload.message,
        payload.conversationHistory,
        context.model_dump(),
        context_block,
    )

    # `degraded` says the answer is the built-in fallback rather than the
    # model's. Still a 200 with `success: True`, because the farmer did get
    # usable words back, but the client can now say where they came from
    # instead of presenting canned advice as an answer to their question.
    return ChatReply(
        success=True,
        message=outcome.text,
        degraded=outcome.degraded,
        degradedReason=outcome.reason,
        usage=outcome.usage,
    )


# A minute of speech is a long question. The cap exists because the upload
# happens on a rural connection and the transcription is billed by duration,
# not because a longer clip would break anything.
MAX_TRANSCRIPT_AUDIO_BYTES = 10 * 1024 * 1024

TRANSCRIPTION_MODEL = os.getenv("OPENAI_TRANSCRIBE_MODEL", "whisper-1")


@app.post("/api/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Speech to text, so a farmer can ask by speaking instead of typing.

    Deliberately returns the text rather than an answer: the transcript goes
    into the composer's draft for the farmer to correct before sending.
    Transcription of accented English over a poor connection is not reliable
    enough to send unread, and a wrong question answered confidently is worse
    than no question at all.
    """
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice questions need a transcription provider, which is not configured.",
        )

    payload = await audio.read()
    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The recording was empty.")
    if len(payload) > MAX_TRANSCRIPT_AUDIO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="That recording is too long. Ask a shorter question.",
        )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                files={"file": (audio.filename or "question.m4a", payload, audio.content_type or "audio/m4a")},
                data={"model": TRANSCRIPTION_MODEL},
            )
            response.raise_for_status()
            text = str(response.json().get("text") or "").strip()
    except Exception:
        # Unlike the chat fallback there is nothing sensible to invent here: a
        # made-up transcript would put words in the farmer's mouth.
        logger.exception("Transcription failed.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not turn that recording into text. Try again, or type your question.",
        )

    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No speech was found in that recording.",
        )

    return {"success": True, "text": text}


@app.post("/api/v1/translate")
async def translate_text(request: Request):
    payload = dict(await request.json())
    text = str(payload.get("in") or "").strip()
    lang = str(payload.get("lang") or "").strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Translation input text is required.")
    if "-" not in lang:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Translation language pair must be in the form 'en-tw'.")

    src_lang, tgt_lang = lang.split("-", 1)

    # Keep the route stable for older callers and translate through the current provider.
    google_result = await google_translate_fallback(text, src_lang, tgt_lang)
    if google_result:
        return {"out": google_result, "translation": google_result}

    raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Translation service failed.")


@app.post("/api/v1/translate/batch")
async def translate_text_batch(request: Request):
    payload = dict(await request.json())
    texts = payload.get("texts")
    lang = str(payload.get("lang") or "").strip()

    if not isinstance(texts, list) or not texts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Translation texts must be a non-empty list.")
    if len(texts) > 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Translation batch is limited to 100 texts.")
    if "-" not in lang:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Translation language pair must be in the form 'en-tw'.")

    src_lang, tgt_lang = lang.split("-", 1)
    normalized_texts = [str(text or "").strip() for text in texts]
    unique_texts = list(dict.fromkeys(text for text in normalized_texts if text))
    translated_by_text: dict[str, str] = {}
    semaphore = asyncio.Semaphore(8)

    async with httpx.AsyncClient(timeout=10.0) as client:
        async def translate_one(text: str) -> tuple[str, str | None]:
            async with semaphore:
                return text, await google_translate_with_client(client, text, src_lang, tgt_lang)

        pairs = await asyncio.gather(*(translate_one(text) for text in unique_texts))

    for text, translated in pairs:
        translated_by_text[text] = translated or text

    translations = [translated_by_text.get(text, text) for text in normalized_texts]
    return {
        "translations": translations,
        "provider": "google-translate-fallback",
        "count": len(translations),
    }


@app.get("/api/tts/languages")
async def list_tts_languages():
    return [
        {"code": "en", "language": "en", "name": "English", "source": "browser"},
        {"code": "tw", "language": "tw", "name": "Twi / Akan", "source": "browser"},
        {"code": "gaa", "language": "gaa", "name": "Ga", "source": "browser"},
        {"code": "ee", "language": "ee", "name": "Ewe", "source": "browser"},
        {"code": "dag", "language": "dag", "name": "Dagbani", "source": "browser"},
        {"code": "ha", "language": "ha", "name": "Hausa", "source": "browser"},
    ]


@app.get("/api/tts/speakers")
def list_tts_speakers():
    return []


@app.post("/api/tts/tts")
@app.post("/api/tts/synthesize")
async def synthesize_speech(request: Request):
    payload = dict(await request.json())
    text = str(payload.get("text") or "").strip()
    language = str(payload.get("language") or "en").strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TTS text is required.")

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={
            "success": False,
            "fallback": "browser",
            "message": "Server text-to-speech is disabled. Use browser speech synthesis.",
            "language": language,
        },
    )


@app.get("/api/ambee/weather/latest/by-lat-lng")
async def get_ambee_latest_weather(
    lat: float = Query(...),
    lng: float = Query(...),
):
    payload = await ambee_request(
        "/weather/latest/by-lat-lng",
        params={"lat": lat, "lng": lng},
    )
    return payload


@app.get("/api/ambee/weather/forecast/by-lat-lng")
async def get_ambee_forecast_weather(
    lat: float = Query(...),
    lng: float = Query(...),
):
    payload = await ambee_request(
        "/weather/forecast/by-lat-lng",
        params={"lat": lat, "lng": lng},
    )
    return payload


@app.get("/api/weather/bundle")
async def get_weather_bundle(
    background: BackgroundTasks,
    lat: float = Query(...),
    lng: float = Query(...),
):
    """Current conditions, seven days and the hourly series for one point.

    One route rather than three because Open-Meteo returns all of it in a single
    request, and the app needs all of it: Home reads `current`, the 7-Day
    segment reads `daily`, and day detail reads `hourly`.

    The payload is Open-Meteo's own, wrapped in the house envelope rather than
    normalised here. The mobile app falls back to calling Open-Meteo directly
    when this backend is unreachable, so the mapping has to live somewhere both
    paths share — which means the client, in TypeScript, written once.

    Never raises on upstream failure: a stale bundle beats an error page, and an
    empty one is reported as `unavailable` so the client can fall back.
    """
    key = weather_runtime.cache_key(lat, lng)
    await weather_runtime.ensure_fresh(lat, lng)
    bundle = weather_runtime.cached_bundle(key)

    if not bundle:
        return {
            "success": True,
            "data": None,
            "unavailable": True,
            "meta": weather_runtime.metadata(key),
        }

    # Serve what we have and revalidate behind the response.
    if weather_runtime.is_stale(key):
        background.add_task(weather_runtime.refresh, lat, lng, False)

    return {
        "success": True,
        "data": bundle,
        "unavailable": False,
        "meta": weather_runtime.metadata(key),
    }


@app.post("/api/crop-diagnosis")
async def crop_diagnosis(payload: CropDiagnosisRequest, authorization: str | None = Header(default=None)):
    context = dict(payload.context)
    context.setdefault("language", payload.language)
    diagnosis = await diagnose_crop_image(
        KINDWISE_CROP_HEALTH_API_KEY,
        KINDWISE_CROP_HEALTH_URL,
        KINDWISE_PLANT_ID_API_KEY,
        KINDWISE_PLANT_ID_URL,
        payload.image,
        crop=payload.crop,
        region=payload.region,
        language=payload.language,
        context=context,
    )
    current_user = get_optional_user(authorization)
    if current_user and diagnosis["status"] == "ok":
        record_id = save_diagnosis_record(current_user["id"], diagnosis, payload.crop, payload.region)
        diagnosis["historyId"] = record_id
    return diagnosis


@app.post("/api/image-analysis")
async def image_analysis(payload: ImageAnalysisRequest, authorization: str | None = Header(default=None)):
    if payload.analysisType not in SUPPORTED_IMAGE_ANALYSIS_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported analysisType '{payload.analysisType}'. Supported types: {', '.join(sorted(SUPPORTED_IMAGE_ANALYSIS_TYPES))}.",
        )

    diagnosis = await diagnose_crop_image(
        KINDWISE_CROP_HEALTH_API_KEY,
        KINDWISE_CROP_HEALTH_URL,
        KINDWISE_PLANT_ID_API_KEY,
        KINDWISE_PLANT_ID_URL,
        payload.image,
        crop=payload.context.get("crop"),
        region=payload.context.get("region"),
        language=payload.context.get("language"),
        context=payload.context,
    )
    current_user = get_optional_user(authorization)
    if current_user and diagnosis["status"] == "ok":
        save_diagnosis_record(current_user["id"], diagnosis, payload.context.get("crop"), payload.context.get("region"))
    if diagnosis["status"] != "ok":
        return {
            "analysis": None,
            "source": diagnosis["source"],
            "providerProduct": diagnosis.get("providerProduct"),
            "status": diagnosis["status"],
            "message": diagnosis["remedy"],
        }
    return format_image_analysis_response(diagnosis)


@app.get("/api/diagnosis-history")
def list_diagnosis_history(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
    crop: str | None = Query(default=None),
):
    clauses = ["owner_id = ?"]
    params: list[object] = [current_user["id"]]
    if status_filter:
        clauses.append("status = ?")
        params.append(status_filter)
    if crop:
        clauses.append("LOWER(crop_context) = LOWER(?)")
        params.append(crop)
    params.append(limit)
    query = f"""
        SELECT * FROM diagnosis_records
        WHERE {' AND '.join(clauses)}
        ORDER BY created_at DESC, id DESC
        LIMIT ?
    """
    with get_connection() as connection:
        rows = connection.execute(query, params).fetchall()
    data = [serialize_diagnosis_record(row_to_dict(row)) for row in rows]
    return {"success": True, "data": data, "total": len(data)}


@app.get("/api/diagnosis-history/{record_id}")
def get_diagnosis_history_item(record_id: int, current_user: dict = Depends(get_current_user)):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM diagnosis_records WHERE id = ? AND owner_id = ?",
            (record_id, current_user["id"]),
        ).fetchone()
    record = row_to_dict(row)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diagnosis history item not found.")
    return {"success": True, "data": serialize_diagnosis_record(record)}


@app.delete("/api/diagnosis-history/{record_id}")
def delete_diagnosis_history_item(record_id: int, current_user: dict = Depends(get_current_user)):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id FROM diagnosis_records WHERE id = ? AND owner_id = ?",
            (record_id, current_user["id"]),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diagnosis history item not found.")
        connection.execute(
            "DELETE FROM diagnosis_records WHERE id = ? AND owner_id = ?",
            (record_id, current_user["id"]),
        )
    return {"success": True, "message": "Diagnosis history item deleted successfully."}


@app.get("/api/faq/{topic}", response_model=FAQResponse)
def faq(topic: str):
    message = FAQ_MESSAGES.get(topic)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ topic not found.")
    return FAQResponse(success=True, message=message)


@app.post("/api/contact", response_model=ContactMessageResponse, status_code=status.HTTP_201_CREATED)
def submit_contact_message(payload: ContactMessageRequest):
    """Takes a message from the apps' Contact screen and stores it.

    Deliberately unauthenticated: someone who cannot sign in is exactly the
    person most likely to need to get in touch. Validation lives in the schema.

    The reference returned is the row id, so a follow-up call ("I wrote in on
    Tuesday") can be matched to a record rather than searched for by memory.
    """
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO contact_messages (name, email, phone, subject, message, source)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                payload.name.strip(),
                payload.email,
                (payload.phone or "").strip() or None,
                payload.subject.strip(),
                payload.message.strip(),
                payload.source.strip() or "mobile",
            ),
        )
        reference = cursor.lastrowid

    return ContactMessageResponse(
        success=True,
        message="Thank you. Your message has reached the AgroMet team.",
        reference=reference,
    )


@app.get("/api/legal/{slug}", response_model=LegalDocumentResponse)
def legal_document(slug: str):
    document = LEGAL_DOCUMENTS.get(slug)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Legal document not found.")

    return LegalDocumentResponse(
        success=True,
        slug=slug,
        title=document["title"],
        summary=document["summary"],
        updated=document["updated"],
        sections=[LegalSection(**section) for section in document["sections"]],
    )


@app.post("/api/agricultural-data/upload")
async def upload_agricultural_data(
    request: Request,
    dataType: str = Form(...),
    file: UploadFile | None = File(default=None),
    authorization: str | None = Header(default=None),
):
    owner_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        try:
            current_user = get_current_user(token)
            owner_id = current_user["id"]
        except HTTPException:
            owner_id = None

    payload = {}
    if file:
        payload["originalFilename"] = file.filename

    form = await request.form()
    for key, value in form.multi_items():
        if key == "dataType" or key == "file":
            continue
        payload[key] = value

    record_payload = payload
    if file:
        contents = await file.read()
        record_payload["fileSize"] = len(contents)
        record_payload["fileName"] = file.filename
        record_payload["fileContentType"] = file.content_type

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO agricultural_records(owner_id, data_type, payload_json, file_name, file_content_type, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                owner_id,
                dataType,
                encode_payload(record_payload),
                file.filename if file else None,
                file.content_type if file else None,
                record_payload.get("fileSize"),
            ),
        )
        record_id = cursor.lastrowid
        row = connection.execute(
            "SELECT * FROM agricultural_records WHERE id = ?",
            (record_id,),
        ).fetchone()
        calendar = insert_calendar_from_record(connection, record_id, dataType, record_payload)

    response = {"success": True, "data": normalize_record(row_to_dict(row))}
    if calendar:
        response["calendar"] = calendar
        response["calendarType"] = calendar["calendarType"]
        response["commodity"] = calendar["commodity"]
        response["activities"] = len(calendar.get("sampleActivities", []))
        response["message"] = "Agricultural data uploaded and calendar processed successfully."
    return response


@app.get("/api/agricultural-data/{data_type}")
def list_agricultural_data(data_type: str):
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM agricultural_records WHERE data_type = ? ORDER BY created_at DESC, id DESC",
            (data_type,),
        ).fetchall()

    return {"success": True, "data": [normalize_record(row_to_dict(row)) for row in rows]}


@app.delete("/api/agricultural-data/{data_type}/{record_id}")
def delete_agricultural_data(data_type: str, record_id: int):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id FROM agricultural_records WHERE id = ? AND data_type = ?",
            (record_id, data_type),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agricultural record not found.")
        connection.execute(
            "DELETE FROM agricultural_records WHERE id = ? AND data_type = ?",
            (record_id, data_type),
        )

    return {"success": True, "message": "Agricultural record deleted successfully."}


@app.post("/api/weekly-advisories/upload")
async def upload_weekly_advisory(request: Request, file: UploadFile | None = File(default=None)):
    payload = {}
    if file:
        payload["originalFilename"] = file.filename
        contents = await file.read()
        payload["fileSize"] = len(contents)
        payload["fileName"] = file.filename
        payload["fileContentType"] = file.content_type

    form = await request.form()
    for key, value in form.multi_items():
        if key != "file":
            payload[key] = value

    advisory_type = "poultry-advisory" if payload.get("poultryTypeCode") else "agromet-advisory"
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO agricultural_records(owner_id, data_type, payload_json, file_name, file_content_type, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                None,
                advisory_type,
                encode_payload(payload),
                payload.get("fileName"),
                payload.get("fileContentType"),
                payload.get("fileSize"),
            ),
        )
        record_id = cursor.lastrowid
        advisory = insert_weekly_advisory(connection, record_id, advisory_type, payload)

    return {"success": True, "data": advisory, "message": "Weekly advisory uploaded successfully."}


async def _preview_calendar_upload(
    file: UploadFile,
    metadata: dict,
    calendar_type: str,
    extra_files: list[tuple[str, UploadFile | None]] | None = None,
):
    if file is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Spreadsheet file is required.")
    file_items = [
        {
            "season": metadata.get("primarySeason") or "Major Season",
            "fileName": file.filename or "",
            "contents": await file.read(),
        }
    ]
    for season, upload in extra_files or []:
        if upload is None:
            continue
        file_items.append(
            {
                "season": season,
                "fileName": upload.filename or "",
                "contents": await upload.read(),
            }
        )
    try:
        preview = build_calendar_preview_payload_from_files(file_items, metadata, calendar_type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {"success": True, "data": preview}


@app.post("/api/crop-calendars/preview")
async def preview_crop_calendar(
    file: UploadFile = File(...),
    minorFile: UploadFile | None = File(default=None),
    region: str = Form(...),
    district: str = Form(...),
    crop: str = Form(...),
    title: str = Form(default=""),
    description: str = Form(default=""),
    year: int | None = Form(default=None),
):
    return await _preview_calendar_upload(
        file,
        {
            "region": region,
            "district": district,
            "crop": crop,
            "title": title or f"{crop} Calendar",
            "description": description,
            "year": year,
            "primarySeason": "Major Season",
        },
        "crop-calendar",
        extra_files=[("Minor Season", minorFile)],
    )


@app.post("/api/poultry-calendars/preview")
async def preview_poultry_calendar(
    file: UploadFile = File(...),
    region: str = Form(...),
    district: str = Form(...),
    poultryType: str = Form(...),
    title: str = Form(default=""),
    description: str = Form(default=""),
    year: int | None = Form(default=None),
):
    return await _preview_calendar_upload(
        file,
        {
            "region": region,
            "district": district,
            "poultryType": poultryType,
            "title": title or f"{poultryType} Calendar",
            "description": description,
            "year": year,
        },
        "poultry-calendar",
    )


@app.post("/api/crop-calendars/commit")
async def commit_crop_calendar(parseToken: str = Form(...)):
    preview_payload = get_preview_payload(parseToken)
    if not preview_payload or preview_payload.get("entityType") != "crop-calendar":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preview token not found or expired.")
    payload = build_committed_calendar_payload(preview_payload)
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO agricultural_records(owner_id, data_type, payload_json, file_name, file_content_type, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (None, "crop-calendar", encode_payload(payload), None, None, None),
        )
        record_id = cursor.lastrowid
        calendar = insert_calendar_from_parsed_payload(connection, record_id, "crop-calendar", payload)
    discard_preview_payload(parseToken)
    return {"success": True, "data": calendar, "message": "Crop calendar committed successfully."}


@app.post("/api/poultry-calendars/commit")
async def commit_poultry_calendar(parseToken: str = Form(...)):
    preview_payload = get_preview_payload(parseToken)
    if not preview_payload or preview_payload.get("entityType") != "poultry-calendar":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preview token not found or expired.")
    payload = build_committed_calendar_payload(preview_payload)
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO agricultural_records(owner_id, data_type, payload_json, file_name, file_content_type, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (None, "poultry-calendar", encode_payload(payload), None, None, None),
        )
        record_id = cursor.lastrowid
        calendar = insert_calendar_from_parsed_payload(connection, record_id, "poultry-calendar", payload)
    discard_preview_payload(parseToken)
    return {"success": True, "data": calendar, "message": "Poultry calendar committed successfully."}


async def _preview_advisory_upload(file: UploadFile, metadata: dict, advisory_type: str):
    if file is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Spreadsheet file is required.")
    contents = await file.read()
    try:
        preview = build_advisory_preview_payload(contents, metadata, advisory_type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {"success": True, "data": preview}


@app.post("/api/weekly-advisories/preview")
async def preview_weekly_advisory(
    file: UploadFile = File(...),
    regionCode: str = Form(...),
    districtCode: str = Form(...),
    commodityCode: str = Form(...),
    title: str = Form(...),
    description: str = Form(default=""),
):
    return await _preview_advisory_upload(
        file,
        {
            "regionCode": regionCode,
            "districtCode": districtCode,
            "commodityCode": commodityCode,
            "title": title,
            "description": description,
        },
        "agromet-advisory",
    )


@app.post("/api/poultry-advisories/preview")
async def preview_poultry_advisory(
    file: UploadFile = File(...),
    regionCode: str = Form(...),
    districtCode: str = Form(...),
    poultryTypeCode: str = Form(...),
    breedCode: str = Form(default=""),
    title: str = Form(...),
    description: str = Form(default=""),
):
    return await _preview_advisory_upload(
        file,
        {
            "regionCode": regionCode,
            "districtCode": districtCode,
            "poultryTypeCode": poultryTypeCode,
            "breedCode": breedCode,
            "title": title,
            "description": description,
        },
        "poultry-advisory",
    )


@app.post("/api/weekly-advisories/commit")
async def commit_weekly_advisory(
    parseToken: str = Form(...),
    selectedSheets: str = Form(default="[]"),
):
    preview_payload = get_preview_payload(parseToken)
    if not preview_payload or preview_payload.get("entityType") != "agromet-advisory":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preview token not found or expired.")

    payload = build_committed_advisory_payload(preview_payload, parse_json_list(selectedSheets))
    payload.update(
        {
            "selectedSheets": json_dumps(payload.get("selectedSheets", [])),
            "weatherForecast": payload.get("weatherForecast", {}),
            "advisories": [item["text"] for item in payload.get("advisories", [])],
        }
    )

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO agricultural_records(owner_id, data_type, payload_json, file_name, file_content_type, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (None, "agromet-advisory", encode_payload(payload), None, None, None),
        )
        record_id = cursor.lastrowid
        advisory = insert_weekly_advisory(connection, record_id, "agromet-advisory", payload)

    discard_preview_payload(parseToken)
    return {"success": True, "data": advisory, "message": "Agromet advisory committed successfully."}


@app.post("/api/poultry-advisories/commit")
async def commit_poultry_advisory(
    parseToken: str = Form(...),
    selectedSheets: str = Form(default="[]"),
):
    preview_payload = get_preview_payload(parseToken)
    if not preview_payload or preview_payload.get("entityType") != "poultry-advisory":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preview token not found or expired.")

    payload = build_committed_advisory_payload(preview_payload, parse_json_list(selectedSheets))
    payload.update(
        {
            "selectedSheets": json_dumps(payload.get("selectedSheets", [])),
            "advisories": [item["text"] for item in payload.get("advisories", [])],
            "weatherForecast": payload.get("managementMetrics", {}),
        }
    )

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO agricultural_records(owner_id, data_type, payload_json, file_name, file_content_type, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (None, "poultry-advisory", encode_payload(payload), None, None, None),
        )
        record_id = cursor.lastrowid
        advisory = insert_weekly_advisory(connection, record_id, "poultry-advisory", payload)

    discard_preview_payload(parseToken)
    return {"success": True, "data": advisory, "message": "Poultry advisory committed successfully."}


@app.get("/api/weekly-advisories")
def list_weekly_advisories(
    advisoryType: str | None = Query(default=None),
    regionCode: str | None = Query(default=None),
    districtCode: str | None = Query(default=None),
    commodityCode: str | None = Query(default=None),
    poultryTypeCode: str | None = Query(default=None),
):
    clauses = ["1=1"]
    params: list[object] = []
    if advisoryType:
        clauses.append("advisory_type = ?")
        params.append(advisoryType)
    if regionCode:
        clauses.append("region_code = ?")
        params.append(regionCode)
    if districtCode:
        clauses.append("district_code = ?")
        params.append(districtCode)
    if commodityCode:
        clauses.append("commodity_code = ?")
        params.append(commodityCode)
    if poultryTypeCode:
        clauses.append("poultry_type_code = ?")
        params.append(poultryTypeCode)

    query = f"SELECT * FROM weekly_advisories WHERE {' AND '.join(clauses)} ORDER BY created_at DESC, id DESC"
    with get_connection() as connection:
        rows = connection.execute(query, params).fetchall()
    data = [advisory_list_item(row_to_dict(row)) for row in rows]
    return {"success": True, "data": data, "total": len(data)}


@app.delete("/api/weekly-advisories/{advisory_id}")
def delete_weekly_advisory(advisory_id: int):
    with get_connection() as connection:
        row = connection.execute("SELECT source_record_id FROM weekly_advisories WHERE id = ?", (advisory_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly advisory not found.")
        source_record_id = row["source_record_id"]
        connection.execute("DELETE FROM weekly_advisories WHERE id = ?", (advisory_id,))
        if source_record_id:
            connection.execute("DELETE FROM agricultural_records WHERE id = ?", (source_record_id,))
    return {"success": True, "message": "Weekly advisory deleted successfully."}


@app.get("/api/weekly-advisories/activities")
def list_weekly_advisory_activities(
    region: str | None = Query(default=None),
    district: str | None = Query(default=None),
    crop: str | None = Query(default=None),
    year: int | None = Query(default=None),
):
    clauses = ["1=1"]
    params: list[object] = []
    if region:
        clauses.append("(wa.region_code = ? OR LOWER(wa.region) = LOWER(?) OR LOWER(REPLACE(wa.region, ' Region', '')) = LOWER(?))")
        params.extend([region, region, region])
    if district:
        clauses.append("(wa.district_code = ? OR LOWER(wa.district) = LOWER(?))")
        params.extend([district, district])
    if crop:
        clauses.append("LOWER(wa.crop) = LOWER(?)")
        params.append(crop)
    if year is not None:
        clauses.append("wa.year = ?")
        params.append(year)

    query = f"""
        SELECT waa.id, waa.activity, waa.week_label, wa.id AS advisory_id, wa.region, wa.region_code,
               wa.district, wa.district_code, wa.crop, wa.year
        FROM weekly_advisory_activities waa
        JOIN weekly_advisories wa ON wa.id = waa.advisory_id
        WHERE {' AND '.join(clauses)}
        ORDER BY wa.created_at DESC, waa.id ASC
    """
    with get_connection() as connection:
        rows = connection.execute(query, params).fetchall()

    data = []
    for row in rows:
        item = row_to_dict(row)
        data.append(
            {
                "id": item["id"],
                "advisory_id": item["advisory_id"],
                "activity": item["activity"],
                "week_label": item["week_label"],
                "region": item.get("region") or item.get("region_code"),
                "district": item.get("district") or item.get("district_code"),
                "crop": item.get("crop"),
                "year": item.get("year"),
            }
        )
    return {"success": True, "data": data}


@app.get("/api/weekly-advisories/{advisory_id}")
def get_weekly_advisory(advisory_id: int, activity: str | None = Query(default=None)):
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM weekly_advisories WHERE id = ?", (advisory_id,)).fetchone()
    advisory = row_to_dict(row)
    if not advisory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly advisory not found.")
    result = serialize_advisory(advisory)

    # If an activity name is specified, find its parsed data from advisories
    if activity and isinstance(result.get("advisories"), list):
        for adv in result["advisories"]:
            if isinstance(adv, dict) and adv.get("activity", "").lower() == activity.lower():
                result["activityData"] = adv
                break

    return {"success": True, "data": result}


@app.get("/api/enhanced-calendars/metadata")
def get_enhanced_calendar_metadata():
    with get_connection() as connection:
        rows = connection.execute("SELECT * FROM calendars ORDER BY created_at DESC, id DESC").fetchall()

    calendars = [serialize_calendar(row_to_dict(row)) for row in rows]
    return {
        "commodities": sorted({item["commodity"] for item in calendars if item.get("commodity")}),
        "regions": sorted({item["regionCode"] for item in calendars if item.get("regionCode")}),
        "districts": sorted({item["districtCode"] for item in calendars if item.get("districtCode")}),
        "calendarTypes": sorted({item["calendarType"] for item in calendars if item.get("calendarType")}),
        "totalCalendars": len(calendars),
    }


@app.get("/api/enhanced-calendars")
def list_enhanced_calendars(
    calendarType: str | None = Query(default=None),
    commodity: str | None = Query(default=None),
    regionCode: str | None = Query(default=None),
    districtCode: str | None = Query(default=None),
    year: int | None = Query(default=None),
    search: str | None = Query(default=None),
):
    clauses = ["1=1"]
    params: list[object] = []
    if calendarType:
        clauses.append("calendar_type = ?")
        params.append(calendarType)
    if commodity:
        clauses.append("LOWER(crop) = LOWER(?)")
        params.append(commodity)
    if regionCode:
        clauses.append("region_code = ?")
        params.append(regionCode)
    if districtCode:
        clauses.append("district_code = ?")
        params.append(districtCode)
    if year is not None:
        clauses.append("year = ?")
        params.append(year)
    if search:
        clauses.append("(LOWER(title) LIKE LOWER(?) OR LOWER(crop) LIKE LOWER(?))")
        params.extend([f"%{search}%", f"%{search}%"])

    query = f"SELECT * FROM calendars WHERE {' AND '.join(clauses)} ORDER BY created_at DESC, id DESC"
    with get_connection() as connection:
        rows = connection.execute(query, params).fetchall()

    data = [serialize_calendar(row_to_dict(row)) for row in rows]
    return {
        "success": True,
        "data": data,
        "total": len(data),
        "filters": {
            "calendarType": calendarType,
            "commodity": commodity,
            "regionCode": regionCode,
            "districtCode": districtCode,
            "year": year,
            "search": search,
        },
        "summary": {
            "calendarTypes": sorted({item["calendarType"] for item in data}),
            "commodities": sorted({item["commodity"] for item in data}),
        },
    }


@app.get("/api/enhanced-calendars/{calendar_id}/activities")
def get_enhanced_calendar_activities(
    calendar_id: int,
    currentWeek: int | None = Query(default=None),
    startWeek: int | None = Query(default=None),
    endWeek: int | None = Query(default=None),
):
    with get_connection() as connection:
        calendar_row = connection.execute("SELECT * FROM calendars WHERE id = ?", (calendar_id,)).fetchone()
        if not calendar_row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar not found.")
        activities = fetch_calendar_activities(connection, calendar_id, currentWeek, startWeek, endWeek)
    return {
        "success": True,
        "data": {
            "activities": activities,
            "schedule": activities,
        },
        "filters": {"currentWeek": currentWeek, "startWeek": startWeek, "endWeek": endWeek},
    }


@app.get("/api/enhanced-calendars/{calendar_id}")
def get_enhanced_calendar(calendar_id: int):
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM calendars WHERE id = ?", (calendar_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar not found.")
        activities = fetch_calendar_activities(connection, calendar_id)
    calendar = serialize_calendar(row_to_dict(row))
    calendar["activities"] = activities
    return {"success": True, "data": calendar}


@app.delete("/api/enhanced-calendars/{calendar_id}")
def delete_enhanced_calendar(calendar_id: int):
    with get_connection() as connection:
        row = connection.execute("SELECT source_record_id FROM calendars WHERE id = ?", (calendar_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar not found.")
        source_record_id = row["source_record_id"]
        connection.execute("DELETE FROM calendars WHERE id = ?", (calendar_id,))
        if source_record_id:
            connection.execute("DELETE FROM agricultural_records WHERE id = ?", (source_record_id,))
    return {"success": True, "message": "Calendar deleted successfully."}


@app.post("/api/crop-calendars/create")
async def create_crop_calendar(request: Request):
    payload = dict(await request.json())
    payload.setdefault("title", payload.get("crop") or "Crop Calendar")
    payload.setdefault("regionCode", payload.get("region"))
    payload.setdefault("districtCode", payload.get("district"))
    payload.setdefault("crop", payload.get("crop") or payload.get("commodity"))
    payload.setdefault("year", payload.get("year"))

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO agricultural_records(owner_id, data_type, payload_json, file_name, file_content_type, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (None, "crop-calendar", encode_payload(payload), None, None, None),
        )
        record_id = cursor.lastrowid
        calendar = insert_calendar_from_record(connection, record_id, "crop-calendar", payload)
    return {"success": True, "data": calendar}


@app.get("/api/crop-calendars/district/{district}")
def get_crop_calendars_by_district(district: str, year: int | None = Query(default=None), crop: str | None = Query(default=None)):
    params: dict[str, object] = {"districtCode": district}
    if year is not None:
        params["year"] = year
    if crop:
        params["commodity"] = crop
    return list_enhanced_calendars(calendarType="seasonal", **params)


@app.get("/api/crop-calendars/search")
def search_crop_calendars(search: str | None = Query(default=None), region: str | None = Query(default=None), district: str | None = Query(default=None)):
    return list_enhanced_calendars(
        calendarType="seasonal",
        commodity=search,
        regionCode=region,
        districtCode=district,
        search=search,
    )


@app.get("/api/crop-calendars/stats")
def get_crop_calendar_stats():
    with get_connection() as connection:
        rows = connection.execute("SELECT * FROM calendars WHERE calendar_type = 'seasonal' ORDER BY created_at DESC").fetchall()
    calendars = [serialize_calendar(row_to_dict(row)) for row in rows]
    return {
        "success": True,
        "data": {
            "totalCalendars": len(calendars),
            "regions": sorted({item["regionCode"] for item in calendars if item.get("regionCode")}),
            "commodities": sorted({item["commodity"] for item in calendars if item.get("commodity")}),
        },
    }


@app.get("/api/production-cycles")
def list_production_cycles(
    status_filter: str | None = Query(default=None, alias="status"),
    commodity: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
):
    clauses = ["1=1"]
    params: list[object] = []
    if status_filter:
        clauses.append("pc.status = ?")
        params.append(status_filter)
    if commodity:
        clauses.append("LOWER(pc.commodity) = LOWER(?)")
        params.append(commodity)
    params.append(limit)
    query = f"""
        SELECT pc.* FROM production_cycles pc
        WHERE {' AND '.join(clauses)}
        ORDER BY pc.created_at DESC, pc.id DESC
        LIMIT ?
    """
    with get_connection() as connection:
        rows = connection.execute(query, params).fetchall()
    data = [serialize_cycle(row_to_dict(row)) for row in rows]
    return {
        "success": True,
        "data": data,
        "total": len(data),
        "summary": {
            "active": sum(1 for item in data if item["status"] == "active"),
            "paused": sum(1 for item in data if item["status"] == "paused"),
            "completed": sum(1 for item in data if item["status"] == "completed"),
        },
    }


@app.post("/api/production-cycles")
def create_production_cycle(payload: ProductionCycleCreateRequest):
    with get_connection() as connection:
        calendar_row = connection.execute("SELECT * FROM calendars WHERE id = ?", (payload.calendarId,)).fetchone()
        if not calendar_row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar not found.")
        calendar = row_to_dict(calendar_row)
        # Snapshot the calendar's length onto the cycle. serialize_cycle
        # divides by this to derive currentWeek and progressPercent, so
        # leaving it null made every cycle report "week 1 of 1, 100%".
        # A poultry calendar carries its length in cycle_duration, a crop
        # one in total_weeks.
        duration_weeks = calendar.get("cycle_duration") or calendar.get("total_weeks") or 1

        cursor = connection.execute(
            """
            INSERT INTO production_cycles(
                calendar_id, batch_name, commodity, start_date, status,
                initial_quantity, current_quantity, notes, total_duration_weeks
            )
            VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)
            """,
            (
                payload.calendarId,
                payload.batchName,
                calendar["crop"],
                payload.startDate,
                payload.initialQuantity,
                payload.initialQuantity,
                payload.notes,
                duration_weeks,
            ),
        )
        cycle_id = cursor.lastrowid
        row = connection.execute("SELECT * FROM production_cycles WHERE id = ?", (cycle_id,)).fetchone()
    return {"success": True, "data": serialize_cycle(row_to_dict(row))}


@app.put("/api/production-cycles/{cycle_id}")
def update_production_cycle(cycle_id: int, payload: ProductionCycleUpdateRequest):
    updates = []
    params: list[object] = []
    mapping = {
        "status": payload.status,
        "batch_name": payload.batchName,
        "initial_quantity": payload.initialQuantity,
        "current_quantity": payload.currentQuantity,
        "notes": payload.notes,
    }
    for column, value in mapping.items():
        if value is not None:
            updates.append(f"{column} = ?")
            params.append(value)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No production cycle updates provided.")
    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(cycle_id)

    with get_connection() as connection:
        existing = connection.execute("SELECT * FROM production_cycles WHERE id = ?", (cycle_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production cycle not found.")
        connection.execute(f"UPDATE production_cycles SET {', '.join(updates)} WHERE id = ?", params)
        row = connection.execute("SELECT * FROM production_cycles WHERE id = ?", (cycle_id,)).fetchone()
    return {"success": True, "data": serialize_cycle(row_to_dict(row))}


@app.get("/api/production-cycles/{cycle_id}/current-activities")
def get_current_cycle_activities(cycle_id: int):
    with get_connection() as connection:
        cycle_row = connection.execute("SELECT * FROM production_cycles WHERE id = ?", (cycle_id,)).fetchone()
        if not cycle_row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production cycle not found.")
        cycle = serialize_cycle(row_to_dict(cycle_row))
        activities = fetch_calendar_activities(connection, cycle["calendarId"], current_week=cycle["currentWeek"])
    return {
        "success": True,
        "data": {
            "currentWeek": cycle["currentWeek"],
            "totalWeeks": cycle["totalDurationWeeks"],
            "progressPercent": cycle["progressPercent"],
            "activities": activities,
            "completedActivities": [],
        },
    }


def build_dashboard_stats() -> dict:
    counts = {
        "cropCalendars": 0,
        "agrometAdvisories": 0,
        "poultryCalendars": 0,
        "poultryAdvisories": 0,
    }
    with get_connection() as connection:
        crop_count = connection.execute("SELECT COUNT(*) AS total, MAX(updated_at) AS last_updated FROM calendars WHERE calendar_type = 'seasonal'").fetchone()
        poultry_count = connection.execute("SELECT COUNT(*) AS total, MAX(updated_at) AS last_updated FROM calendars WHERE calendar_type = 'cycle'").fetchone()
        agromet_count = connection.execute("SELECT COUNT(*) AS total, MAX(updated_at) AS last_updated FROM weekly_advisories WHERE advisory_type = 'agromet-advisory'").fetchone()
        poultry_adv_count = connection.execute("SELECT COUNT(*) AS total, MAX(updated_at) AS last_updated FROM weekly_advisories WHERE advisory_type = 'poultry-advisory'").fetchone()
    last_updated = None
    for row, key in (
        (crop_count, "cropCalendars"),
        (agromet_count, "agrometAdvisories"),
        (poultry_count, "poultryCalendars"),
        (poultry_adv_count, "poultryAdvisories"),
    ):
        item = row_to_dict(row)
        counts[key] = item["total"] if item else 0
        if item and item.get("last_updated") and (last_updated is None or item["last_updated"] > last_updated):
            last_updated = item["last_updated"]
    counts["totalRecords"] = sum(counts.values())
    counts["lastUpdated"] = last_updated
    return counts


@app.get("/api/user/dashboard/stats")
@app.get("/user/dashboard/stats")
def get_dashboard_stats():
    return {"success": True, "data": build_dashboard_stats()}


# ── Market Intelligence ─────────────────────────────────────────────────────

SEED_COMMODITIES = [
    ("yellow-maize", "Yellow Maize", "Maize", 299.99, "per bag", "stable", "high"),
    ("white-maize", "White Maize", "Maize", 289.99, "per bag", "rising", "high"),
    ("rice", "Rice", "Rice", 159.99, "per bag", "stable", "very-high"),
    ("yam", "Yam", "Yam", 389.99, "per bag", "rising", "high"),
    ("cassava", "Cassava", "Cassava", 129.99, "per bag", "stable", "moderate"),
    ("tomatoes", "Tomatoes", "Tomatoes", 149.99, "per crate", "volatile", "high"),
    ("pepper", "Pepper", "Pepper", 59.99, "per bag", "rising", "high"),
    ("onion", "Onion", "Onion", 89.99, "per bag", "seasonal", "moderate"),
    ("plantain", "Plantain", "Plantain", 79.99, "per bunch", "stable", "high"),
    ("beans", "Beans", "Beans", 199.99, "per bag", "rising", "moderate"),
    ("soybeans", "Soybeans", "Soybeans", 399.99, "per bag", "stable", "growing"),
    ("sorghum", "Sorghum", "Sorghum", 189.99, "per bag", "stable", "low"),
    ("groundnuts", "Groundnuts", "Groundnuts", 249.99, "per bag", "rising", "moderate"),
    ("cocoa", "Cocoa", "Cocoa", 850.00, "per bag", "volatile", "export"),
    ("poultry", "Poultry", "Poultry", 45.00, "per kg", "rising", "very-high"),
]

# Every commodity above carries a trend entry. The market UI draws a sparkline
# on each card and a full price chart on the commodity page, so a commodity
# without a trend is a commodity with a visibly broken page. The last point of
# each series is the commodity's current price, by construction.
SEED_TRENDS = {
    "yellow-maize": {
        "6months": [280, 285, 290, 295, 298, 299.99],
        "seasonal_pattern": "Low during harvest (July-August), High during planting (March-April)",
        "peak_months": [3, 4, 5],
        "low_months": [7, 8, 9],
    },
    "white-maize": {
        "6months": [265, 270, 276, 282, 287, 289.99],
        "seasonal_pattern": "Tracks yellow maize, but firmer when household demand for banku and kenkey is strong",
        "peak_months": [3, 4, 5],
        "low_months": [8, 9, 10],
    },
    "rice": {
        "6months": [150, 152, 155, 157, 158, 159.99],
        "seasonal_pattern": "Stable year-round, slight increase during festivals",
        "peak_months": [12, 1],
        "low_months": [6, 7, 8],
    },
    "tomatoes": {
        "6months": [120, 140, 160, 180, 170, 149.99],
        "seasonal_pattern": "Very volatile, peaks during dry season",
        "peak_months": [1, 2, 3],
        "low_months": [6, 7, 8],
    },
    "yam": {
        "6months": [350, 360, 370, 380, 385, 389.99],
        "seasonal_pattern": "Peaks before harvest, drops after new yam season",
        "peak_months": [6, 7, 8],
        "low_months": [9, 10, 11],
    },
    "cassava": {
        "6months": [126, 127, 128, 128.5, 129, 129.99],
        "seasonal_pattern": "Flat year-round; roots can be left in the ground until they are needed",
        "peak_months": [2, 3],
        "low_months": [8, 9],
    },
    "pepper": {
        "6months": [48, 51, 54, 57, 59, 59.99],
        "seasonal_pattern": "Climbs through the dry season as irrigated volumes thin out",
        "peak_months": [12, 1, 2],
        "low_months": [6, 7, 8],
    },
    "onion": {
        "6months": [110, 102, 95, 90, 88, 89.99],
        "seasonal_pattern": "Strongly seasonal; falls once northern and Sahel stock arrives",
        "peak_months": [4, 5, 6],
        "low_months": [10, 11, 12],
    },
    "plantain": {
        "6months": [72, 75, 82, 85, 81, 79.99],
        "seasonal_pattern": "Cannot be stored, so the price follows that week's arrivals",
        "peak_months": [1, 2, 3],
        "low_months": [7, 8, 9],
    },
    "beans": {
        "6months": [178, 183, 189, 194, 197, 199.99],
        "seasonal_pattern": "Stores well, so the price rises steadily through the lean season",
        "peak_months": [4, 5, 6],
        "low_months": [11, 12],
    },
    "soybeans": {
        "6months": [372, 380, 388, 393, 397, 399.99],
        "seasonal_pattern": "Crusher demand outruns local supply, so harvest dips stay shallow",
        "peak_months": [2, 3, 4],
        "low_months": [11, 12],
    },
    "sorghum": {
        "6months": [180, 182, 185, 187, 188, 189.99],
        "seasonal_pattern": "Steady brewer and feed-mill demand; thin volumes move slowly",
        "peak_months": [3, 4],
        "low_months": [10, 11],
    },
    "groundnuts": {
        "6months": [225, 231, 238, 243, 247, 249.99],
        "seasonal_pattern": "Rises through the lean season once the northern harvest is sold down",
        "peak_months": [4, 5, 6],
        "low_months": [10, 11, 12],
    },
    "cocoa": {
        "6months": [790, 815, 870, 905, 862, 850.00],
        "seasonal_pattern": "Volatile; set by the world price and the announced farmgate rate",
        "peak_months": [10, 11, 12],
        "low_months": [5, 6, 7],
    },
    "poultry": {
        "6months": [41, 42, 43, 44, 44.5, 45.00],
        "seasonal_pattern": "Spikes in December and around Easter; feed-grain cost sets the floor",
        "peak_months": [12, 4],
        "low_months": [6, 7, 8],
    },
}

SEED_MARKET_CENTERS = [
    ("Greater Accra", ["Tema Market", "Kaneshie Market", "Makola Market"], "excellent", 1.1),
    ("Ashanti", ["Kumasi Central Market", "Kejetia Market"], "good", 1.05),
    ("Northern", ["Tamale Market", "Yendi Market"], "fair", 0.95),
    ("Western", ["Takoradi Market", "Tarkwa Market"], "good", 1.02),
]


def seed_market_data() -> None:
    """Bring the market tables up to date with the seed data above.

    This upserts rather than bailing out on a non-empty table. The earlier
    "insert only if empty" guard meant that any commodity or trend added to
    the seeds after first run never reached an existing agromet.db, which is
    how the database ended up serving four trends for fourteen commodities.
    There is no write API for market data, so there is no operator-entered
    state here to protect.
    """
    with get_connection() as conn:
        for slug, name, category, price, unit, trend, demand in SEED_COMMODITIES:
            conn.execute(
                """
                INSERT INTO commodities (slug, name, category, price, unit, trend, demand)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(slug) DO UPDATE SET
                    name = excluded.name,
                    category = excluded.category,
                    price = excluded.price,
                    unit = excluded.unit,
                    trend = excluded.trend,
                    demand = excluded.demand,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (slug, name, category, price, unit, trend, demand),
            )

        for slug, data in SEED_TRENDS.items():
            conn.execute(
                """
                INSERT INTO commodity_trends (commodity_slug, month_prices_json, seasonal_pattern, peak_months_json, low_months_json)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(commodity_slug) DO UPDATE SET
                    month_prices_json = excluded.month_prices_json,
                    seasonal_pattern = excluded.seasonal_pattern,
                    peak_months_json = excluded.peak_months_json,
                    low_months_json = excluded.low_months_json,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (slug, json.dumps(data["6months"]), data["seasonal_pattern"], json.dumps(data["peak_months"]), json.dumps(data["low_months"])),
            )

        for region, markets, transport, premium in SEED_MARKET_CENTERS:
            conn.execute(
                """
                INSERT INTO market_centers (region, major_markets_json, transport_access, price_premium)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(region) DO UPDATE SET
                    major_markets_json = excluded.major_markets_json,
                    transport_access = excluded.transport_access,
                    price_premium = excluded.price_premium,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (region, json.dumps(markets), transport, premium),
            )


seed_market_data()


# The market collections are serialized as maps keyed by slug/region, which is
# the shape both clients already read, so the schemas below cannot be used as
# FastAPI `response_model=`. They are applied to each entry instead: the row
# still has to satisfy the declared contract before it goes out, and every
# entry now carries its own slug/region rather than relying on the map key.


def _commodity_payload(row) -> dict:
    return CommodityResponse(**dict(row)).model_dump()


def _trend_payload(row) -> dict:
    return CommodityTrendResponse(
        commodity_slug=row["commodity_slug"],
        seasonal_pattern=row["seasonal_pattern"],
        peak_months=json.loads(row["peak_months_json"]),
        low_months=json.loads(row["low_months_json"]),
        **{"6months": json.loads(row["month_prices_json"])},
    ).model_dump(by_alias=True)


def _market_center_payload(row) -> dict:
    return MarketCenterResponse(
        region=row["region"],
        major_markets=json.loads(row["major_markets_json"]),
        transport_access=row["transport_access"],
        price_premium=row["price_premium"],
    ).model_dump()


COMMODITY_COLUMNS = "slug, name, category, price, unit, trend, demand"
TREND_COLUMNS = "commodity_slug, month_prices_json, seasonal_pattern, peak_months_json, low_months_json"
MARKET_CENTER_COLUMNS = "region, major_markets_json, transport_access, price_premium"


@app.get("/api/market/commodities")
def get_commodities():
    with get_connection() as conn:
        rows = conn.execute(f"SELECT {COMMODITY_COLUMNS} FROM commodities ORDER BY name").fetchall()
    return {"success": True, "data": {row["slug"]: _commodity_payload(row) for row in rows}}


@app.get("/api/market/commodities/{slug}")
def get_commodity(slug: str):
    with get_connection() as conn:
        row = conn.execute(f"SELECT {COMMODITY_COLUMNS} FROM commodities WHERE slug = ?", (slug,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Commodity not found")
    return {"success": True, "data": _commodity_payload(row)}


@app.get("/api/market/trends")
def get_trends():
    with get_connection() as conn:
        rows = conn.execute(f"SELECT {TREND_COLUMNS} FROM commodity_trends").fetchall()
    return {"success": True, "data": {row["commodity_slug"]: _trend_payload(row) for row in rows}}


@app.get("/api/market/trends/{slug}")
def get_trend(slug: str):
    with get_connection() as conn:
        row = conn.execute(f"SELECT {TREND_COLUMNS} FROM commodity_trends WHERE commodity_slug = ?", (slug,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Trend data not found")
    return {"success": True, "data": _trend_payload(row)}


@app.get("/api/market/regions")
def get_regions():
    with get_connection() as conn:
        rows = conn.execute(f"SELECT {MARKET_CENTER_COLUMNS} FROM market_centers ORDER BY region").fetchall()
    return {"success": True, "data": {row["region"]: _market_center_payload(row) for row in rows}}


@app.get("/api/market/regions/{region}")
def get_region(region: str):
    with get_connection() as conn:
        row = conn.execute(f"SELECT {MARKET_CENTER_COLUMNS} FROM market_centers WHERE region = ?", (region,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Region not found")
    return {"success": True, "data": _market_center_payload(row)}


# ---------------------------------------------------------------------------
# Flood and drought monitoring
# ---------------------------------------------------------------------------
#
# Read endpoints never raise on upstream failure. Unlike ambee_request above --
# which is a proxy, where a 502 is the honest answer -- this is a monitoring
# page, and a clearly-labelled stale reading beats an error screen. Failures
# surface as `stale`, `degraded` and `error` fields on a 200 response.


def _active_overrides(connection) -> dict[tuple[str, str], dict]:
    """Newest in-force override per (region, hazard).

    Expiry is evaluated in SQL rather than by a cleanup job, so a bulletin
    reverts to the computed value on its own the moment it lapses.
    """
    rows = connection.execute(
        """
        SELECT id, region, hazard, band, headline, advisory_json, issued_by,
               effective_from, effective_to, created_at
        FROM hazard_overrides
        WHERE effective_from <= CURRENT_TIMESTAMP
          AND (effective_to IS NULL OR effective_to >= CURRENT_TIMESTAMP)
        ORDER BY effective_from DESC, id DESC
        """
    ).fetchall()

    active: dict[tuple[str, str], dict] = {}
    for row in rows:
        key = (row["region"], row["hazard"])
        if key in active:
            continue  # the ORDER BY already put the newest first
        active[key] = {
            "id": row["id"],
            "band": row["band"],
            "headline": row["headline"],
            "advisories": parse_json_list(row["advisory_json"]),
            "issuedBy": row["issued_by"],
            "issuedAt": row["effective_from"],
            "effectiveTo": row["effective_to"],
        }
    return active


def _apply_overrides(region_payload: dict, overrides: dict[tuple[str, str], dict]) -> dict:
    """Overlay any in-force bulletin, keeping the computed reading visible.

    Copies the nested hazard blocks rather than mutating them. The snapshot this
    reads from is the long-lived process cache, so writing an override straight
    into it would contaminate every later request -- and the override would
    outlive its own expiry, which is the one thing the effective window exists
    to prevent.
    """
    region_payload = dict(region_payload)
    name = region_payload["region"]
    zone = region_payload["agroZone"]

    for hazard in ("flood", "drought"):
        block = dict(region_payload[hazard])
        region_payload[hazard] = block
        override = overrides.get((name, hazard))
        if override:
            block["computed"] = {"score": block["score"], "band": block["band"]}
            block["band"] = override["band"]
            block["overridden"] = True
            block["source"] = "gmet-bulletin"
            block["headline"] = override["headline"]
            block["issuedBy"] = override["issuedBy"]
            block["issuedAt"] = override["issuedAt"]
            block["effectiveTo"] = override["effectiveTo"]
            block["advisories"] = override["advisories"] or advisories_for(hazard, override["band"], zone)
        else:
            block["overridden"] = False
            block["source"] = "open-meteo"
            block["advisories"] = advisories_for(hazard, block["band"], zone)

    return region_payload


def _summarise(regions: list[dict]) -> dict:
    """National roll-up. Counts, not averages -- an average across sixteen
    regions hides the one region that is actually in trouble."""
    def counts(hazard: str) -> dict:
        tally = {name: 0 for name, _ in SEVERITY_BANDS}
        tally["unavailable"] = 0
        for region in regions:
            tally[region[hazard]["band"]] = tally.get(region[hazard]["band"], 0) + 1
        return tally

    def worst(hazard: str) -> dict | None:
        ranked = [r for r in regions if r[hazard].get("score") is not None]
        if not ranked:
            return None
        top = max(ranked, key=lambda r: (BAND_ORDER.get(r[hazard]["band"], 0), r[hazard]["score"]))
        return {
            "region": top["region"],
            "score": top[hazard]["score"],
            "band": top[hazard]["band"],
            "overridden": top[hazard].get("overridden", False),
        }

    def elevated(hazard: str) -> int:
        return sum(1 for r in regions if BAND_ORDER.get(r[hazard]["band"], 0) >= BAND_ORDER["moderate"])

    return {
        "regionCount": len(regions),
        "floodBands": counts("flood"),
        "droughtBands": counts("drought"),
        "floodElevated": elevated("flood"),
        "droughtElevated": elevated("drought"),
        "highestFlood": worst("flood"),
        "highestDrought": worst("drought"),
        "overriddenCount": sum(
            1 for r in regions for h in ("flood", "drought") if r[h].get("overridden")
        ),
    }


def _strip_series(region_payload: dict) -> dict:
    """Summary rows do not need 97 days of series data per region."""
    trimmed = dict(region_payload)
    trimmed.pop("series", None)
    discharge = dict(trimmed.get("discharge") or {})
    discharge.pop("dates", None)
    discharge.pop("values", None)
    trimmed["discharge"] = discharge
    return trimmed


@app.get("/api/hazards/summary")
async def hazard_summary(background: BackgroundTasks):
    await hazard_runtime.ensure_fresh()
    snapshot, _ = hazard_runtime.cached_snapshot()

    if not snapshot:
        return {
            "success": True,
            "data": {
                "regions": [],
                "national": None,
                "unavailable": True,
                **hazard_runtime.metadata(),
            },
        }

    # Serve what we have immediately and revalidate behind the response, so a
    # page load is never held open by a slow upstream.
    if hazard_runtime.is_stale():
        background.add_task(hazard_runtime.refresh, False)

    with get_connection() as connection:
        overrides = _active_overrides(connection)

    regions = [
        _strip_series(_apply_overrides(payload, overrides))
        for payload in snapshot.values()
    ]

    return {
        "success": True,
        "data": {
            "regions": regions,
            "national": _summarise(regions),
            "unavailable": False,
            **hazard_runtime.metadata(),
        },
    }


def _strip_series(cell: dict) -> dict:
    """The map's copy of a cell, without its 15-day chart series.

    The series is 90 numbers per cell per variable; across 165 cells that is
    roughly 100 KB the map never draws. It is served instead by
    `/api/outlook/subseasonal/series`, one cell at a time, when a district is
    actually selected.
    """
    trimmed = dict(cell)
    for variable in ("rainfall", "temperature"):
        reading = trimmed.get(variable)
        if reading:
            trimmed[variable] = {key: value for key, value in reading.items() if key != "series"}
    return trimmed


@app.get("/api/outlook/subseasonal")
async def subseasonal_outlook(background: BackgroundTasks):
    """The weeks 2-to-4 outlook over the model's own grid.

    Serves the 165-point GEFS field, each cell carrying both the tercile
    probabilities and the deterministic ensemble mean. Admin boundaries are the
    client's business: it already ships Ghana's regions and districts, and
    overlaying them here would put the same geometry in two places.

    Same serve-then-revalidate shape as `hazard_summary`: a stale snapshot is
    returned immediately and refreshed behind the response, so a page load never
    waits on the ensemble fetch.

    `unavailable` means nothing could be computed at all. A *missing baseline*
    no longer empties the response, because the deterministic field needs none --
    those cells simply carry no probabilities, and the client shows the
    deterministic view for them.
    """
    await s2s_runtime.ensure_fresh()
    snapshot, _ = s2s_runtime.cached_snapshot()

    if not snapshot:
        return {
            "success": True,
            "data": {
                "cells": [],
                "unavailable": True,
                **s2s_runtime.metadata(),
            },
        }

    if s2s_runtime.is_stale():
        background.add_task(s2s_runtime.refresh, False)

    return {
        "success": True,
        "data": {
            "cells": [_strip_series(cell) for cell in snapshot.values()],
            "unavailable": False,
            **s2s_runtime.metadata(),
        },
    }


@app.get("/api/precipitation/field")
async def precipitation_field(background: BackgroundTasks):
    """Hourly rainfall over Ghana's land grid, for the rain map's forecast half.

    Proxied rather than fetched by the app, which is the exception the rain map
    forces. `fetchCurrentBatch` in the client goes direct and is right to: it is
    32 points for a display strip. This is several hundred, and Open-Meteo
    weights a request by its location count, so direct it would consume the free
    tier in proportion to how many people open the screen. Cached here it is one
    upstream call an hour for everyone. See `precip_runtime` for the arithmetic
    that fixes the interval.

    Same serve-then-revalidate shape as `subseasonal_outlook`: a stale snapshot
    is returned immediately and refreshed behind the response, so opening the map
    never waits on the fetch.

    The grid travels with the values because the two are positional -- every row
    of `values` is parallel to `grid` -- and a client that inferred the lattice
    itself would silently mis-draw the whole field the day either side changed
    its rounding.
    """
    await precip_runtime.ensure_fresh()
    snapshot, _ = precip_runtime.cached_snapshot()

    if not snapshot:
        return {
            "success": True,
            "data": {
                "grid": [],
                "times": [],
                "values": [],
                "unavailable": True,
                **precip_runtime.metadata(),
            },
        }

    if precip_runtime.is_stale():
        background.add_task(precip_runtime.refresh, False)

    return {
        "success": True,
        "data": {
            "grid": [[lat, lng] for lat, lng in precip_runtime.GRID],
            "times": snapshot["times"],
            "values": snapshot["values"],
            "unavailable": False,
            **precip_runtime.metadata(),
        },
    }


@app.get("/api/outlook/subseasonal/series")
async def subseasonal_series(lat: float, lng: float):
    """One grid cell's day-by-day ensemble spread, for the detail chart.

    Read straight from the cached snapshot -- the members were reduced when the
    field was fetched, so selecting a district costs no upstream call. Returns
    404 rather than an empty series when the place falls outside the grid, so a
    bad coordinate is a visible error rather than a flat chart.
    """
    await s2s_runtime.ensure_fresh()
    cell = s2s_runtime.cell_at(lat, lng)
    if not cell:
        raise HTTPException(status_code=404, detail="No subseasonal outlook covers that location.")

    return {
        "success": True,
        "data": {
            "id": cell["id"],
            "lat": cell["lat"],
            "lng": cell["lng"],
            "rainfall": (cell.get("rainfall") or {}).get("series"),
            "temperature": (cell.get("temperature") or {}).get("series"),
            **s2s_runtime.metadata(),
        },
    }


@app.get("/api/hazards/regions/{region}")
async def hazard_region(region: str, background: BackgroundTasks):
    resolved = resolve_region(region)
    if not resolved:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown region '{region}'.")

    await hazard_runtime.ensure_fresh()
    snapshot, _ = hazard_runtime.cached_snapshot()
    payload = snapshot.get(resolved)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Hazard data is not available yet. Try again shortly.",
        )

    if hazard_runtime.is_stale():
        background.add_task(hazard_runtime.refresh, False)

    with get_connection() as connection:
        overrides = _active_overrides(connection)

    return {
        "success": True,
        "data": {
            **_apply_overrides(payload, overrides),
            **hazard_runtime.metadata(),
        },
    }


@app.get("/api/hazards/methodology")
def hazard_methodology():
    """Everything needed to audit a score, served to the UI disclosure panel."""
    return {
        "success": True,
        "data": {
            "baseline": hazard_runtime.CLIMATOLOGY.get("baseline") or CLIMATOLOGY_LABEL,
            "dischargeBaseline": (
                hazard_runtime.CLIMATOLOGY.get("dischargeBaseline") or DISCHARGE_CLIMATOLOGY_LABEL
            ),
            "bands": [{"band": name, "minScore": minimum} for name, minimum in SEVERITY_BANDS],
            "floodWeights": FLOOD_WEIGHTS,
            "droughtWeights": DROUGHT_WEIGHTS,
            "sources": DATA_SOURCES,
            "limits": HAZARD_LIMITS,
        },
    }


@app.get("/api/hazards/overrides")
def list_hazard_overrides(includeExpired: bool = False):
    clause = "" if includeExpired else (
        "WHERE effective_from <= CURRENT_TIMESTAMP "
        "AND (effective_to IS NULL OR effective_to >= CURRENT_TIMESTAMP)"
    )
    with get_connection() as connection:
        rows = connection.execute(
            f"""
            SELECT id, region, hazard, band, headline, advisory_json, issued_by,
                   effective_from, effective_to, created_at
            FROM hazard_overrides {clause}
            ORDER BY effective_from DESC, id DESC
            """
        ).fetchall()

    return {
        "success": True,
        "data": [
            {
                "id": row["id"],
                "region": row["region"],
                "hazard": row["hazard"],
                "band": row["band"],
                "headline": row["headline"],
                "advisories": parse_json_list(row["advisory_json"]),
                "issuedBy": row["issued_by"],
                "effectiveFrom": row["effective_from"],
                "effectiveTo": row["effective_to"],
            }
            for row in rows
        ],
    }


@app.post("/api/hazards/overrides")
def create_hazard_override(
    payload: HazardOverrideRequest,
    current_user: dict = Depends(get_current_user),
):
    resolved = resolve_region(payload.region)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown region '{payload.region}'.",
        )
    if payload.band not in BAND_ORDER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Band must be one of: {', '.join(BAND_ORDER)}.",
        )

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO hazard_overrides
                (region, hazard, band, headline, advisory_json, issued_by,
                 effective_from, effective_to, created_by)
            VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?)
            """,
            (
                resolved,
                payload.hazard,
                payload.band,
                payload.headline,
                json_dumps(payload.advisories or []),
                payload.issuedBy,
                payload.effectiveFrom,
                payload.effectiveTo,
                current_user["id"],
            ),
        )
        override_id = cursor.lastrowid

    return {"success": True, "data": {"id": override_id, "region": resolved}}


@app.delete("/api/hazards/overrides/{override_id}")
def delete_hazard_override(override_id: int, current_user: dict = Depends(get_current_user)):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id FROM hazard_overrides WHERE id = ?", (override_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Override not found.")
        connection.execute("DELETE FROM hazard_overrides WHERE id = ?", (override_id,))

    return {"success": True, "data": {"id": override_id}}


@app.post("/api/hazards/refresh")
async def refresh_hazards(current_user: dict = Depends(get_current_user)):
    updated = await hazard_runtime.refresh(force=True)
    return {
        "success": updated,
        "data": hazard_runtime.metadata(),
        "message": "Hazard indices refreshed." if updated else "Refresh failed; cached data retained.",
    }
