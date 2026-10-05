/**
 * Store and download details for the AgroMet Ghana mobile app.
 *
 * Every link on the /app page is built from this one object, so launch day
 * means editing values here and nothing else. Until a value is filled the page
 * shows "Coming soon" for that store, or leaves the section out.
 *
 * How to fill each value at launch:
 *
 *   shortUrl            The public address of the /app page on this site, for
 *                       example "https://<site>/app". Set it once the site's
 *                       domain is final, then generate public/app-qr.svg for
 *                       that exact URL. The QR block only shows when it is set.
 *
 *   ios.appId           The numeric Apple ID from App Store Connect, App
 *                       Information, "Apple ID" (digits only, no "id" prefix).
 *   ios.live            true only after the app is "Ready for Distribution" and
 *                       the listing opens in a browser. Also turns on Safari's
 *                       Smart App Banner.
 *
 *   android.packageName The Android applicationId. Already final.
 *   android.live        true only after the Play listing is public. Until then
 *                       play.google.com returns 404 for this package.
 *   android.testOptInUrl
 *                       The closed or open testing opt-in link from Play
 *                       Console, Testing, "Join on the web", for example
 *                       "https://play.google.com/apps/testing/com.agromet.ghana".
 *                       Shown only while android.live is false.
 *
 *   apk.url             A direct link to a signed release .apk for phones
 *                       without Google Play. Leave empty to hide the section.
 *   apk.version         The versionName of that build, for example "1.0.0".
 *   apk.sizeMb          File size in MB as text, for example "38".
 *   apk.sha256          SHA-256 of the file (`certutil -hashfile app.apk SHA256`
 *                       on Windows, `shasum -a 256 app.apk` elsewhere).
 */
export const MOBILE_APP = {
  name: 'AgroMet Ghana',
  shortUrl: 'https://agromet-ghana.vercel.app/app',
  ios: {
    appId: '',
    live: false,
  },
  android: {
    packageName: 'com.agromet.ghana',
    live: false,
    testOptInUrl: '',
  },
  apk: {
    url: '',
    version: '',
    sizeMb: '',
    sha256: '',
  },
};

/** App Store listing URL, or null until the app is live there. */
export function appStoreUrl(app = MOBILE_APP) {
  const { appId, live } = app.ios;
  return appId && live ? `https://apps.apple.com/app/id${appId}` : null;
}

/** Google Play listing URL, or null until the app is live there. */
export function playStoreUrl(app = MOBILE_APP) {
  const { packageName, live } = app.android;
  return packageName && live
    ? `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}`
    : null;
}

export default MOBILE_APP;
