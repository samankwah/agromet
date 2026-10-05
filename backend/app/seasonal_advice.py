"""Farm advice for one region's season, read from the seasonal outlook.

Pure functions, no I/O. ``routers/outlook.py`` feeds them the stored outlook
(``seasonal_runtime.current()``) and lays any advice an administrator has
published over the result.

**How a reading becomes advice.** Each variable's reading is reduced to one
*condition* (``classify``): early, usual, late and so on, from the tercile the
ensemble leans to. Every (variable, condition) pair has exactly one entry in
``RULES``: a title, a one line summary and two to four things to do. All of the
wording is in that one table, so an agronomist or GMet can review it in one
place, the same way ``agro_season`` keeps every threshold in one block.

**What this is not.** It is general guidance from a model outlook, not an
advisory issued by an extension service. ``NOTE`` says so, and the app shows it
beside every list of actions.

House rules for the copy: short common words for farmers, no dashes.
"""

from __future__ import annotations

from datetime import date

from .agro_season import MONTH_NAMES, SEASON_VARIABLES, SEASONS, WINDOW_VARIABLES, WINDOWS, next_season_year, sector_of

# ---------------------------------------------------------------------------
# What each season covers
# ---------------------------------------------------------------------------

# The three months whose rain and heat speak for the season when the caller
# does not pick a window: the heart of each season's rains.
PRIMARY_WINDOW = {"southern-major": "MAM", "southern-minor": "SON", "northern": "JAS"}

LABELS = {
    "onset": "Rains start",
    "earlyDrySpell": "Early dry spell",
    "lateDrySpell": "Late dry spell",
    "cessation": "Rains end",
    "rainfallTotal": "Rainfall",
    "rainyDays": "Rainy days",
    "temperature": "Temperature",
}

ORDER = ("onset", "earlyDrySpell", "lateDrySpell", "cessation", "rainfallTotal", "rainyDays", "temperature")

NOTE = (
    "This advice is worked out from the seasonal outlook. It is not an official advisory. "
    "For big decisions, also ask your local extension officer."
)

# ---------------------------------------------------------------------------
# Conditions
# ---------------------------------------------------------------------------

# Which word each tercile means, per variable. For dates, "below" is earlier.
_TERCILE_WORDS = {
    "onset": {"below": "early", "normal": "usual", "above": "late"},
    "cessation": {"below": "early", "normal": "usual", "above": "late"},
    "earlyDrySpell": {"below": "short", "normal": "usual", "above": "long"},
    "lateDrySpell": {"below": "short", "normal": "usual", "above": "long"},
    "rainfallTotal": {"below": "less", "normal": "usual", "above": "more"},
    "rainyDays": {"below": "fewer", "normal": "usual", "above": "more"},
    "temperature": {"below": "cooler", "normal": "usual", "above": "warmer"},
}


def classify(variable: str, reading: dict | None) -> str:
    """One word for a reading: the condition the advice is chosen by.

    ``normal_only`` when the season is beyond the model's reach, ``dry_season``
    for a rainfall window that is normally dry, ``no_signal`` when the chances
    do not lean, otherwise the tercile the ensemble leans to.
    """
    if not reading or not reading.get("available"):
        return "normal_only"
    if variable in ("rainfallTotal", "rainyDays") and reading.get("dryWindow"):
        return "dry_season"
    if reading.get("noSignal"):
        return "no_signal"
    category = reading.get("category")
    if category not in ("below", "normal", "above"):
        probabilities = reading.get("probabilities") or {}
        if not probabilities:
            return "no_signal"
        category = max(("below", "normal", "above"), key=lambda name: probabilities.get(name) or 0)
    return _TERCILE_WORDS[variable][category]


# ---------------------------------------------------------------------------
# The advice itself
# ---------------------------------------------------------------------------

Rule = dict  # {"title": str, "summary": str, "actions": list[str]}

_CHECK_WEEK = "Check the 7 day forecast before you plant."

