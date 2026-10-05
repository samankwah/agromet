import PageTitle from "../components/PageTitle";
import Breadcrumb from "../components/common/Breadcrumb";
import {
  FaShieldAlt,
  FaRegFileAlt,
  FaLock,
  FaUsers,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";
import T from "../components/common/T";
import { useLegalDocument } from "../utils/useLegalDocument";

// Icons cycle over whatever sections the backend sends, since the API carries
// wording only.
const SECTION_ICONS = [FaRegFileAlt, FaShieldAlt, FaLock, FaUsers, FaRegFileAlt];

// Built-in copy, shown only when GET /api/legal/privacy cannot be reached.
// Same shape as the API's LegalDocumentResponse so one renderer serves both.
const FALLBACK_DOCUMENT = {
  title: "Privacy Policy",
  updated: "April 2026",
  summary:
    "Your privacy matters to us. This Privacy Policy explains how AgroMet collects, uses, and safeguards the information you share with us.",
  sections: [
    {
      title: "Information We Collect",
      body: "We may collect the following types of information:",
      items: [
        "Personal identification information (name, email, phone)",
        "Usage data describing how you interact with our services",
        "Cookies and similar tracking technologies",
        "Location data when you opt in to localized advisories",
      ],
    },
    {
      title: "How We Use Your Information",
      body: "We use the information we collect to:",
      items: [
        "Provide, operate, and maintain the AgroMet platform",
        "Personalize advisories and recommendations to your location",
        "Communicate with you about updates, alerts, and support",
        "Analyze usage patterns to improve the product",
      ],
    },
    {
      title: "Data Security",
      body: "We take the security of your personal information seriously and implement administrative, technical, and physical safeguards designed to protect it against unauthorized access, alteration, disclosure, or destruction.",
    },
    {
      title: "Third-Party Services",
      body: "We may engage vetted third-party service providers to help us operate and improve AgroMet. These providers have access to your information only to perform tasks on our behalf and are contractually obligated to protect it.",
    },
    {
      title: "Changes to This Privacy Policy",
      body: "We may update this Privacy Policy from time to time. Material changes will be posted on this page with a new effective date. We encourage you to review this policy periodically.",
    },
  ],
};

const LoadingSections = () => (
  <div className="space-y-10 animate-pulse" aria-hidden="true">
    {[0, 1, 2].map((key) => (
      <div key={key}>
        <div className="h-7 w-1/2 rounded bg-neo-border mb-4" />
        <div className="h-4 w-full rounded bg-neo-border mb-2" />
        <div className="h-4 w-5/6 rounded bg-neo-border" />
      </div>
    ))}
  </div>
);

const PrivacyPolicy = () => {
  const { status, document: remoteDoc } = useLegalDocument("privacy");
  const loading = status === "loading";
  const doc = remoteDoc || FALLBACK_DOCUMENT;

  return (
    <>
      <PageTitle title="Privacy Policy" />
      <div className="neo-page min-h-screen relative overflow-hidden">

        <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-28 pb-20 relative">
          <Breadcrumb />
          <header className="mb-12 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-neo-text tracking-tight mb-4">
              <T>{loading ? FALLBACK_DOCUMENT.title : doc.title}</T>
            </h1>
            {!loading && (
              <>
                <p className="text-sm text-neo-muted mb-6">
                  <T vars={{ date: doc.updated }}>{"Last updated: {date}"}</T>
                </p>
                <p className="text-base text-neo-muted leading-relaxed max-w-2xl mx-auto">
                  <T>{doc.summary}</T>
                </p>
              </>
            )}
          </header>

          <div className="neo-surface p-8 lg:p-12 space-y-10" aria-busy={loading}>
            {loading ? (
              <LoadingSections />
            ) : (
              doc.sections.map(({ title, body, items }, index) => {
                const Icon = SECTION_ICONS[index % SECTION_ICONS.length];
                return (
                  <section key={`${index}-${title}`}>
                    <h2 className="text-2xl font-semibold text-neo-text mb-3 flex items-center gap-3">
                      <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </span>
                      <T>{title}</T>
                    </h2>
                    {body && (
                      <p className="text-base text-neo-muted leading-relaxed">
                        <T>{body}</T>
                      </p>
                    )}
                    {items && items.length > 0 && (
                      <ul className="mt-3 space-y-2 text-neo-muted">
                        {items.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            <span>
                              <T>{item}</T>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })
            )}

            <section className="pt-8 border-t border-neo-border">
              <h2 className="text-2xl font-semibold text-neo-text mb-4">
                <T>Contact Us</T>
              </h2>
              <p className="text-base text-neo-muted leading-relaxed mb-4">
                <T>
                  If you have any questions about this Privacy Policy, please
                  reach out to us:
                </T>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 text-neo-text">
                <a
                  href="mailto:agromet@gmail.com"
                  className="inline-flex items-center gap-2 hover:text-emerald-700 transition-colors"
                >
                  <FaEnvelope className="w-4 h-4 text-emerald-600" />
                  agromet@gmail.com
                </a>
                <a
                  href="tel:+233243999631"
                  className="inline-flex items-center gap-2 hover:text-emerald-700 transition-colors"
                >
                  <FaPhoneAlt className="w-4 h-4 text-emerald-600" />
                  +233 24 399 9631
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
