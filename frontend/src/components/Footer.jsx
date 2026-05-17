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
    <h5 className="text-sm font-semibold uppercase tracking-wider text-neo-text">
      {children}
    </h5>
    <div className="mt-2 h-1 w-10 rounded-full bg-neo-accent" />
  </div>
);

const Footer = () => {
  return (
    <footer className="relative w-full bg-neo-bg text-neo-muted">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-8">
        <div className="neo-surface grid grid-cols-1 gap-10 p-6 md:grid-cols-2 md:p-8 lg:grid-cols-12 lg:gap-12 lg:p-10">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Link to="/" className="neo-surface-soft mb-5 inline-flex rounded-full px-4 py-3">
              <img src={logo} alt="AgroMet" className="h-12 w-auto" />
            </Link>
            <p className="text-sm leading-relaxed text-neo-muted max-w-sm">
              <T>
                AgroMet delivers real-time, reliable agrometeorological
                advisories that help farmers and agribusinesses across Ghana
                plan, monitor, and adapt with confidence.
              </T>
            </p>

            <a
              href="mailto:agromet@gmail.com"
              className="neo-button mt-6 text-sm"
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
                    className="text-sm font-medium text-neo-muted transition-colors hover:text-neo-accent-strong"
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
            <p className="text-sm text-neo-muted mb-5 max-w-xs">
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
                  className="neo-icon-button"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Legal Strip */}
        <div className="border-t neo-divider mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neo-muted">
            &copy; {new Date().getFullYear()} AgroMet.{" "}
            <T>All rights reserved.</T>
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy-policy"
              className="text-xs font-medium text-neo-muted hover:text-neo-accent-strong transition-colors"
            >
              <T>Privacy Policy</T>
            </Link>
            <Link
              to="/terms-of-service"
              className="text-xs font-medium text-neo-muted hover:text-neo-accent-strong transition-colors"
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