RULES: dict[tuple[str, str], Rule] = {
    # Rains start
    ("onset", "early"): {
        "title": "Rains may start early",
        "summary": "The rains may start earlier than usual.",
        "actions": [
            "Clear the land and buy seed now, so you are ready when the rains settle.",
            "Plant when the soil is wet to the depth of your hand, not on the first shower.",
            _CHECK_WEEK,
        ],
    },
    ("onset", "usual"): {
        "title": "Rains should start on time",
        "summary": "The rains should start about the usual time.",
        "actions": [
            "Plan to plant at your usual time.",
            "Plant when the soil is well wet, not on the first shower.",
            _CHECK_WEEK,
        ],
    },
    ("onset", "late"): {
        "title": "Rains may start late",
        "summary": "The rains may start later than usual.",
        "actions": [
            "Wait for the rains to settle before you plant. A first heavy shower can be a false start.",
            "Think about early maturing seed, so the crop is ready before the rains end.",
            "Keep your seed dry and safe until you plant.",
        ],
    },
    # Dry spells
    ("earlyDrySpell", "long"): {
        "title": "Long dry spell after planting",
        "summary": "Young crops may face a long dry spell soon after planting.",
        "actions": [
            "Choose drought tolerant or early maturing seed.",
            "Mulch to keep water in the soil.",
            "Do not plant every field on the same day. Spread planting over two or three weeks.",
        ],
    },
    ("earlyDrySpell", "usual"): {
        "title": "Usual dry spells after planting",
        "summary": "Dry spells soon after planting should be about as usual.",
        "actions": [
            "Weed on time so weeds do not take water from young plants.",
            "Mulch where you can.",
        ],
    },
    ("earlyDrySpell", "short"): {
        "title": "Short dry spells after planting",
        "summary": "Dry spells soon after planting may be short. Good for young crops.",
        "actions": [
            "Weed often. Weeds grow fast in wet weather.",
            "Look for leaf disease after long wet spells.",
        ],
    },
    ("lateDrySpell", "long"): {
        "title": "Long dry spell late in the season",
        "summary": "A long dry spell may come late in the season, when crops flower and fill.",
        "actions": [
            "Plant early maturing seed so the crop flowers before the dry spell.",
            "Mulch and weed well so the crop keeps more water.",
            "Be ready to harvest and dry your crop quickly.",
        ],
    },
    ("lateDrySpell", "usual"): {
        "title": "Usual dry spells late in the season",
        "summary": "Dry spells late in the season should be about as usual.",
        "actions": [
            "Keep fields weeded while crops flower and fill.",
            "Mulch where you can.",
        ],
    },
    ("lateDrySpell", "short"): {
        "title": "Short dry spells late in the season",
        "summary": "Dry spells late in the season may be short.",
        "actions": [
            "Look for leaf and pod disease in long wet spells.",
            "Plan to dry the harvest well, as the air may stay damp.",
        ],
    },
    # Rains end
    ("cessation", "early"): {
        "title": "Rains may end early",
        "summary": "The rains may stop earlier than usual.",
        "actions": [
            "Plant early so the crop is ready before the rains stop.",
            "Choose early maturing seed.",
            "Get drying and storage ready for an early harvest.",
        ],
    },
    ("cessation", "usual"): {
        "title": "Rains should end on time",
        "summary": "The rains should stop about the usual time.",
        "actions": [
            "Plan your harvest for the usual time.",
            "Get drying and storage ready before the season ends.",
        ],
    },
    ("cessation", "late"): {
        "title": "Rains may end late",
        "summary": "The rains may go on later than usual.",
        "actions": [
            "A longer season can suit seed that takes longer to mature.",
            "Harvest on dry days and dry the crop well, to stop mould.",
            "Store grain off the ground in a dry place.",
        ],
    },
    # Rainfall
    ("rainfallTotal", "less"): {
        "title": "Less rain than usual",
        "summary": "These months may bring less rain than usual.",
        "actions": [
            "Save water. Mulch, and make ridges or pits to hold the rain.",
            "Choose drought tolerant crops and seed.",
            "Care well for fewer fields rather than planting many.",
        ],
    },
    ("rainfallTotal", "usual"): {
        "title": "About the usual rain",
        "summary": "These months should bring about the usual amount of rain.",
        "actions": [
            "Follow your usual plan.",
            "Clear drains and keep the soil covered.",
        ],
    },
    ("rainfallTotal", "more"): {
        "title": "More rain than usual",
        "summary": "These months may bring more rain than usual.",
        "actions": [
            "Clear drains, and make raised beds in low fields.",
            "Do not plant where water stands after rain.",
            "Look out for pests and disease that like wet weather.",
        ],
    },
    # Rainy days
    ("rainyDays", "fewer"): {
        "title": "Fewer rainy days than usual",
        "summary": "Rain may fall on fewer days than usual, often in heavy bursts.",
        "actions": [
            "Make ridges or pits so heavy rain soaks in and does not run off.",
            "Mulch to keep water in the soil between rains.",
        ],
    },
    ("rainyDays", "usual"): {
        "title": "About the usual rainy days",
        "summary": "Rain should fall on about the usual number of days.",
        "actions": ["Follow your usual plan."],
    },
    ("rainyDays", "more"): {
        "title": "More rainy days than usual",
        "summary": "Rain may fall on more days than usual.",
        "actions": [
            "Plan spraying and field work for dry days.",
            "Look for leaf disease in long wet spells.",
        ],
    },
    # Temperature
    ("temperature", "warmer"): {
        "title": "Warmer than usual",
        "summary": "These months may be warmer than usual.",
        "actions": [
            "Give poultry and animals shade and clean water all day.",
            "Water young plants early in the morning or late in the day.",
            "Mulch to keep the soil cool.",
        ],
    },
    ("temperature", "usual"): {
        "title": "About the usual heat",
        "summary": "Heat should be about as usual for these months.",
        "actions": ["Keep birds and animals in the shade at midday."],
    },
    ("temperature", "cooler"): {
        "title": "Cooler than usual",
        "summary": "These months may be cooler than usual.",
        "actions": [
            "Crops may grow a little slower. Allow more time before harvest.",
            "Keep young birds warm at night.",
        ],
    },
}

