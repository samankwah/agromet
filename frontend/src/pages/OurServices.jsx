import PageTitle from "../components/PageTitle";
import { Link } from "react-router-dom";
import {
  FaCloudSunRain,
  FaLeaf,
  FaCamera,
  FaChartLine,
  FaWater,
  FaBell,
  FaArrowRight,
} from "react-icons/fa";
import T from "../components/common/T";

const services = [
  {
    icon: FaCloudSunRain,
    title: "Weather Forecasts",
    description:
      "7-day, sub-seasonal, and seasonal forecasts for all 261 districts across Ghana, sourced from the Ghana Meteorological Agency.",
    to: "/seven-days-forecast",
  },
  {
    icon: FaLeaf,
    title: "Agromet Advisory",
    description:
      "Personalized crop and poultry advisories that translate weather data into clear, timely actions for your farm.",
    to: "/agromet-advisory",
  },
  {
    icon: FaCamera,
    title: "AI Crop Diagnostics",
    description:
      "Snap a photo of a leaf and get an instant diagnosis with a recommended remedy, available in multiple local languages.",
    to: "/crop-diagnose",
  },
  {
    icon: FaChartLine,
    title: "Market Intelligence",
    description:
      "Real-time prices from markets across Ghana so you can plan when and where to sell for the best return.",
    to: "/market-page",
  },
  {
    icon: FaWater,
    title: "Flood & Drought Monitoring",
    description:
      "Early warnings and risk maps for floods and droughts, helping you protect crops, livestock, and infrastructure.",
    to: "/flood-drought",
  },
  {
    icon: FaBell,
    title: "Agro Bulletins & SMS Alerts",
    description:
      "Weekly bulletins and SMS alerts delivered in your language, so critical information reaches you wherever you are.",
    to: "/agro-bulletins",
  },
];

const OurServices = () => {
  return (
    <>
      <PageTitle title="Our Services" />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 relative overflow-hidden">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -right-32 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-20 relative">
          <header className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <T>What We Offer</T>
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              <T>Our Services</T>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              <T>
                A complete agrometeorological toolkit — forecasts, advisories,
                diagnostics, and market intelligence — built for farmers and
                agribusinesses across Ghana.
              </T>
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(({ icon: Icon, title, description, to }) => (
              <Link
                key={title}
                to={to}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 p-8 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-5 shadow-md shadow-emerald-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  <T>{title}</T>
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  <T>{description}</T>
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">
                  <T>Learn more</T>
                  <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-20 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-3xl p-10 lg:p-14 text-center text-white shadow-2xl shadow-emerald-600/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              <T>Ready to get started?</T>
            </h2>
            <p className="text-emerald-50 text-lg mb-8 max-w-2xl mx-auto">
              <T>
                Explore AgroMet's full suite of tools or get in touch with our
                team to learn how we can support your operations.
              </T>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <T>Explore the App</T>
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white hover:text-emerald-700 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <T>Contact Us</T>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OurServices;
