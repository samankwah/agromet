"""Static published copy (FAQ, Terms, Privacy) and the two write paths that
need none of it: a farmer's message from the Contact screen, and a report of
an AI answer they think is wrong."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Request, status

from .. import config
from ..database import get_connection
from ..rate_limit import Limiter, client_ip, client_keys
from ..schemas import (
    AiReportRequest,
    AiReportResponse,
    ContactMessageRequest,
    ContactMessageResponse,
    FAQResponse,
    LegalDocumentResponse,
    LegalSection,
)

router = APIRouter(tags=["content"])

# Reports cost nothing to answer, so this is not about a bill. It stops one
# script from burying the real reports under thousands of fake ones. A farmer
# reports an answer now and then, never dozens in a quarter of an hour.
ai_report_limiter = Limiter(limit=10, window_seconds=900, daily_limit=50)

FAQ_MESSAGES = {
    "when-to-plant-maize": "In Ghana, maize is typically planted at the start of the rains. Target April to June for the major season and September to November for the minor season, depending on local rainfall onset.",
    "when-to-plant-rice": "Rice planting depends on irrigation and region. Rainfed systems usually start with the first dependable rains, while irrigated rice can be staggered year-round.",
    "maize-fertilizer": "Use a soil test where possible. A practical starting point is a balanced basal NPK application followed by a nitrogen top-dress at early vegetative growth.",
    "rainy-season-farming": "Prepare fields early, use drainage where needed, and match planting windows to local rainfall onset instead of fixed calendar dates.",
}

# The legal documents, served as structured sections. Kept here beside
# FAQ_MESSAGES because both are static published copy rather than data.
#
# One source of truth on purpose: the mobile app renders these in place and the
# website's /privacy and /terms pages read the same endpoint, so the wording
# lives once instead of in copies that drift.
#
# Built per request rather than once at import because the contact line depends
# on `config.CONTACT_EMAIL`, and an unset address must read as a pointer to the
# Contact screen, not as "email us at ." Every claim here was checked against
# what the code does when it was written. If a router starts storing or sending
# something new, this text is part of that change.
#
# Plain words on purpose: farmers are the audience. No dashes in the copy, the
# clients render it as is.
LEGAL_UPDATED = "October 2026"


def how_to_reach_us() -> str:
    """The contact phrase, written to sit mid sentence after "please"."""
    if config.CONTACT_EMAIL:
        return f"email us at {config.CONTACT_EMAIL} or use the Contact screen in the app"
    return "use the Contact screen in the app"


def legal_documents() -> dict[str, dict]:
    reach = how_to_reach_us()
    return {
        "terms": {
            "title": "Terms of Service",
            "summary": "The simple rules for using AgroMet Ghana.",
            "updated": LEGAL_UPDATED,
            "sections": [
                {
                    "title": "About these terms",
                    "body": "These terms cover the AgroMet Ghana app and website. By using AgroMet, you agree to them. If you do not agree, please do not use AgroMet.",
                },
                {
                    "title": "Not a government service",
                    "body": "AgroMet Ghana is an independent app. It is not an official government app or service, and it does not speak for any government agency. For official warnings, follow the Ghana Meteorological Agency and your local authorities.",
                },
                {
                    "title": "Forecasts and advice are a guide",
                    "body": "Weather forecasts, flood and drought outlooks, alerts and farming advice in AgroMet are a guide, not a promise. Weather can change fast. Use them together with your own knowledge and local advice before you make big decisions.",
                },
                {
                    "title": "AI answers can be wrong",
                    "body": "AgroMet AI and the crop check use computers to make their answers. They can be wrong or miss things. Before you spray, treat a sick crop or spend money, check with your extension officer. If an answer looks wrong, you can report it in the app.",
                },
                {
                    "title": "Market prices are examples",
                    "body": "The market prices in the app are examples to help you plan. They are not real price quotes, and they are not an offer to buy or sell.",
                },
                {
                    "title": "Using AgroMet fairly",
                    "body": "When you use AgroMet, please:",
                    "items": [
                        "Use it only for lawful purposes",
                        "Do not try to break, overload or misuse the app or our server",
                        "Do not send anything harmful or rude, or anyone else's private details",
                        "If you have a staff account on the website, it is for you alone. Keep your password safe and do not share it",
                    ],
                },
                {
                    "title": "Limits of our responsibility",
                    "body": "AgroMet is free and is given as it is. As far as the law allows, we are not responsible for any loss, damage or failed harvest that comes from using AgroMet or relying on it.",
                },
                {
                    "title": "Changes to these terms",
                    "body": "We may change these terms. When we do, we will change the date at the top. If you keep using AgroMet after a change, you accept the new terms.",
                },
                {
                    "title": "Contact us",
                    "body": f"If you have a question about these terms, please {reach}.",
                },
            ],
        },
        "privacy": {
            "title": "Privacy Policy",
            "summary": "What AgroMet Ghana collects, why we need it, and who we share it with.",
            "updated": LEGAL_UPDATED,
            "sections": [
                {
                    "title": "Who we are",
                    "body": "AgroMet Ghana is an independent app for farmers in Ghana. It is not an official government app, and it does not speak for any government agency. The weather data in the app comes from public weather services. This policy covers the AgroMet Ghana app and the AgroMet website.",
                },
                {
                    "title": "What we do not do",
                    "body": "AgroMet is free, and we keep it simple:",
                    "items": [
                        "We do not show ads",
                        "We do not sell your data",
                        "We do not track you across other apps or websites",
                        "You do not need an account, and the app does not ask for your name",
                    ],
                },
                {
                    "title": "Your location",
                    "body": "The app uses your location only if you allow it. Your phone uses it to find the nearest town and district, and your exact position stays on your phone. To get weather, the app asks our server or Open-Meteo for the weather at that town, not at your exact position. AgroMet AI is told the region, district and town you chose. You can turn location off at any time in your phone settings and pick a town yourself.",
                },
                {
                    "title": "Crop photos",
                    "body": "When you check a crop with a photo, the photo goes to our server and on to Kindwise, a plant health service, which looks at it and tells us what it finds. For some crops, such as cassava, your phone checks the photo itself and the photo does not leave your phone. We then send only the result and its advice to our server and to OpenAI, so it can be explained in plain words.",
                    "items": [
                        "We do not keep your photos on our server",
                        "Your past crop checks are saved on your phone, not on our server",
                        "If you are signed in to a staff account on the website, the result of a check (not the photo) is saved to that account",
                    ],
                },
                {
                    "title": "Voice questions",
                    "body": "If you ask a question by voice, the recording goes to our server and to OpenAI to turn your speech into text. The text comes back to you so you can check it before you send it. We do not keep the recording.",
                },
                {
                    "title": "AgroMet AI questions",
                    "body": "When you ask AgroMet AI a question, we send it to OpenAI together with the last few messages in the chat, the region, district, town and crops you chose in the app, and weather figures for that area, so the answer fits your farm. We do not send your name, phone number or email address.",
                    "items": [
                        "Your questions are not saved on our servers. The chat stays on your phone",
                        "OpenAI is outside Ghana, so your question leaves Ghana to be answered",
                        "Please do not put personal details, ID numbers or payment details in a question",
                    ],
                },
                {
                    "title": "Reporting an AI answer",
                    "body": "If you report an answer from AgroMet AI or a crop check, we save the answer, the reason you chose, any note you add and your app ID, so we can look at it and make the answers better.",
                },
                {
                    "title": "Your app ID",
                    "body": "The first time the app opens, it makes a random ID on your phone. It is not linked to your name, phone number or email. The app sends it with AI questions, crop explanations and reports. We use it to limit how many AI questions one phone can ask each day, and to read reports from the same phone together. Deleting the app removes this ID from your phone.",
                },
                {
                    "title": "Your internet address",
                    "body": "Like any online service, our server sees the internet address your phone connects from. We use it, together with the app ID, to stop misuse. We hold it in memory for a short time and do not save it in our database. Our hosting service may keep basic request logs for a short time.",
                },
                {
                    "title": "Contact messages",
                    "body": "When you use the Contact screen, we save your name, your email or phone number, the subject and your message, so we can reply to you.",
                },
                {
                    "title": "Reminders and alerts",
                    "body": "Reminders and weather alerts are set up on your phone. We do not send them from our server, and we do not collect a notification token from your phone.",
                },
                {
                    "title": "Services we use",
                    "body": "We share only what each service needs to do its job. Some of these services are outside Ghana.",
                    "items": [
                        "OpenAI, to answer AgroMet AI questions, explain crop checks in plain words and turn voice into text",
                        "Kindwise, to check crop photos for pests and disease",
                        "Open-Meteo, for weather forecasts",
                        "CARTO, for maps",
                        "NASA GIBS, for satellite images",
                        "Expo, to deliver app updates",
                        "Vercel, which runs our server",
                        "Neon, which hosts our database",
                        "Google Translate, to translate text on the website when you choose another language",
                    ],
                },
                {
                    "title": "How long we keep data",
                    "body": "We do not keep your photos, voice recordings or AI questions. We keep contact messages and AI reports only as long as we need them to reply, to review answers and to improve the app.",
                },
                {
                    "title": "Asking us to delete your data",
                    "body": f"To ask us to delete your data, please {reach}. Tell us the name and the email or phone number you used on the Contact screen, or roughly when you sent a report, so we can find it. Anything saved only on your phone is removed when you delete the app.",
                },
                {
                    "title": "Children",
                    "body": f"AgroMet Ghana is not made for children under 13, and we do not knowingly collect data from them. If you think a child has sent us personal details, please {reach} and we will delete them.",
                },
                {
                    "title": "Keeping your data safe",
                    "body": "The app and website talk to our server over a secure connection (HTTPS). Only the people who run AgroMet can read the messages and reports we store. No system is perfectly safe, so please do not send private details we do not need.",
                },
                {
                    "title": "The website",
                    "body": "The website uses your browser's storage only to remember your settings and keep staff signed in. It does not use advertising or tracking cookies.",
                },
                {
                    "title": "Changes to this policy",
                    "body": "We may change this policy. When we do, we will change the date at the top and show the new policy in the app and on the website.",
                },
                {
                    "title": "Contact us",
                    "body": f"If you have a question about this policy, please {reach}.",
                },
            ],
        },
    }


@router.get("/api/faq/{topic}", response_model=FAQResponse)
def faq(topic: str):
    message = FAQ_MESSAGES.get(topic)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ topic not found.")
    return FAQResponse(success=True, message=message)


@router.post("/api/contact", response_model=ContactMessageResponse, status_code=status.HTTP_201_CREATED)
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


@router.post("/api/ai-reports", response_model=AiReportResponse, status_code=status.HTTP_201_CREATED)
def submit_ai_report(
    payload: AiReportRequest,
    request: Request,
    x_device_id: str | None = Header(default=None, alias="X-Device-Id"),
):
    """Stores a farmer's report of an AI answer for someone to review.

    Unauthenticated for the same reason the contact form is. The device id is
    optional and stored clipped the way the limiter clips it, so a run of
    reports from one phone reads together. Validation lives in the schema.
    """
    keys = client_keys(x_device_id, client_ip(request.headers, request.client.host if request.client else None))
    decision = ai_report_limiter.check(keys)
    if not decision.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You have sent a lot of reports. Please try again later.",
            headers={"Retry-After": str(decision.retry_after)},
        )
    ai_report_limiter.record(keys)

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO ai_reports (kind, reason, text, note, device_id)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload.kind,
                payload.reason,
                payload.text.strip(),
                (payload.note or "").strip() or None,
                (x_device_id or "").strip()[:64] or None,
            ),
        )
        reference = cursor.lastrowid

    return AiReportResponse(
        success=True,
        message="Thank you. We will look at this answer.",
        reference=reference,
    )


@router.get("/api/legal/{slug}", response_model=LegalDocumentResponse)
def legal_document(slug: str):
    document = legal_documents().get(slug)
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
