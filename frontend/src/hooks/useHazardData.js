import { useCallback, useEffect, useRef, useState } from "react";

import hazardService from "../services/hazardService";

/**
 * National flood/drought summary for all sixteen regions.
 *
 * No polling. These indices are recomputed a few times a day at most, so a
 * timer would burn requests to redraw identical numbers. Instead the data is
 * revalidated when the tab regains focus and the reading is more than an hour
 * old, which is when a returning reader might actually be looking at something
 * out of date.
 */
const REVALIDATE_AFTER_MS = 60 * 60 * 1000;

export function useHazardData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedAt = useRef(0);
  const mounted = useRef(true);

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const summary = await hazardService.getSummary();
      if (!mounted.current) return;
      setData(summary);
      setError(null);
      fetchedAt.current = Date.now();
    } catch (cause) {
      if (!mounted.current) return;
      // Keep whatever is already on screen; a failed revalidation should not
      // blank a page that is currently showing usable data.
      setError(cause?.message || "Unable to load flood and drought data");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - fetchedAt.current < REVALIDATE_AFTER_MS) return;
      load({ quiet: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  return {
    regions: data?.regions || [],
    national: data?.national || null,
    meta: data || null,
    unavailable: Boolean(data?.unavailable),
    loading,
    error,
    refresh: () => load({ quiet: true }),
  };
}

/**
 * Full detail for one region, including the chart series the summary omits.
 */
export function useRegionHazard(region) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(Boolean(region));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!region) {
      setDetail(null);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    setLoading(true);

    hazardService
      .getRegion(region, { signal: controller.signal })
      .then((payload) => {
        if (!active) return;
        setDetail(payload);
        setError(null);
      })
      .catch((cause) => {
        if (!active || controller.signal.aborted) return;
        setError(cause?.message || "Unable to load this region");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [region]);

  return { detail, loading, error };
}
