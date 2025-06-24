import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

const Contact = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-1 lg:pt-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-700">
            We are here to help! Reach out to us with any inquiries, feedback,
            or support requests.
          </p>
        </div>

        {/* Contact Form and Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">
              Send Us a Message
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your Email"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Message
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="5"
                  placeholder="Your Message"
                ></textarea>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition duration-300"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>

          {/* Contact Information */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-gray-700 mb-6">
              You can also contact us through the following means:
            </p>
            <div className="space-y-4">
              {/* Address */}
              <div className="flex items-start">
                <FaMapMarkerAlt className="h-6 w-6 text-blue-900 mr-4" />
                <div>
                  <h3 className="font-semibold text-lg text-gray-700">
                    Our Office
                  </h3>
                  <p className="text-gray-600">Accra, Ghana</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start">
                <FaPhoneAlt className="h-6 w-6 text-blue-900 mr-4" />
                <div>
                  <h3 className="font-semibold text-lg text-gray-700">Phone</h3>
                  <p className="text-gray-600">+233 24 399 9631</p>
                  <p className="text-gray-600">+233 30 000 0000</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start">
                <FaEnvelope className="h-6 w-6 text-blue-900 mr-4" />
                <div>
                  <h3 className="flex flex-row font-semibold text-lg text-gray-700">
                    Email
                  </h3>
                  <p className="text-gray-600">triagrioai@gmail.com</p>
                  <p className="text-gray-600">info@triagrioai.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4 text-center">
            Find Us on the Map
          </h2>
          <div className="bg-gray-300 rounded-lg h-94">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.4294557739663!2d-0.16714722413944483!3d5.650843632686896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9ca15e56390f%3A0xe32353079eab7d22!2sGHANA%20METEOROLOGICAL%20AGENCY!5e0!3m2!1sen!2sgh!4v1742294036187!5m2!1sen!2sgh"
              width="100%"
              height="260"
              // style="border:0;"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
