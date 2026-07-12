import API_CONFIG from "../config/apiConfig";

export const OPEN_METEO_SOURCE = "Open-Meteo";
export const GHANA_TIMEZONE = "Africa/Accra";

const FORECAST_ENDPOINT = `${API_CONFIG.OPEN_METEO_BASE_URL}/forecast`;
const GEOCODING_ENDPOINT = `${API_CONFIG.OPEN_METEO_GEOCODING_BASE_URL}/search`;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_RETRIES = 2;
const MIN_REQUEST_GAP_MS = 1200;
const MAX_RETRY_DELAY_MS = 30000;
const RETRIABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

const responseCache = new Map();
const inFlightRequests = new Map();
let requestQueue = Promise.resolve();
let nextRequestAt = 0;

const CURRENT_VARIABLES = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation",
  "rain",
  "weather_code",
  "is_day",
  "cloud_cover",
  "pressure_msl",
  "wind_speed_10m",
  "wind_direction_10m",
  "visibility",
];

const HOURLY_VARIABLES = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation_probability",
  "precipitation",
  "weather_code",
  "is_day",
  "wind_speed_10m",
];

const DAILY_VARIABLES = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "apparent_temperature_min",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "relative_humidity_2m_mean",
];

const WEATHER_CODES = {
  0: { condition: "Sunny", slug: "clear", summary: "Clear sky" },
  1: { condition: "Mostly Sunny", slug: "clear", summary: "Mainly clear" },
  2: {
    condition: "Partly Cloudy",
    slug: "partly-cloudy",
    summary: "Partly cloudy",
  },
  3: { condition: "Cloudy", slug: "cloudy", summary: "Overcast" },
  45: { condition: "Foggy", slug: "cloudy", summary: "Fog" },
  48: { condition: "Foggy", slug: "cloudy", summary: "Depositing rime fog" },
  51: { condition: "Drizzle", slug: "drizzle", summary: "Light drizzle" },
  53: { condition: "Drizzle", slug: "drizzle", summary: "Moderate drizzle" },
  55: { condition: "Drizzle", slug: "drizzle", summary: "Dense drizzle" },
  56: {
    condition: "Freezing Drizzle",
    slug: "drizzle",
    summary: "Light freezing drizzle",
  },
  57: {
    condition: "Freezing Drizzle",
    slug: "drizzle",
    summary: "Dense freezing drizzle",
  },
  61: { condition: "Light Rain", slug: "rain", summary: "Slight rain" },
  63: { condition: "Rain", slug: "rain", summary: "Moderate rain" },
  65: { condition: "Heavy Rain", slug: "rain", summary: "Heavy rain" },
  66: {
    condition: "Freezing Rain",
    slug: "rain",
    summary: "Light freezing rain",
  },
  67: {
    condition: "Freezing Rain",
    slug: "rain",
    summary: "Heavy freezing rain",
  },
  71: { condition: "Snow", slug: "cloudy", summary: "Slight snow fall" },
  73: { condition: "Snow", slug: "cloudy", summary: "Moderate snow fall" },
  75: { condition: "Heavy Snow", slug: "cloudy", summary: "Heavy snow fall" },
  77: { condition: "Snow Grains", slug: "cloudy", summary: "Snow grains" },
  80: { condition: "Rain Showers", slug: "rain", summary: "Slight rain showers" },
  81: {
    condition: "Rain Showers",
    slug: "rain",
    summary: "Moderate rain showers",
  },
  82: {
    condition: "Heavy Showers",
    slug: "rain",
    summary: "Violent rain showers",
  },
  85: { condition: "Snow Showers", slug: "cloudy", summary: "Slight snow showers" },
  86: { condition: "Snow Showers", slug: "cloudy", summary: "Heavy snow showers" },
  95: {
    condition: "Thunderstorm",
    slug: "thunderstorm",
    summary: "Thunderstorm",
  },
  96: {
    condition: "Thunderstorm",
    slug: "thunderstorm",
    summary: "Thunderstorm with slight hail",
  },
  99: {
    condition: "Thunderstorm",
    slug: "thunderstorm",
    summary: "Thunderstorm with heavy hail",
  },
};

