import logo from "../assets/images/triagrio.png";
import facebookIcon from "../assets/icons/facebook.png";
import twitterIcon from "../assets/icons/x.png";
import linkedinIcon from "../assets/icons/linkedin.png";
import whatsappIcon from "../assets/icons/whatsapp.png";

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white w-full py-4 md:py-6 md:px-12">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {/* Logo and Description */}
        <div className="flex flex-col items-start md:items-start">
          {/* Link the logo to the website */}
          <a href="/" target="_blank" rel="noopener noreferrer">
            <img src={logo} alt="agropulse logo" className="h-12 mb-4" />
          </a>

          <p className="text-sm text-gray-300 text-start md:text-left">
            TriAgro-AI’s app delivers real-time, reliable agrometeorological
            advisories for planning and monitoring.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col items-start md:items-center">
          <h5 className="font-semibold mb-2 text-lg text-gray-100">
            Quick Links
          </h5>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>
              <a href="/about" className="hover:text-gray-400">
                About Us
              </a>
            </li>
            <li>
              <a href="/services" className="hover:text-gray-400">
                Our Services
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-gray-400">
                Contact
              </a>
            </li>
            <li>
              <a href="/careers" className="hover:text-gray-400">
                Careers
              </a>
            </li>
          </ul>
        </div>

        {/* Social Media and Legal */}
        <div className="flex flex-col items-start md:items-start">
          <h5 className="font-semibold mb-2 text-lg text-gray-100">
            Connect With Us
          </h5>

          {/* Social Media Icons */}
          <div className="flex space-x-4 mb-2">
            <a
              href="https://www.facebook.com" // Add your actual Facebook link
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <img src={facebookIcon} alt="Facebook" className="h-6 w-6" />
            </a>
            <a
              href="https://www.twitter.com" // Add your actual Twitter link
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <img src={twitterIcon} alt="Twitter" className="h-6 w-6" />
            </a>
            <a
              href="https://www.linkedin.com" // Add your actual LinkedIn link
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <img src={linkedinIcon} alt="LinkedIn" className="h-6 w-6" />
            </a>
            <a
              href="https://chat.whatsapp.com/IKNqrHOpAYmI1s5prZtQs6"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="whatsapp"
            >
              <img src={whatsappIcon} alt="WhatsApp" className="h-6 w-6" />
            </a>
          </div>

          {/* Email Contact - Added Below Social Media Icons */}
          <div className="flex items-center mb-2">
            <a
              href="mailto:deepdiveteam@fsrp.org.gh"
              className="text-sm text-gray-300 hover:text-gray-400 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              triagroai@gmail.com
            </a>
          </div>

          <ul className="text-sm space-y-1 text-gray-300">
            <li>
              <a href="/privacy" className="hover:text-gray-400">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="/terms" className="hover:text-gray-400">
                Terms of Service
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-600 pt-2 text-xs text-gray-400 flex justify-center">
        <p>
          &copy; {new Date().getFullYear()} TriAgro-AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
