/**
 * Guess which app store suits the visitor's device.
 *
 * Only used to pick which badge to show first; every option stays on the page,
 * so a wrong guess costs a scroll, not a dead end.
 *
 * @param {string} [ua] user agent string
 * @param {{ platform?: string, maxTouchPoints?: number }} [nav] navigator-like object
 * @returns {'android' | 'ios' | 'desktop'}
 */
export function detectPlatform(
  ua = typeof navigator !== 'undefined' ? navigator.userAgent : '',
  nav = typeof navigator !== 'undefined' ? navigator : undefined,
) {
  const agent = typeof ua === 'string' ? ua : '';

  if (/android/i.test(agent)) return 'android';
  if (/iPhone|iPad|iPod/.test(agent)) return 'ios';

  // iPadOS 13+ Safari asks for the desktop site by default and reports itself
  // as a Mac. A Mac with a multi-touch screen is, in practice, an iPad.
  if (nav && nav.platform === 'MacIntel' && Number(nav.maxTouchPoints) > 1) {
    return 'ios';
  }

  return 'desktop';
}

export default detectPlatform;
