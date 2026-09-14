/**
 * Flood and drought data access.
 *
 * Follows the shape of marketIntelligenceService.js -- a small class over
 * API_ENDPOINTS with a shared in-flight promise -- with one deliberate
 * difference that is worth stating plainly:
 *
 *   **There is no offline fallback dataset here.**
 *
 * marketIntelligenceService keeps hardcoded prices and merges live data over
 * them, which is right for prices: a slightly stale cassava price is still
 * useful. A stale or invented flood risk is a safety problem. When the backend
 * cannot be reached, this service surfaces the failure and the page says so,
 * rather than rendering plausible-looking numbers that nobody measured.
 *
 * The backend already degrades gracefully on its own side (it serves its last
 * good reading flagged `stale`), so the only case reaching here is the backend
 * itself being unreachable.
 */

import API_CONFIG, { API_ENDPOINTS } from "../config/apiConfig";

const REQUEST_TIMEOUT = API_CONFIG.DEFAULT_TIMEOUT;

class HazardService {
  constructor() {
    this.baseURL = API_CONFIG.BACKEND_BASE_URL;
    // Keyed by request URL so the map, the region list and the detail panel
    // share one network request instead of racing three.
    this.inFlight = new Map();
  }

  async request(path, { signal, timeout = REQUEST_TIMEOUT } = {}) {
    const url = `${this.baseURL}${path}`;

    if (this.inFlight.has(url)) return this.inFlight.get(url);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    // Abort the shared request only if the caller that owns it goes away.
    if (signal) {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    const promise = (async () => {
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const body = await response.json();
        if (!body?.success) {
          throw new Error(body?.message || "Request was not successful");
        }
        return body.data;
      } finally {
        clearTimeout(timer);
        this.inFlight.delete(url);
      }
    })();

    this.inFlight.set(url, promise);
    return promise;
  }

  getSummary(options) {
    return this.request(API_ENDPOINTS.HAZARDS.SUMMARY, options);
  }

  getRegion(region, options) {
    return this.request(API_ENDPOINTS.HAZARDS.REGION(region), options);
  }

  getMethodology(options) {
    return this.request(API_ENDPOINTS.HAZARDS.METHODOLOGY, options);
  }
}

const hazardService = new HazardService();

export default hazardService;
