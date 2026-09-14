/**
 * Placing a market order.
 *
 * There is no payment gateway behind the market, and no order table in the
 * backend — orders are handed off to a human on WhatsApp or by phone. That is
 * a deliberate fit for how these commodities actually trade, but it does mean
 * the contact number has to be real: the previous implementation opened
 * `https://wa.me/?text=…` with no number at all, so the "order" went nowhere,
 * and the "Call to Order" button ran the same WhatsApp handler.
 *
 * Set VITE_MARKET_WHATSAPP (and optionally VITE_MARKET_PHONE) to the desk that
 * takes these orders, in full international form without a leading +.
 */

import { formatCedi } from './marketInsights';

/** Digits only — wa.me rejects spaces, dashes and a leading plus. */
function normalizeNumber(value) {
  return (value ?? '').replace(/[^\d]/g, '');
}

export const ORDER_WHATSAPP = normalizeNumber(import.meta.env.VITE_MARKET_WHATSAPP);
export const ORDER_PHONE = normalizeNumber(
  import.meta.env.VITE_MARKET_PHONE || import.meta.env.VITE_MARKET_WHATSAPP
);

/** True when a desk number is configured and ordering can actually complete. */
export const canPlaceOrder = Boolean(ORDER_WHATSAPP);

/** The message body a seller receives. Plain text — WhatsApp has no markup. */
export function buildOrderMessage(items, region) {
  const lines = items.map(
    (item) => `- ${item.name} x${item.qty} (${item.unit}) = ${formatCedi(item.price * item.qty)}`
  );
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return [
    "Hello, I'd like to place an order:",
    '',
    ...lines,
    '',
    `Total: ${formatCedi(total)}`,
    region ? `Region: ${region}` : null,
    '',
    'Please confirm availability.',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/** The wa.me link for an order, or null when no desk number is configured. */
export function buildWhatsAppOrderUrl(items, region) {
  if (!ORDER_WHATSAPP || items.length === 0) return null;
  return `https://wa.me/${ORDER_WHATSAPP}?text=${encodeURIComponent(buildOrderMessage(items, region))}`;
}

/** The tel: link for the order desk, or null when none is configured. */
export function buildCallUrl() {
  return ORDER_PHONE ? `tel:+${ORDER_PHONE}` : null;
}
