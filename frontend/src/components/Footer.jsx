import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaWhatsapp,
  FaEnvelope,
} from "react-icons/fa";
import T from "./common/T";
import logo from "../assets/images/agromet-high-resolution-logo-transparent.png";

const quickLinks = [
  { to: "/about", label: "About Us" },
  { to: "/our-services", label: "Our Services" },
  { to: "/contact", label: "Contact" },
  { to: "/careers", label: "Careers" },
];

const socialLinks = [
  {
    href: "https://www.facebook.com",
    label: "Facebook",
    Icon: FaFacebookF,
  },
  {
    href: "https://www.twitter.com",
    label: "Twitter",
    Icon: FaTwitter,
  },
  {
    href: "https://www.linkedin.com",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
  },
  {
    href: "https://chat.whatsapp.com/IKNqrHOpAYmI1s5prZtQs6",
    label: "WhatsApp",
    Icon: FaWhatsapp,
  },
];

const SectionHeading = ({ children }) => (
  <div className="mb-6">
    <h5 className="text-sm font-semibold uppercase tracking-wider text-white">
      {children}
    </h5>
    <div className="w-8 h-0.5 bg-emerald-400 mt-2" />
  </div>
);

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 w-full">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-block mb-5">
              <img src={logo} alt="AgroMet" className="h-12 w-auto" />
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              <T>
                AgroMet delivers real-time, reliable agrometeorological
                advisories that help farmers and agribusinesses across Ghana
                plan, monitor, and adapt with confidence.
              </T>
            </p>

            <a
              href="mailto:agromet@gmail.com"
              className="mt-6 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-emerald-400 transition-colors"
            >
              <FaEnvelope className="w-4 h-4" />
              agromet@gmail.com
            </a>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <SectionHeading>
              <T>Quick Links</T>
            </SectionHeading>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-300 hover:text-emerald-400 transition-colors"
                  >
                    <T>{link.label}</T>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="lg:col-span-4">
            <SectionHeading>
              <T>Connect With Us</T>
            </SectionHeading>
            <p className="text-sm text-slate-400 mb-5 max-w-xs">
              <T>
                Follow AgroMet for the latest advisories, crop insights, and
                climate updates.
              </T>
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-gradient-to-br hover:from-emerald-500 hover:to-teal-600 text-slate-200 hover:text-white flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Legal Strip */}
        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} AgroMet.{" "}
            <T>All rights reserved.</T>
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy-policy"
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <T>Privacy Policy</T>
            </Link>
            <Link
              to="/terms-of-service"
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <T>Terms of Service</T>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