const buildUrl = (endpoint, params) => {
  const url = new URL(endpoint);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
};

const sleep = (ms) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

const parseRetryAfterMs = (retryAfter) => {
  if (!retryAfter) return null;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const retryDate = new Date(retryAfter).getTime();
  if (Number.isFinite(retryDate)) {
    return Math.max(0, retryDate - Date.now());
  }

  return null;
};

const getRetryDelayMs = (error, attempt) => {
  const retryAfterMs = parseRetryAfterMs(error.retryAfter);
  if (retryAfterMs !== null) {
    return Math.min(retryAfterMs, MAX_RETRY_DELAY_MS);
  }

  return Math.min(1500 * 2 ** attempt, MAX_RETRY_DELAY_MS);
};

const queueRequest = (requestFn) => {
  const queuedRequest = requestQueue.then(async () => {
    const waitMs = Math.max(0, nextRequestAt - Date.now());
    if (waitMs > 0) {
      await sleep(waitMs);
    }

    try {
      return await requestFn();
    } finally {
      nextRequestAt = Date.now() + MIN_REQUEST_GAP_MS;
    }
  });

  requestQueue = queuedRequest.catch(() => {});
  return queuedRequest;
};

const fetchJsonOnce = async (url, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message =
        errorBody?.reason || `Open-Meteo request failed: ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.retryAfter = response.headers.get("Retry-After");
      throw error;
    }

    return await response.json();
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
};

const fetchJsonWithRetry = async (
  url,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = DEFAULT_RETRIES
) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await queueRequest(() => fetchJsonOnce(url, timeoutMs));
    } catch (error) {
      const canRetry =
        RETRIABLE_STATUSES.has(error.status) && attempt < retries;

      if (!canRetry) {
        throw error;
      }

      const retryDelayMs = getRetryDelayMs(error, attempt);
      nextRequestAt = Math.max(nextRequestAt, Date.now() + retryDelayMs);
    }
  }

  throw new Error("Open-Meteo request failed.");
};

const fetchJson = async (
  url,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  { cacheTtlMs = DEFAULT_CACHE_TTL_MS, retries = DEFAULT_RETRIES } = {}
) => {
  const cached = responseCache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url);
  }

  const request = fetchJsonWithRetry(url, timeoutMs, retries)
    .then((data) => {
      if (cacheTtlMs > 0) {
        responseCache.set(url, {
          data,
          expiresAt: Date.now() + cacheTtlMs,
        });
      }

      return data;
    })
    .finally(() => {
      inFlightRequests.delete(url);
    });

  inFlightRequests.set(url, request);
  return request;
};

const normalizeWeatherBundle = (raw, options = {}) => {
  const daily = normalizeDailyForecast(raw);

  return {
    current: normalizeCurrentWeather(raw),
    daily,
    hourly: daily.reduce((acc, day) => {
      acc[day.date] = normalizeHourlyForecast(
        raw,
        day.date,
        options.hourlyInterval || 3
      );
      return acc;
    }, {}),
    raw,
    source: OPEN_METEO_SOURCE,
    updatedAt: raw.current?.time || new Date().toISOString(),
  };
};

const roundNumber = (value, digits = 0) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;

  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
};

const formatNumber = (value, digits = 0) => {
  const rounded = roundNumber(value, digits);
  return rounded === null ? "--" : String(rounded);
};

const normalizeIsDay = (value) => {
  const numericValue = Number(value);
  if (numericValue === 1) return true;
  if (numericValue === 0) return false;
  return null;
};

export const describeWeatherCode = (code, { isDay = null } = {}) => {
  const numericCode = Number(code);

  if (isDay === false) {
    if (numericCode === 0) {
      return {
        condition: "Clear Night",
        slug: "clear-night",
        summary: "Clear night",
      };
    }

    if (numericCode === 1) {
      return {
        condition: "Mostly Clear",
        slug: "clear-night",
        summary: "Mainly clear night",
      };
    }
  }

  return WEATHER_CODES[numericCode] || {
    condition: "Variable Weather",
    slug: "partly-cloudy",
    summary: "Variable weather conditions",
  };
};

export const formatTemperature = (value) => `${formatNumber(value)}\u00B0C`;
export const formatPercent = (value) => `${formatNumber(value)}%`;
export const formatSpeed = (value) => `${formatNumber(value)} km/h`;
export const formatRainfall = (value) => `${formatNumber(value, 1)}mm`;
export const formatPressure = (value) => `${formatNumber(value)} hPa`;

export const formatVisibility = (value) => {
  const numericValue = roundNumber(value, 1);
  if (numericValue === null) return "--";

  const kilometres = numericValue > 100 ? numericValue / 1000 : numericValue;
  return `${roundNumber(kilometres, 1)}km`;
};

const toDisplayDate = (dateString) =>
  new Date(`${dateString}T00:00:00`).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
  });

const toDayName = (dateString, index) => {
  if (index === 0) return "Today";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
  });
};

const toHourLabel = (dateTimeString) =>
  new Date(dateTimeString).toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true,
  });

const getYesterdayTemperature = (raw) => {
  const currentTime = raw.current?.time;
  const hourly = raw.hourly || {};
  const times = hourly.time || [];
  const temperatures = hourly.temperature_2m || [];

  if (!currentTime || times.length === 0) return null;

  const targetTime = new Date(currentTime).getTime() - 24 * 60 * 60 * 1000;
  const nearest = times.reduce((best, time, index) => {
    const temperature = temperatures[index];
    if (!Number.isFinite(Number(temperature))) return best;

    const distance = Math.abs(new Date(time).getTime() - targetTime);
    if (!best || distance < best.distance) {
      return { temperature: Number(temperature), distance };
    }

    return best;
  }, null);

  return nearest?.distance <= 2 * 60 * 60 * 1000 ? nearest.temperature : null;
};

const getConversationalSummary = (current, raw, details) => {
  const currentTemperature = roundNumber(current.temperature_2m);
  const yesterdayTemperature = getYesterdayTemperature(raw);
  const rainfall = current.rain ?? current.precipitation ?? 0;

  const weatherPart = `${details.condition.toLowerCase()} now, ${formatRainfall(rainfall)} rain.`;

  if (currentTemperature === null || yesterdayTemperature === null) {
    return weatherPart;
  }

  const difference = roundNumber(currentTemperature - yesterdayTemperature, 1);
  const absoluteDifference = Math.abs(difference);

  if (absoluteDifference < 1) {
    return `About the same as yesterday, ${weatherPart}`;
  }

  if (difference >= 5) {
    return `Much warmer than yesterday, ${weatherPart}`;
  }

  if (difference >= 2) {
    return `Warmer than yesterday, ${weatherPart}`;
  }

  if (difference <= -5) {
    return `Much cooler than yesterday, ${weatherPart}`;
  }

  if (difference <= -2) {
    return `Cooler than yesterday, ${weatherPart}`;
  }

  return `Slightly ${difference > 0 ? "warmer" : "cooler"} than yesterday, ${weatherPart}`;
};

const normalizeCurrentWeather = (raw) => {
  const current = raw.current || {};
  const isDay = normalizeIsDay(current.is_day);
  const details = describeWeatherCode(current.weather_code, { isDay });
  const rainfall = current.rain ?? current.precipitation ?? 0;
  const temperature = roundNumber(current.temperature_2m);
  const windSpeed = roundNumber(current.wind_speed_10m);
  const yesterdayTemperature = getYesterdayTemperature(raw);
  const comparisonDelta =
    temperature !== null && yesterdayTemperature !== null
      ? roundNumber(temperature - yesterdayTemperature, 1)
      : null;

  return {
    temperature: formatTemperature(temperature),
    temperatureValue: temperature,
    apparentTemperature: formatTemperature(current.apparent_temperature),
    apparentTemperatureValue: roundNumber(current.apparent_temperature),
    condition: details.condition,
    conditionSlug: details.slug,
    summary: `${details.summary}. Rain ${formatRainfall(rainfall)}; wind ${formatSpeed(windSpeed)}.`,
    conversationalSummary: getConversationalSummary(current, raw, details),
    yesterdayTemperatureValue: yesterdayTemperature,
    comparisonDelta,
    humidity: formatPercent(current.relative_humidity_2m),
    humidityValue: roundNumber(current.relative_humidity_2m),
    windSpeed: formatSpeed(windSpeed),
    windSpeedValue: windSpeed,
    windDirectionValue: roundNumber(current.wind_direction_10m),
    rainfall: formatRainfall(rainfall),
    rainfallValue: roundNumber(rainfall, 1),
    visibility: formatVisibility(current.visibility),
    visibilityValue: roundNumber(current.visibility),
    pressure: formatPressure(current.pressure_msl),
    pressureValue: roundNumber(current.pressure_msl),
    cloudCoverValue: roundNumber(current.cloud_cover),
    weatherCode: current.weather_code,
    isDay,
    iconKey: details.slug,
    source: OPEN_METEO_SOURCE,
    sourceUrl: "https://open-meteo.com/en/docs",
    updatedAt: current.time || new Date().toISOString(),
  };
};

const normalizeDailyForecast = (raw) => {
  const daily = raw.daily || {};
  const dates = daily.time || [];
  const today = (raw.current?.time || new Date().toISOString()).slice(0, 10);

  return dates.filter((date) => date >= today).map((date, displayIndex) => {
    const index = dates.indexOf(date);
    const details = describeWeatherCode(daily.weather_code?.[index]);
    const highTemp = roundNumber(daily.temperature_2m_max?.[index]);
    const lowTemp = roundNumber(daily.temperature_2m_min?.[index]);
    const apparentHighTemp = roundNumber(daily.apparent_temperature_max?.[index]);
    const apparentLowTemp = roundNumber(daily.apparent_temperature_min?.[index]);
    const rainfallSum = roundNumber(daily.precipitation_sum?.[index], 1);
    const rainChance = roundNumber(daily.precipitation_probability_max?.[index]);
    const windSpeed = roundNumber(daily.wind_speed_10m_max?.[index]);
    const humidity = roundNumber(daily.relative_humidity_2m_mean?.[index]);

    return {
      date,
      displayDate: toDisplayDate(date),
      day: toDayName(date, displayIndex),
      highTemp,
      lowTemp,
      high: highTemp,
      low: lowTemp,
      apparentHighTemp,
      apparentLowTemp,
      condition: details.condition,
      conditionSlug: details.slug,
      summary: details.summary,
      rainfall: rainfallSum ?? 0,
      rainfallLabel: formatRainfall(rainfallSum),
      rainChance: rainChance ?? 0,
      windSpeed: windSpeed ?? 0,
      humidity: humidity ?? 0,
      weatherCode: daily.weather_code?.[index],
      source: OPEN_METEO_SOURCE,
    };
  });
};

const normalizeHourlyForecast = (raw, dateString, interval = 3) => {
  const hourly = raw.hourly || {};
  const times = hourly.time || [];
  const indexes = times
    .map((time, index) => ({ time, index }))
    .filter(({ time }) => !dateString || time.startsWith(dateString))
    .filter((_, index) => index % interval === 0)
    .slice(0, 8);

  return indexes.map(({ time, index }) => {
    const details = describeWeatherCode(hourly.weather_code?.[index], {
      isDay: normalizeIsDay(hourly.is_day?.[index]),
    });

    return {
      time: toHourLabel(time),
      temp: roundNumber(hourly.temperature_2m?.[index]),
      condition: details.slug,
      conditionText: details.condition,
      rainChance: roundNumber(hourly.precipitation_probability?.[index]) ?? 0,
      rainfall: roundNumber(hourly.precipitation?.[index], 1) ?? 0,
      humidity: roundNumber(hourly.relative_humidity_2m?.[index]) ?? 0,
      windSpeed: roundNumber(hourly.wind_speed_10m?.[index]) ?? 0,
    };
  });
};

export const fetchForecastByCoordinates = async ({
  lat,
  lng,
  lon,
  forecastDays = 7,
  pastDays = 1,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  timezone = GHANA_TIMEZONE,
} = {}) => {
  const longitude = lng ?? lon;

  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(longitude))) {
    throw new Error("Latitude and longitude are required for Open-Meteo weather.");
  }

  const url = buildUrl(FORECAST_ENDPOINT, {
    latitude: lat,
    longitude,
    current: CURRENT_VARIABLES.join(","),
    hourly: HOURLY_VARIABLES.join(","),
    daily: DAILY_VARIABLES.join(","),
    timezone,
    forecast_days: forecastDays,
    past_days: pastDays,
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
  });

  return fetchJson(url, timeoutMs);
};

export const fetchForecastsByCoordinates = async (
  locations = [],
  {
    forecastDays = 7,
    pastDays = 1,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    timezone = GHANA_TIMEZONE,
  } = {}
) => {
  if (!Array.isArray(locations) || locations.length === 0) {
    throw new Error("At least one location is required for Open-Meteo weather.");
  }

  const normalizedLocations = locations.map((location) => {
    const longitude = location.lng ?? location.lon ?? location.longitude;
    const latitude = location.lat ?? location.latitude;

    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      throw new Error("Latitude and longitude are required for Open-Meteo weather.");
    }

    return {
      lat: latitude,
      lng: longitude,
    };
  });

  const url = buildUrl(FORECAST_ENDPOINT, {
    latitude: normalizedLocations.map((location) => location.lat).join(","),
    longitude: normalizedLocations.map((location) => location.lng).join(","),
    current: CURRENT_VARIABLES.join(","),
    hourly: HOURLY_VARIABLES.join(","),
    daily: DAILY_VARIABLES.join(","),
    timezone,
    forecast_days: forecastDays,
    past_days: pastDays,
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
  });

  const data = await fetchJson(url, timeoutMs);
  return Array.isArray(data) ? data : [data];
};

export const getWeatherBundleByCoordinates = async (lat, lng, options = {}) => {
  const raw = await fetchForecastByCoordinates({ lat, lng, ...options });
  return normalizeWeatherBundle(raw, options);
};

export const getWeatherBundlesByCoordinates = async (locations, options = {}) => {
  const rawForecasts = await fetchForecastsByCoordinates(locations, options);

  return rawForecasts.map((raw, index) => ({
    input: locations[index],
    ...normalizeWeatherBundle(raw, options),
  }));
};

export const getCurrentWeatherByCoordinates = async (lat, lng, options = {}) => {
  const bundle = await getWeatherBundleByCoordinates(lat, lng, {
    forecastDays: 1,
    ...options,
  });

  return bundle.current;
};

export const getDailyForecastByCoordinates = async (lat, lng, days = 7) => {
  const bundle = await getWeatherBundleByCoordinates(lat, lng, {
    forecastDays: days,
  });

  return bundle.daily.slice(0, days);
};

export const geocodeLocation = async (name, options = {}) => {
  const trimmedName = String(name || "").trim();
  if (!trimmedName) throw new Error("Enter a location name.");

  const url = buildUrl(GEOCODING_ENDPOINT, {
    name: trimmedName,
    count: options.count || 8,
    language: "en",
    format: "json",
  });

  const data = await fetchJson(url, options.timeoutMs || DEFAULT_TIMEOUT_MS);
  const results = data.results || [];
  const match =
    results.find((result) => result.country_code === "GH") || results[0];

  if (!match) {
    throw new Error(`No Open-Meteo location found for "${trimmedName}".`);
  }

  return {
    name: match.name,
    admin1: match.admin1,
    country: match.country,
    countryCode: match.country_code,
    latitude: match.latitude,
    longitude: match.longitude,
    timezone: match.timezone || GHANA_TIMEZONE,
  };
};

export const getWeatherForLocationName = async (name, options = {}) => {
  const location = await geocodeLocation(name, options);
  const bundle = await getWeatherBundleByCoordinates(
    location.latitude,
    location.longitude,
    {
      forecastDays: options.forecastDays || 7,
      timezone: location.timezone || GHANA_TIMEZONE,
    }
  );

  return {
    location,
    ...bundle,
  };
};
