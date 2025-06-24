import {
  FaCloudSunRain,
  FaMobileAlt,
  FaChartBar,
  FaShieldAlt,
} from "react-icons/fa"; // Example icons

const OurServices = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 py-16">
      <div className="container mx-auto p-8 pt-20">
        {/* Section Heading */}
        <h1 className="text-4xl font-extrabold mb-6 text-center text-blue-900">
          Our Services
        </h1>
        <p className="text-lg text-gray-700 text-center mb-10">
          We offer a wide range of climate-related services to help you stay
          ahead of the weather. Whether you are planning, farming, or just
          staying safe, our app provides the tools you need.
        </p>

        {/* Services List */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* Service 1 */}
          <div className="text-center bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <FaCloudSunRain className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-blue-900 mb-2">
              Weather Forecast
            </h3>
            <p className="text-gray-600">
              Get real-time, accurate weather forecasts for any location
              worldwide, helping you plan better.
            </p>
          </div>

          {/* Service 2 */}
          <div className="text-center bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <FaMobileAlt className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-blue-900 mb-2">
              Mobile Alerts
            </h3>
            <p className="text-gray-600">
              Receive timely notifications about severe weather conditions,
              storms, and rain to stay safe.
            </p>
          </div>

          {/* Service 3 */}
          <div className="text-center bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <FaChartBar className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-blue-900 mb-2">
              Data Analytics
            </h3>
            <p className="text-gray-600">
              Access in-depth analytics and climate data to make informed
              decisions for agriculture and business.
            </p>
          </div>

          {/* Service 4 */}
          <div className="text-center bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <FaShieldAlt className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-blue-900 mb-2">
              Safety Tips
            </h3>
            <p className="text-gray-600">
              Stay informed with safety tips and precautionary measures during
              severe weather events.
            </p>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="text-center mt-12">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">
            Ready to Stay Ahead?
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            Join thousands of users who trust us for accurate weather
            information and updates. Get started now!
          </p>
          <button className="bg-blue-900 text-white px-6 py-3 rounded-md text-lg hover:bg-blue-800 transition duration-300">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default OurServices;
