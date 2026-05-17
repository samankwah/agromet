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

const sections = [
  {
    icon: FaRegFileAlt,
    title: "Information We Collect",
    body: "We may collect the following types of information:",
    list: [
      "Personal identification information (name, email, phone)",
      "Usage data describing how you interact with our services",
      "Cookies and similar tracking technologies",
      "Location data when you opt in to localized advisories",
    ],
  },
  {
    icon: FaShieldAlt,
    title: "How We Use Your Information",
    body: "We use the information we collect to:",
    list: [
      "Provide, operate, and maintain the AgroMet platform",
      "Personalize advisories and recommendations to your location",
      "Communicate with you about updates, alerts, and support",
      "Analyze usage patterns to improve the product",
    ],
  },
  {
    icon: FaLock,
    title: "Data Security",
    body: "We take the security of your personal information seriously and implement administrative, technical, and physical safeguards designed to protect it against unauthorized access, alteration, disclosure, or destruction.",
  },
  {
    icon: FaUsers,
    title: "Third-Party Services",
    body: "We may engage vetted third-party service providers to help us operate and improve AgroMet. These providers have access to your information only to perform tasks on our behalf and are contractually obligated to protect it.",
  },
  {
    icon: FaRegFileAlt,
    title: "Changes to This Privacy Policy",
    body: "We may update this Privacy Policy from time to time. Material changes will be posted on this page with a new effective date. We encourage you to review this policy periodically.",
  },
];

const PrivacyPolicy = () => {
  return (
    <>
      <PageTitle title="Privacy Policy" />
      <div className="neo-page min-h-screen relative overflow-hidden">

        <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-28 pb-20 relative">
          <Breadcrumb />
          <header className="mb-12 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              <T>Privacy Policy</T>
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              <T>Last updated: April 2026</T>
            </p>
            <p className="text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              <T>
                Your privacy matters to us. This Privacy Policy explains how
                AgroMet collects, uses, and safeguards the information you share
                with us.
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
                  If you have any questions about this Privacy Policy, please
                  reach out to us:
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

export default PrivacyPolicy;
