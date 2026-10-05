import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FaAndroid, FaDownload, FaFlask, FaQrcode } from "react-icons/fa";
import PageTitle from "../components/PageTitle";
import Breadcrumb from "../components/common/Breadcrumb";
import T from "../components/common/T";
import { MOBILE_APP, appStoreUrl, playStoreUrl } from "../config/mobileApp";
import { detectPlatform } from "../utils/detectPlatform";

/*
 * Badge sizing.
 *
 * Apple's SVG badge has no padding: its black rounded box fills the whole
 * 119.66 x 40 viewBox. Google's PNG badge is 646 x 250 but the visible badge
 * is only the 564 x 168 box inside it, with 41px of clear space on every side
 * (measured from the alpha channel). Set both images to the same CSS height and
 * the Play badge looks about a third smaller.
 *
 * So the Play image is drawn 250/168 times taller than the target height and
 * pulled in by the padding with a negative margin. Its visible box then matches
 * the Apple badge exactly, and the artwork itself is never cropped or redrawn.
 */
const APPLE_RATIO = 119.66407 / 40;
const PLAY_SRC = { width: 646, height: 250, padding: 41, visible: 168 };

const externalLinkProps = { target: "_blank", rel: "noopener noreferrer" };

const AppStoreBadge = ({ href, height }) => (
  <a href={href} {...externalLinkProps} className="inline-block rounded-[10px]">
    <img
      src="/badges/app-store-badge.svg"
      alt="Download on the App Store"
      width={Math.round(height * APPLE_RATIO)}
      height={height}
      style={{ height, width: "auto" }}
      className="block"
    />
  </a>
);

AppStoreBadge.propTypes = {
  href: PropTypes.string.isRequired,
  height: PropTypes.number.isRequired,
};

const PlayBadge = ({ href, height }) => {
  const scale = height / PLAY_SRC.visible;
  const imgHeight = PLAY_SRC.height * scale;
  const inset = -PLAY_SRC.padding * scale;
  return (
    <a href={href} {...externalLinkProps} className="inline-block rounded-[10px]">
      <img
        src="/badges/google-play-badge.png"
        alt="Get it on Google Play"
        width={Math.round(PLAY_SRC.width * scale)}
        height={Math.round(imgHeight)}
        style={{ height: imgHeight, width: "auto", margin: inset }}
        className="block max-w-none"
      />
    </a>
  );
};

PlayBadge.propTypes = {
  href: PropTypes.string.isRequired,
  height: PropTypes.number.isRequired,
};

/** Plain stand-in for a store that is not live yet. Never an altered badge. */
const ComingSoon = ({ children, height }) => (
  <span
    className="inline-flex items-center rounded-full border border-neo-border bg-neo-bg px-5 text-sm font-medium text-neo-muted"
    style={{ minHeight: height }}
  >
    <T>{children}</T>
  </span>
);

ComingSoon.propTypes = {
  children: PropTypes.string.isRequired,
  height: PropTypes.number.isRequired,
};

const AppleOption = ({ height }) => {
  const href = appStoreUrl();
  return href ? (
    <AppStoreBadge href={href} height={height} />
  ) : (
    <ComingSoon height={height}>Coming soon to the App Store</ComingSoon>
  );
};

AppleOption.propTypes = { height: PropTypes.number.isRequired };

const PlayOption = ({ height }) => {
  const href = playStoreUrl();
  return href ? (
    <PlayBadge href={href} height={height} />
  ) : (
    <ComingSoon height={height}>Coming soon to Google Play</ComingSoon>
  );
};

PlayOption.propTypes = { height: PropTypes.number.isRequired };

const apkLabel = () => {
  const { version, sizeMb } = MOBILE_APP.apk;
  if (version && sizeMb) {
    return { text: "Download the app file (version {version}, {size} MB)", vars: { version, size: sizeMb } };
  }
  if (version) return { text: "Download the app file (version {version})", vars: { version } };
  if (sizeMb) return { text: "Download the app file ({size} MB)", vars: { size: sizeMb } };
  return { text: "Download the app file", vars: undefined };
};

const ApkLink = () => {
  const { text, vars } = apkLabel();
  return (
    <a href={MOBILE_APP.apk.url} className="neo-button text-sm" download>
      <FaDownload className="w-4 h-4" aria-hidden="true" />
      <T vars={vars}>{text}</T>
    </a>
  );
};

const QrBlock = () => (
  <div className="flex flex-col items-center text-center">
    <img
      src="/app-qr.svg"
      width={180}
      height={180}
      alt="QR code to open this page on your phone"
      className="rounded-lg bg-white p-2"
    />
    <p className="mt-3 text-sm font-medium text-neo-text break-all">{MOBILE_APP.shortUrl}</p>
  </div>
);

const Card = ({ title, icon: Icon, children }) => (
  <section className="neo-surface p-6 sm:p-8">
    <h2 className="text-xl font-semibold text-neo-text mb-4 flex items-center gap-3">
      {Icon && (
        <span className="inline-flex w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
      )}
      <T>{title}</T>
    </h2>
    {children}
  </section>
);

Card.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
};

const Steps = ({ steps }) => (
  <ol className="space-y-2 text-base text-neo-muted">
    {steps.map((step, index) => (
      <li key={step} className="flex items-start gap-3">
        <span className="inline-flex w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold items-center justify-center flex-shrink-0">
          {index + 1}
        </span>
        <span>
          <T>{step}</T>
        </span>
      </li>
    ))}
  </ol>
);