# Conditions that read the same for every variable.
_GENERAL: dict[str, Rule] = {
    "no_signal": {
        "title": "No clear sign",
        "summary": "The outlook does not lean either way for this.",
        "actions": [
            "Plan as you would in a normal year.",
            "Follow the 7 day forecast as the season comes.",
        ],
    },
    "normal_only": {
        "title": "Forecast not ready yet",
        "summary": "This is too far ahead to forecast. The usual figure is shown instead.",
        "actions": [
            "Plan as you would in a normal year.",
            "Check back when the forecast is ready.",
        ],
    },
    "dry_season": {
        "title": "Dry season",
        "summary": "Little rain falls here in these months.",
        "actions": [
            "Grow crops only where you can water them.",
            "Store water and feed for your animals.",
        ],
    },
}

CONDITIONS = {
    variable: tuple(dict.fromkeys(list(words.values()))) + tuple(_GENERAL)
    for variable, words in _TERCILE_WORDS.items()
}


def month_label(year_month: str | None) -> str | None:
    """'2027-05' as 'May 2027'."""
    if not year_month:
        return None
    try:
        year, month = (int(part) for part in year_month.split("-")[:2])
        return f"{MONTH_NAMES[month - 1]} {year}"
    except (ValueError, IndexError):
        return None


