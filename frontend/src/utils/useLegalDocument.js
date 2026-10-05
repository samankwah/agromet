import { useEffect, useState } from 'react';
import API_CONFIG from '../config/apiConfig';

/**
 * Load a legal document (privacy, terms) from GET /api/legal/{slug}.
 *
 * The backend is the single source of the wording, shared with the mobile app.
 * Response shape (backend/app/schemas.py LegalDocumentResponse):
 *   { success, slug, title, summary, updated,
 *     sections: [{ title, body, items?: string[] }] }
 *
 * Returns { status, document }, where status is 'loading' | 'ready' | 'error'.
 * On 'error' the page renders its own built-in copy, so a backend outage never
 * leaves the page blank.
 */
export function useLegalDocument(slug) {
  const [state, setState] = useState({ status: 'loading', document: null });

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_CONFIG.DEFAULT_TIMEOUT);

    setState({ status: 'loading', document: null });

    (async () => {
      try {
        const response = await fetch(
          `${API_CONFIG.BACKEND_BASE_URL}/api/legal/${encodeURIComponent(slug)}`,
          { signal: controller.signal, headers: { Accept: 'application/json' } },
        );
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const body = await response.json();
        if (!body?.success || !Array.isArray(body.sections) || body.sections.length === 0) {
          throw new Error('Legal document response was not usable');
        }
        if (active) setState({ status: 'ready', document: body });
      } catch {
        // A timeout also lands here, as an abort while still active.
        if (active) setState({ status: 'error', document: null });
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [slug]);

  return state;
}

export default useLegalDocument;
