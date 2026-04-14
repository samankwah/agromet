import PageTitle from "../components/PageTitle";
import {
  FaFileContract,
  FaUserShield,
  FaInfoCircle,
  FaRegClock,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";
import T from "../components/common/T";

const sections = [
  {
    icon: FaFileContract,
    title: "Acceptance of Terms",
    body: "By accessing or using AgroMet, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our services.",
  },
  {
    icon: FaUserShield,
    title: "User Responsibilities",
    body: "As a user of AgroMet, you agree to:",
    list: [
      "Provide accurate and complete information when creating an account",
      "Keep your account credentials secure and confidential",
      "Notify us immediately of any unauthorized access to your account",
      "Use our services in compliance with all applicable laws and regulations",
    ],
  },
  {
    icon: FaInfoCircle,
    title: "Limitation of Liability",
    body: "AgroMet provides advisories as guidance based on the best available data. Our liability is limited to the fullest extent permitted by law. We are not responsible for any indirect, incidental, or consequential damages resulting from reliance on the service.",
  },
  {
    icon: FaRegClock,
    title: "Changes to These Terms",
    body: "We reserve the right to update or modify these Terms at any time. Material changes will be communicated through the platform. Your continued use of AgroMet after changes take effect constitutes acceptance of the updated Terms.",
  },
];

const TermsOfService = () => {
  return (
    <>
      <PageTitle title="Terms of Service" />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 relative overflow-hidden">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -right-32 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-28 pb-20 relative">
          <header className="mb-12 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              <T>Terms of Service</T>
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              <T>Last updated: April 2026</T>
            </p>
            <p className="text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              <T>
                Welcome to AgroMet. Please read these Terms of Service carefully
                before using our platform.
              </T>
            </p>
          </header>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-8 lg:p-12 space-y-10">
            {sections.map(({ icon: Icon, title, body, list }) => (
              <section key={title}>
                <h2 className="text-2xl font-semibold text-slate-900 mb-3 flex items-center gap-3">
                  <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </span>
                  <T>{title}</T>
                </h2>
                <p className="text-base text-slate-600 leading-relaxed">
                  <T>{body}</T>
                </p>
                {list && (
                  <ul className="mt-3 space-y-2 text-slate-600">
                    {list.map((item) => (
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
            ))}

            <section className="pt-8 border-t border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                <T>Contact Us</T>
              </h2>
              <p className="text-base text-slate-600 leading-relaxed mb-4">
                <T>
                  If you have any questions about these Terms of Service, please
                  contact us:
                </T>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 text-slate-700">
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
