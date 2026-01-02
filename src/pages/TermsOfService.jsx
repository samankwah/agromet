import PageTitle from '../components/PageTitle';
import {
  FaFileContract,
  FaUserShield,
  FaInfoCircle,
  FaRegClock,
} from "react-icons/fa";

const TermsOfService = () => {
  return (
    <>
      <PageTitle title="Terms of Service" />
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-8 pt-20">
        <h1 className="text-4xl font-bold text-blue-900 mb-6 text-center">
          Terms of Service
        </h1>
        <p className="text-gray-700 text-lg mb-8 text-center">
          Welcome to our Terms of Service! Please read these terms carefully
          before using our services.
        </p>

        {/* Section: Acceptance of Terms */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center">
            <FaFileContract className="text-blue-900 mr-2" />
            Acceptance of Terms
          </h2>
          <p className="text-gray-700 mb-2">
            By accessing or using our services, you agree to be bound by these
            terms. If you do not agree, please do not use our services.
          </p>
        </div>

        {/* Section: User Responsibilities */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center">
            <FaUserShield className="text-blue-900 mr-2" />
            User Responsibilities
          </h2>
          <p className="text-gray-700 mb-2">As a user, you agree to:</p>
          <ul className="list-disc list-inside mb-4 text-gray-600">
            <li>
              Provide accurate and complete information when registering for our
              services.
            </li>
            <li>Keep your account information secure and confidential.</li>
            <li>
              Notify us immediately of any unauthorized use of your account.
            </li>
            <li>Use our services in compliance with all applicable laws.</li>
          </ul>
        </div>

        {/* Section: Limitation of Liability */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center">
            <FaInfoCircle className="text-blue-900 mr-2" />
            Limitation of Liability
          </h2>
          <p className="text-gray-700 mb-2">
            Our liability is limited to the fullest extent permitted by law. We
            are not responsible for any indirect, incidental, or consequential
            damages resulting from your use of our services.
          </p>
        </div>

        {/* Section: Changes to Terms */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center">
            <FaRegClock className="text-blue-900 mr-2" />
            Changes to Terms
          </h2>
          <p className="text-gray-700 mb-2">
            We reserve the right to update or modify these terms at any time. We
            will notify users of any significant changes. Your continued use of
            our services after any changes constitutes acceptance of the new
            terms.
          </p>
        </div>

        {/* Section: Contact Us */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center">
            <FaFileContract className="text-blue-900 mr-2" />
            Contact Us
          </h2>
          <p className="text-gray-700 mb-2">
            If you have any questions about these Terms of Service, please
            contact us:
          </p>
          <p className="text-gray-600">Email: support@example.com</p>
          <p className="text-gray-600">Phone: +233 243 999 631</p>
        </div>
      </div>
      </div>
    </>
  );
};

export default TermsOfService;