Steps.propTypes = { steps: PropTypes.arrayOf(PropTypes.string).isRequired };

const LARGE = 56;
const REGULAR = 48;

const AppDownload = () => {
  const [platform] = useState(() => detectPlatform());

  const hasApk = Boolean(MOBILE_APP.apk.url);
  const hasQr = Boolean(MOBILE_APP.shortUrl);
  const showTesting = Boolean(MOBILE_APP.android.testOptInUrl) && !MOBILE_APP.android.live;
  const iosId = MOBILE_APP.ios.appId;
  const iosLive = MOBILE_APP.ios.live;

  // Safari's Smart App Banner. Added here rather than in index.html so it only
  // appears on this page, and only once the App Store listing is real.
  useEffect(() => {
    if (!iosId || !iosLive || typeof document === "undefined") return undefined;
    const meta = document.createElement("meta");
    meta.name = "apple-itunes-app";
    meta.content = `app-id=${iosId}`;
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [iosId, iosLive]);

  return (
    <>
      <PageTitle title="Get the app" />
      <div className="neo-page min-h-screen relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20 relative">
          <Breadcrumb label="Get the app" />

          {/* Hero */}
          <header className="mb-8 text-center">
            <img
              src="/badges/app-icon.png"
              alt=""
              width={96}
              height={96}
              className="mx-auto mb-5 w-24 h-24 rounded-[22px] border border-neo-border"
            />
            <h1 className="text-3xl sm:text-4xl font-bold text-neo-text tracking-tight mb-3">
              {MOBILE_APP.name}
            </h1>
            <p className="text-base sm:text-lg text-neo-muted leading-relaxed max-w-xl mx-auto">
              <T>Farm weather, alerts and advice for farmers in Ghana. Free to download.</T>
            </p>
          </header>

          <div className="space-y-6">
            {/* Best for this device */}
            <Card title="Best for your phone">
              {platform === "android" && (
                <div className="flex flex-col items-center gap-4">
                  <PlayOption height={LARGE} />
                  {hasApk && (
                    <a
                      href="#apk"
                      className="text-sm font-medium text-neo-muted underline hover:text-neo-accent-strong"
                    >
                      <T>No Google Play? Get the app file instead.</T>
                    </a>
                  )}
                </div>
              )}

              {platform === "ios" && (
                <div className="flex flex-col items-center">
                  <AppleOption height={LARGE} />
                </div>
              )}

              {platform === "desktop" && (
                <div className="flex flex-col items-center gap-6">
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <AppleOption height={REGULAR} />
                    <PlayOption height={REGULAR} />
                  </div>
                  {hasQr && (
                    <>
                      <p className="text-sm text-neo-muted text-center">
                        <T>On a computer? Point your phone camera at this code.</T>
                      </p>
                      <QrBlock />
                    </>
                  )}
                </div>
              )}
            </Card>

            {/* Every option, Apple first, same height */}
            <Card title="All ways to get the app">
              <div className="flex flex-wrap items-center gap-4">
                <AppleOption height={REGULAR} />
                <PlayOption height={REGULAR} />
              </div>
            </Card>

            {hasApk && (
              <div id="apk" className="scroll-mt-28">
                <Card title="Android phone without Google Play" icon={FaAndroid}>
                  <div className="mb-5">
                    <ApkLink />
                  </div>
                  <Steps
                    steps={[
                      "Tap Download.",
                      "Open the file.",
                      "If your phone asks, allow your browser to install apps.",
                      "Tap Install.",
                    ]}
                  />
                  <p className="mt-4 text-sm text-neo-muted">
                    <T>If you have Google Play, updates will come from there.</T>
                  </p>
                  {MOBILE_APP.apk.sha256 && (
                    <details className="mt-4 text-sm text-neo-muted">
                      <summary className="cursor-pointer font-medium text-neo-text">
                        <T>Check the file (advanced)</T>
                      </summary>
                      <p className="mt-2">
                        <T>SHA-256 of the file:</T>
                      </p>
                      <code className="neo-inset mt-1 block p-3 text-xs break-all">
                        {MOBILE_APP.apk.sha256}
                      </code>
                    </details>
                  )}
                </Card>
              </div>
            )}

            {showTesting && (
              <Card title="Help us test on Android" icon={FaFlask}>
                <Steps
                  steps={[
                    "Join the test with your Google account.",
                    "Tap Become a tester.",
                    "Install the app from Google Play.",
                  ]}
                />
                <p className="mt-4 text-sm text-neo-muted">
                  <T>Please keep the app on your phone for 14 days.</T>
                </p>
                <a
                  href={MOBILE_APP.android.testOptInUrl}
                  {...externalLinkProps}
                  className="neo-button-primary mt-5 text-sm"
                >
                  <T>Join the test</T>
                </a>
              </Card>
            )}

            {/* On a phone the desktop card has no code, so offer it for sharing. */}
            {hasQr && platform !== "desktop" && (
              <Card title="Share with a friend" icon={FaQrcode}>
                <p className="text-sm text-neo-muted mb-4">
                  <T>A friend can point their phone camera at this code to open this page.</T>
                </p>
                <QrBlock />
              </Card>
            )}
          </div>

          <footer className="mt-10 space-y-2 text-xs text-neo-muted text-center">
            <p>
              <T>
                Apple and the Apple logo are trademarks of Apple Inc. App Store is a service mark of
                Apple Inc. Google Play and the Google Play logo are trademarks of Google LLC.
              </T>
            </p>
            <p>
              <T>AgroMet Ghana is an independent app. It is not an official government app.</T>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default AppDownload;