# Too far ahead to forecast: plan with what usually happens. Each entry is
# (title, summary, actions) with {n} for the usual figure. The last action,
# when the forecast comes, is added in ``rule_for``.
_USUALLY: dict[str, tuple[str, str, list[str]]] = {
    "onset": (
        "Plan for the usual start",
        "In most years the rains start {n}.",
        ["Have land and seed ready before then.", "Plant when the soil is well wet, not on the first shower."],
    ),
    "earlyDrySpell": (
        "Plan for the usual early dry spell",
        "In most years the longest dry spell soon after planting is about {n}.",
        ["Mulch and weed on time to carry young plants through it."],
    ),
    "lateDrySpell": (
        "Plan for the usual late dry spell",
        "In most years the longest dry spell late in the season is about {n}.",
        ["Choose seed that flowers before the late dry spell."],
    ),
    "cessation": (
        "Plan for the usual end",
        "In most years the rains stop {n}.",
        ["Choose seed that is ready before then.", "Have drying and storage ready by then."],
    ),
    "rainfallTotal": (
        "Plan for the usual rain",
        "In most years these months bring about {n} of rain.",
        ["Plan crops that suit this much rain."],
    ),
    "rainyDays": (
        "Plan for the usual rainy days",
        "In most years rain falls on about {n} in these months.",
        ["Plan field work around the rainy days."],
    ),
    "temperature": (
        "Plan for the usual heat",
        "In most years the days reach about {n} in these months.",
        ["Plan shade and water for birds and animals."],
    ),
}


def _usual_figure(variable: str, display: str | None) -> str | None:
    """The normal as it reads mid sentence: 'in week 2 of May', '4 days'."""
    if not display:
        return None
    if variable in ("onset", "cessation"):
        if not display.startswith("Week"):
            return None
        return "in w" + display[1:]
    return display


def rule_for(variable: str, condition: str, reading: dict | None = None) -> Rule:
    rule = RULES.get((variable, condition)) or _GENERAL.get(condition) or _GENERAL["no_signal"]
    rule = {**rule, "actions": list(rule["actions"])}
    if condition == "normal_only":
        reading = reading or {}
        ready = month_label(reading.get("availableFrom"))
        later = f"Check back from {ready} for the forecast." if ready else "Check back when the forecast is ready."
        usual = _usual_figure(variable, reading.get("normalDisplay"))
        if usual and variable in _USUALLY:
            title, summary, actions = _USUALLY[variable]
            # When the forecast comes is said once, in the headline, not
            # under each figure: every figure is ready in a different month.
            rule = {
                "title": title.format(n=usual),
                "summary": summary.format(n=usual),
                "actions": list(actions),
            }
        else:
            if ready:
                rule["summary"] = f"This is too far ahead to forecast. The forecast will be ready from {ready}."
            rule["actions"] = [rule["actions"][0], later]
    if condition == "dry_season" and variable == "rainyDays":
        rule["summary"] = "Few rainy days are usual here in these months."
    return rule


# ---------------------------------------------------------------------------
# One region's season
# ---------------------------------------------------------------------------

def main_season(region: str) -> str:
    return "northern" if sector_of(region) == "north" else "southern-major"


def seasons_for(region: str) -> tuple[str, ...]:
    return tuple(key for key, season in SEASONS.items() if season.sector == sector_of(region))


def _cell(block: dict | None, region: str) -> dict | None:
    for cell in (block or {}).get("cells") or []:
        if cell.get("region") == region:
            return cell
    return None


def _reading_view(reading: dict | None) -> dict:
    """What the app needs to show a reading beside its advice."""
    reading = reading or {}
    keys = ("available", "availableFrom", "display", "normalDisplay", "probabilities", "category", "confidence", "noSignal", "dryWindow")
    return {key: reading.get(key) for key in keys if reading.get(key) is not None}


def _condition(variable: str, reading: dict | None) -> dict:
    condition = classify(variable, reading)
    rule = rule_for(variable, condition, reading)
    return {
        "variable": variable,
        "label": LABELS[variable],
        "condition": condition,
        "title": rule["title"],
        "summary": rule["summary"],
        "actions": rule["actions"],
        "reading": _reading_view(reading),
    }


