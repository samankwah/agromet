import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";
import PageTitle from "../components/PageTitle";
import T from "../components/common/T";

const Contact = () => {
  return (
    <>
      <PageTitle title="Contact Us" />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 relative overflow-hidden">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -right-32 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-20 relative">
          <header className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <T>Get in Touch</T>
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              <T>Contact Us</T>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              <T>
                We'd love to hear from you. Send us a message and our team will
                respond within one business day.
              </T>
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-8 lg:p-10">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                <T>Send Us a Message</T>
              </h2>
              <form className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <T>Name</T>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <T>Email</T>
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <T>Message</T>
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
                    rows="6"
                    placeholder="How can we help?"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  <FaPaperPlane className="w-4 h-4" />
                  <T>Send Message</T>
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                  <T>Reach Us Directly</T>
                </h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 items-center justify-center flex-shrink-0">
                      <FaMapMarkerAlt className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        <T>Our Office</T>
                      </h3>
                      <p className="text-sm text-slate-600">
                        <T>Accra, Ghana</T>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="inline-flex w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 items-center justify-center flex-shrink-0">
                      <FaPhoneAlt className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        <T>Phone</T>
                      </h3>
                      <a
                        href="tel:+233243999631"
                        className="text-sm text-slate-600 hover:text-emerald-700 transition-colors"
                      >
                        +233 24 399 9631
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="inline-flex w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 items-center justify-center flex-shrink-0">
                      <FaEnvelope className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        <T>Email</T>
                      </h3>
                      <a
                        href="mailto:agromet@gmail.com"
                        className="text-sm text-slate-600 hover:text-emerald-700 transition-colors"
                      >
                        agromet@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                <T>Find Us on the Map</T>
              </h2>
            </div>
            <iframe
              title="AgroMet office location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.4294557739663!2d-0.16714722413944483!3d5.650843632686896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9ca15e56390f%3A0xe32353079eab7d22!2sGHANA%20METEOROLOGICAL%20AGENCY!5e0!3m2!1sen!2sgh!4v1742294036187!5m2!1sen!2sgh"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
