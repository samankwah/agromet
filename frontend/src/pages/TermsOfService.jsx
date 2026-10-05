import PageTitle from "../components/PageTitle";
import Breadcrumb from "../components/common/Breadcrumb";
import {
  FaFileContract,
  FaUserShield,
  FaInfoCircle,
  FaRegClock,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";
import T from "../components/common/T";
import { useLegalDocument } from "../utils/useLegalDocument";

// Icons cycle over whatever sections the backend sends, since the API carries
// wording only.
const SECTION_ICONS = [FaFileContract, FaUserShield, FaInfoCircle, FaRegClock];

// Built-in copy, shown only when GET /api/legal/terms cannot be reached.
// Same shape as the API's LegalDocumentResponse so one renderer serves both.
const FALLBACK_DOCUMENT = {
  title: "Terms of Service",
  updated: "April 2026",
  summary:
    "Welcome to AgroMet. Please read these Terms of Service carefully before using our platform.",
  sections: [
    {
      title: "Acceptance of Terms",
      body: "By accessing or using AgroMet, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our services.",
    },
    {
      title: "User Responsibilities",
      body: "As a user of AgroMet, you agree to:",
      items: [
        "Provide accurate and complete information when creating an account",
        "Keep your account credentials secure and confidential",
        "Notify us immediately of any unauthorized access to your account",
        "Use our services in compliance with all applicable laws and regulations",
      ],
    },
    {
      title: "Limitation of Liability",
      body: "AgroMet provides advisories as guidance based on the best available data. Our liability is limited to the fullest extent permitted by law. We are not responsible for any indirect, incidental, or consequential damages resulting from reliance on the service.",
    },
    {
      title: "Changes to These Terms",
      body: "We reserve the right to update or modify these Terms at any time. Material changes will be communicated through the platform. Your continued use of AgroMet after changes take effect constitutes acceptance of the updated Terms.",
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

const TermsOfService = () => {
  const { status, document: remoteDoc } = useLegalDocument("terms");
  const loading = status === "loading";
  const doc = remoteDoc || FALLBACK_DOCUMENT;

  return (
    <>
      <PageTitle title="Terms of Service" />
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
                  If you have any questions about these Terms of Service, please
                  contact us:
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

export default TermsOfService;
