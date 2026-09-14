import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * The market cart.
 *
 * This used to be useState inside the market page, which was fine while the
 * grid was the only market screen. Now that a card opens a commodity page of
 * its own, a cart scoped to one component would empty itself the moment a
 * shopper looked at what they were buying. It lives here instead, and is
 * mirrored into localStorage so it also survives a reload.
 */

const STORAGE_KEY = 'agromet:market-cart';

const MarketCartContext = createContext();

export const useMarketCart = () => {
  const context = useContext(MarketCartContext);
  if (!context) {
    throw new Error('useMarketCart must be used within a MarketCartProvider');
  }
  return context;
};

/** Read the saved cart. Bad or absent JSON just means an empty cart. */
function readStoredCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const MarketCartProvider = ({ children }) => {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // A full or blocked storage quota should not take the market down;
      // the cart simply stops surviving reloads.
    }
  }, [items]);

  /**
   * Add a commodity, or bump its quantity if it is already in the cart.
   *
   * Keyed on the catalogue slug rather than the price slug, so the three
   * peppers are three separate lines even though they share a price.
   */
  const add = useCallback((commodity, price, unit, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.slug === commodity.slug);
      if (existing) {
        return prev.map((item) =>
          item.slug === commodity.slug ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [
        ...prev,
        {
          slug: commodity.slug,
          name: commodity.name,
          image: commodity.image,
          price: price ?? 0,
          unit: unit ?? 'per bag',
          qty,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((slug, nextQty) => {
    if (nextQty < 1) return;
    setItems((prev) => prev.map((item) => (item.slug === slug ? { ...item, qty: nextQty } : item)));
  }, []);

  const remove = useCallback((slug) => {
    setItems((prev) => prev.filter((item) => item.slug !== slug));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items]
  );
  const count = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);

  const value = useMemo(
    () => ({ items, add, updateQty, remove, clear, total, count }),
    [items, add, updateQty, remove, clear, total, count]
  );

  return <MarketCartContext.Provider value={value}>{children}</MarketCartContext.Provider>;
};

MarketCartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default MarketCartContext;
