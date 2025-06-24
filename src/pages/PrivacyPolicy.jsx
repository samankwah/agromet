import { FaShieldAlt, FaRegFileAlt, FaLock, FaUsers } from "react-icons/fa";

const PrivacyPolicy = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-8 pt-20">
        <h1 className="text-4xl font-bold text-blue-900 mb-6 text-center">
          Privacy Policy
        </h1>
        <p className="text-gray-700 text-lg mb-8 text-center">
          Your privacy is important to us. This Privacy Policy outlines how we
          collect, use, and protect your information.
        </p>

        {/* Section: Information We Collect */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center">
            <FaRegFileAlt className="text-blue-900 mr-2" />
            Information We Collect
          </h2>
          <p className="text-gray-700 mb-2">
            We may collect the following types of information:
          </p>
          <ul className="list-disc list-inside mb-4 text-gray-600">
            <li>Personal Identification Information (Name, Email, etc.)</li>
            <li>Usage Data (How you interact with our services)</li>
            <li>Cookies and Tracking Technologies</li>
          </ul>
        </div>

        {/* Section: How We Use Your Information */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center">
            <FaShieldAlt className="text-blue-900 mr-2" />
            How We Use Your Information
          </h2>
          <p className="text-gray-700 mb-2">
            We use the information we collect in various ways, including to:
          </p>
          <ul className="list-disc list-inside mb-4 text-gray-600">
            <li>Provide, operate, and maintain our website</li>
            <li>Improve, personalize, and expand our services</li>
            <li>
              Communicate with you, either directly or through one of our
              partners
            </li>
            <li>Process your transactions and manage your orders</li>
            <li>Send you emails and newsletters</li>
          </ul>
        </div>

        {/* Section: Data Security */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center">
            <FaLock className="text-blue-900 mr-2" />
            Data Security
          </h2>
          <p className="text-gray-700 mb-2">
            We take the security of your personal information seriously. We
            implement various security measures to maintain the safety of your
            personal information when you place an order or enter, submit, or
            access your personal information.
          </p>
        </div>

        {/* Section: Third-Party Services */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center">
            <FaUsers className="text-blue-900 mr-2" />
            Third-Party Services
          </h2>
          <p className="text-gray-700 mb-2">
            We may employ third-party companies and services to facilitate our
            services, to provide the services on our behalf, to perform
            service-related services, or to assist us in analyzing how our
            services are used. These third parties may have access to your
            personal information only to perform these tasks on our behalf and
            are obligated not to disclose or use it for any other purpose.
          </p>
        </div>

        {/* Section: Changes to This Privacy Policy */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center">
            <FaRegFileAlt className="text-blue-900 mr-2" />
            Changes to This Privacy Policy
          </h2>
          <p className="text-gray-700 mb-2">
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page.
            You are advised to review this Privacy Policy periodically for any
            changes.
          </p>
        </div>

        {/* Section: Contact Us */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center">
            <FaLock className="text-blue-900 mr-2" />
            Contact Us
          </h2>
          <p className="text-gray-700 mb-2">
            If you have any questions about this Privacy Policy, please contact
            us:
          </p>
          <p className="text-gray-600">Email: support@example.com</p>
          <p className="text-gray-600">Phone: +233 123 456 789</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