# How much each condition matters to a farmer, for picking the headline.
_HEADLINE_WEIGHT = {"late": 3, "long": 3, "less": 3, "early": 2, "more": 2, "warmer": 1, "fewer": 1, "short": 1, "cooler": 1}


def headline(conditions: list[dict]) -> str:
    """The one sentence a farmer should read if they read nothing else."""
    if conditions and all(item["condition"] == "normal_only" for item in conditions):
        ready = next((month_label(item["reading"].get("availableFrom")) for item in conditions if item["reading"].get("availableFrom")), None)
        if ready:
            return f"Too early to forecast this season. Plan with what usually happens until the forecast is ready in {ready}."
        return "Too early to forecast this season. Plan with what usually happens."
    ranked = sorted(
        (item for item in conditions if item["condition"] in _HEADLINE_WEIGHT),
        key=lambda item: (-_HEADLINE_WEIGHT[item["condition"]], ORDER.index(item["variable"])),
    )
    if ranked:
        return ranked[0]["summary"]
    return "A fairly normal season is likely. Plan as you would in a usual year."


def region_advice(outlook: dict, region: str, season_key: str | None = None, window_key: str | None = None) -> dict:
    """The full advice for one region's season.

    ``season_key`` defaults to the region's main season, and ``window_key`` to
    that season's heart (``PRIMARY_WINDOW``). Raises ``KeyError`` for a season
    the region does not have, or a window that does not exist.
    """
    season_key = season_key or main_season(region)
    if season_key not in seasons_for(region):
        raise KeyError(season_key)
    window_key = window_key or PRIMARY_WINDOW[season_key]
    if window_key not in WINDOWS:
        raise KeyError(window_key)

    season_block = (outlook.get("seasons") or {}).get(season_key) or {}
    window_block = (outlook.get("windows") or {}).get(window_key) or {}
    season_cell = _cell(season_block, region) or {}
    window_cell = _cell(window_block, region) or {}

    conditions = [_condition(variable, season_cell.get(variable)) for variable in SEASON_VARIABLES]
    conditions += [_condition(variable, window_cell.get(variable)) for variable in WINDOW_VARIABLES]
    conditions.sort(key=lambda item: ORDER.index(item["variable"]))

    season = SEASONS[season_key]
    return {
        "region": region,
        "season": {"key": season_key, "label": season.label, "year": season_block.get("year")},
        "window": {"key": window_key, "label": WINDOWS[window_key][1], "year": window_block.get("year")},
        "headline": headline(conditions),
        "conditions": conditions,
        "note": NOTE,
    }


def apply_published(advice: dict, rows: list[dict]) -> dict:
    """Lay text an administrator published over the rules.

    A row with ``variable`` set replaces that condition's title, summary and
    actions. A row with no variable replaces the headline. Fields left empty in
    a row keep the rule's text.
    """
    if not rows:
        return {**advice, "source": "rules", "issuedBy": None, "issuedAt": None}
    by_variable = {row.get("variable"): row for row in rows}
    conditions = []
    for item in advice["conditions"]:
        row = by_variable.get(item["variable"])
        if row:
            item = {
                **item,
                "title": row.get("title") or item["title"],
                "summary": row.get("summary") or item["summary"],
                "actions": row.get("actions") or item["actions"],
                "published": True,
            }
        conditions.append(item)
    whole = by_variable.get(None) or {}
    newest = max(rows, key=lambda row: row.get("created_at") or "")
    return {
        **advice,
        "headline": whole.get("summary") or advice["headline"],
        "conditions": conditions,
        "source": "published",
        "issuedBy": newest.get("issued_by"),
        "issuedAt": newest.get("created_at"),
    }


def season_year_today(season_key: str, today: date | None = None) -> int:
    """The year a season's advice is for when the outlook has no block yet."""
    return next_season_year(SEASONS[season_key], today or date.today())
