import { useState, useMemo } from "react";
import PageTitle from "../components/PageTitle";
import { MapPin, Briefcase, ArrowRight } from "lucide-react";
import T from "../components/common/T";

const jobListings = [
  {
    title: "Software Engineer",
    department: "Engineering",
    location: "Accra",
    description:
      "Join our engineering team to build climate-smart agricultural tools used by farmers across Ghana.",
  },
  {
    title: "Product Manager",
    department: "Product Development",
    location: "Kumasi",
    description:
      "Lead product strategy and partner with cross-functional teams to shape AgroMet's next generation of features.",
  },
  {
    title: "Marketing Specialist",
    department: "Marketing",
    location: "Takoradi",
    description:
      "Craft marketing campaigns that bring AgroMet's advisories to farming communities and agribusinesses nationwide.",
  },
  {
    title: "Business Analyst",
    department: "Business Development",
    location: "Tamale",
    description:
      "Analyze market trends and growth opportunities to inform strategic decisions and partnerships.",
  },
  {
    title: "Sales Representative",
    department: "Sales",
    location: "Accra",
    description:
      "Drive client acquisition and build long-term relationships with farmers, cooperatives, and agribusinesses.",
  },
];

const departments = ["All", ...new Set(jobListings.map((j) => j.department))];
const locations = ["All", ...new Set(jobListings.map((j) => j.location))];

const Careers = () => {
  const [department, setDepartment] = useState("All");
  const [location, setLocation] = useState("All");

  const filteredJobs = useMemo(
    () =>
      jobListings.filter(
        (job) =>
          (department === "All" || job.department === department) &&
          (location === "All" || job.location === location)
      ),
    [department, location]
  );

  return (
    <>
      <PageTitle title="Careers" />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 relative overflow-hidden">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -right-32 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-20 relative">
          <header className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <T>Join Our Team</T>
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              <T>Careers at AgroMet</T>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              <T>
                Help us build climate-smart tools that transform agriculture in
                Ghana. We're looking for curious, mission-driven people.
              </T>
            </p>
          </header>

          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                <T>Department</T>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                <T>Location</T>
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
              >
                {locations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Grid */}
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <p className="text-slate-600">
                <T>No openings match your filters right now.</T>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <div
                  key={job.title}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 p-7 transition-all duration-300 flex flex-col"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-4 shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {job.title}
                  </h3>
                  <p className="text-sm text-emerald-600 font-medium mb-3">
                    {job.department}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
                    <MapPin className="w-4 h-4" />
                    {job.location}, Ghana
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-6">
                    {job.description}
                  </p>
                  <button className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors">
                    <T>Apply Now</T>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Careers;
