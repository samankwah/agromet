import { Link } from "react-router-dom";
import Breadcrumb from "../components/common/Breadcrumb";
import { motion } from "framer-motion";
import {
  Target,
  Leaf,
  Camera,
  TrendingUp,
  Globe,
  Cpu,
  MapPin,
  ArrowRight,
} from "lucide-react";
import PageTitle from "../components/PageTitle";
import T from "../components/common/T";

const features = [
  {
    icon: Leaf,
    title: "Climate-Smart Advisory",
    description:
      "Localized crop and poultry advisories that turn weather data into clear, actionable guidance for every district.",
  },
  {
    icon: Camera,
    title: "AI Crop Diagnostics",
    description:
      "Snap a leaf photo and receive an instant disease diagnosis with recommended remedies in local languages.",
  },
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    description:
      "Real-time price signals from markets across Ghana, helping farmers decide when and where to sell.",
  },
];

const approach = [
  {
    icon: Cpu,
    title: "Powered by AI & Open Data",
    description:
      "We combine forecasts from the Ghana Meteorological Agency with machine learning to deliver precise, district-level insights.",
  },
  {
    icon: Globe,
    title: "Built for Local Context",
    description:
      "Every advisory, alert, and bulletin is designed around Ghanaian crops, climates, and languages — not ported from elsewhere.",
  },
];

const stats = [
  { value: "261", label: "Districts Covered" },
  { value: "6+", label: "Local Languages" },
  { value: "24/7", label: "Monitoring" },
  { value: "Ghana", label: "Built For" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const About = () => {
  return (
    <>
      <PageTitle title="About AgroMet" />
      <div className="neo-page min-h-screen relative overflow-hidden">

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-20 relative">
          <Breadcrumb />
          {/* Hero */}
          <motion.header
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <T>About AgroMet</T>
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6">
              <T>Climate intelligence for</T>{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                <T>every farmer</T>
              </span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              <T>
                AgroMet delivers real-time agrometeorological advisories,
                AI-powered crop diagnostics, and market insights to farmers and
                agribusinesses across Ghana — helping them plan, protect, and
                profit in a changing climate.
              </T>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/our-services"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <T>Explore Our Services</T>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 text-slate-700 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <T>Get in Touch</T>
              </Link>
            </div>
          </motion.header>

          {/* Mission */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="max-w-4xl mx-auto mb-24 bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-sm p-10 lg:p-14"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center">
                <Target className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-semibold text-slate-900">
                <T>Our Mission</T>
              </h2>
            </div>
            <p className="text-lg text-slate-600 leading-relaxed">
              <T>
                To democratize access to climate-smart agricultural insights and
                equip every farmer, extension officer, and agribusiness in
                Ghana with the tools they need to thrive in a changing world.
              </T>
            </p>
          </motion.section>

          {/* What We Do */}
          <section className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-3">
                <T>What We Do</T>
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                <T>
                  Three core capabilities working together to support every
                  decision on the farm.
                </T>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map(({ icon: Icon, title, description }, idx) => (
                <motion.div
                  key={title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 transition-all duration-300 p-8"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-5 shadow-md shadow-emerald-500/20">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    <T>{title}</T>
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <T>{description}</T>
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Our Approach */}
          <section className="mb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {approach.map(({ icon: Icon, title, description }) => (
                <motion.div
                  key={title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 p-8"
                >
                  <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 flex items-center justify-center mb-5 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    <T>{title}</T>
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <T>{description}</T>
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Stats */}
          <section className="mb-24">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-10 lg:p-14">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                      {value}
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      <T>{label}</T>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Partners */}
          <section className="mb-24 text-center">
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              <T>In Partnership With</T>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-8">
              <T>
                Built in collaboration with trusted institutions dedicated to
                Ghana's agricultural future.
              </T>
            </p>
            <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-8 py-5 shadow-sm">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-900">
                <T>Ghana Meteorological Agency</T>
              </span>
            </div>
          </section>

          {/* CTA */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-3xl p-10 lg:p-14 text-center text-white shadow-2xl shadow-emerald-600/20"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              <T>Join us in shaping the future of farming</T>
            </h2>
            <p className="text-emerald-50 text-lg mb-8 max-w-2xl mx-auto">
              <T>
                Whether you're a farmer, researcher, or partner institution —
                we'd love to hear from you.
              </T>
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              <T>Contact Our Team</T>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.section>
        </div>
      </div>
    </>
  );
};

export default About;
