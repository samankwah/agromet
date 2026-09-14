import { useState, useCallback } from 'react';

/**
 * The market region the reader has selected, remembered across pages.
 *
 * Regional pricing is the difference between "maize costs GH₵299" and "maize
 * costs GH₵299 where I am", so it would be irritating to re-pick it every time
 * a card is opened. The grid and the commodity page are never mounted at the
 * same time, so a shared localStorage key is enough — no context needed.
 *
 * An empty string means the national average, which is the default.
 */

const STORAGE_KEY = 'agromet:market-region';

export default function useMarketRegion() {
  const [region, setRegionState] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return window.localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const setRegion = useCallback((next) => {
    setRegionState(next);
    try {
      if (next) {
        window.localStorage.setItem(STORAGE_KEY, next);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Region preference simply stops persisting; the page still works.
    }
  }, []);

  return [region, setRegion];
}
