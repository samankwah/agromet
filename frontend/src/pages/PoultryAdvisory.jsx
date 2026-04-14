import PageTitle from '../components/PageTitle';
import T from "../components/common/T";
import {
  FaBiohazard,
  FaTractor,
  FaIndustry,
  FaThermometerHalf,
  FaSeedling,
  FaWarehouse,
  FaWater,
  FaChartLine,
  FaSyringe,
  FaLeaf,
  FaPhoneAlt,
  FaEnvelope,
} from "react-icons/fa"; // Import specific icons

const PoultryAdvisory = () => {
  return (
    <>
      <PageTitle title="Poultry Advisory" />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 -right-40 w-[500px] h-[500px] bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
      {/* Main Container with max width */}
      <div className="max-w-7xl mx-auto relative">
        {/* Header Section */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4">
            <T>Poultry Advisory</T>
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            <T>Poultry Advisory —</T>{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              <T>Ghana</T>
            </span>
          </h1>
          <p className="text-slate-600 text-lg max-w-3xl mx-auto">
            <T>Detailed poultry management recommendations across different phases.</T>
          </p>
        </div>

        {/* Advisory Cards - Each Card Mirrors a Section of the Excel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Preparation of Day Old Chicks */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaThermometerHalf className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              <T>Preparation of Day Old Chicks</T>
            </h2>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
              <li><T>Temperature: 37-38℃</T></li>
              <li><T>Pre-heat the brooding pen before chick placement.</T></li>
              <li>
                <T>Ensure feeders and drinkers are in place prior to arrival.</T>
              </li>
              <li><T>Prepare a warm and well-ventilated environment.</T></li>
            </ul>
          </div>

          {/* Brooder Management */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaWater className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              <T>Brooder Management</T>
            </h2>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
              <li><T>Temperature: 31-34℃</T></li>
              <li><T>Use charcoal or gas brooders for heat.</T></li>
              <li>
                <T>Monitor the chicks regularly to ensure they are comfortable.</T>
              </li>
              <li><T>Ensure proper air circulation and ventilation.</T></li>
            </ul>
          </div>

          {/* Feeding and Water for Starters */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaSeedling className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              <T>Feeding and Water for Starters</T>
            </h2>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
              <li><T>Water Temperature: 16-18℃</T></li>
              <li><T>Provide clean and fresh water at all times.</T></li>
              <li><T>Use balanced starter feed to ensure healthy growth.</T></li>
              <li><T>Place enough feeders and drinkers for easy access.</T></li>
            </ul>
          </div>

          {/* Vaccination */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaSyringe className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              <T>Vaccination</T>
            </h2>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
              <li><T>Vaccine Storage: 2-8℃</T></li>
              <li>
                <T>Store vaccines at the recommended temperature to maintain
                efficacy.</T>
              </li>
              <li><T>Vaccinate on time to prevent common poultry diseases.</T></li>
              <li>
                <T>Follow a vaccination schedule for Newcastle, Gumboro, etc.</T>
              </li>
            </ul>
          </div>

          {/* Feeding and Water for Growers/Finishers */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaSeedling className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              <T>Feeding and Water for Growers/Finishers</T>
            </h2>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
              <li><T>Water Temperature: 18-20℃</T></li>
              <li><T>Ensure constant access to clean and cool water.</T></li>
              <li><T>Provide balanced grower feed for proper growth.</T></li>
              <li><T>Monitor feed intake and adjust as necessary.</T></li>
            </ul>
          </div>

          {/* Housing and Ventilation */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaWarehouse className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              <T>Housing and Ventilation</T>
            </h2>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
              <li><T>Ensure proper ventilation to avoid heat stress.</T></li>
              <li>
                <T>Maintain a dry and clean environment inside the poultry house.</T>
              </li>
              <li>
                <T>Protect the housing from predators and extreme weather
                conditions.</T>
              </li>
              <li>
                <T>Design the house with sufficient space per bird for comfort.</T>
              </li>
            </ul>
          </div>

          {/* Biosecurity Measures */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaBiohazard className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              <T>Biosecurity Measures</T>
            </h2>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
              <li>
                <T>Restrict unauthorized personnel from accessing poultry areas.</T>
              </li>
              <li><T>Ensure proper hygiene before and after handling birds.</T></li>
              <li><T>Use footbaths and disinfectants at entry points.</T></li>
              <li><T>Isolate sick birds to prevent the spread of diseases.</T></li>
            </ul>
          </div>

          {/* Harvesting */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaTractor className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              <T>Harvesting</T>
            </h2>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
              <li><T>Ensure birds are stress-free during handling for harvest.</T></li>
              <li>
                <T>Use trained personnel to handle birds carefully during harvest.</T>
              </li>
              <li>
                <T>Transport birds in a well-ventilated vehicle to the processing
                unit.</T>
              </li>
              <li><T>Avoid overcrowding birds during transportation.</T></li>
            </ul>
          </div>

          {/* Processing */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaIndustry className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Processing
            </h2>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
              <li>Ensure birds are processed in a hygienic environment.</li>
              <li>
                Follow standardized procedures for slaughter, plucking, and
                cleaning.
              </li>
              <li>Maintain cold-chain storage to preserve meat quality.</li>
              <li>
                Ensure packaging is done hygienically to prevent contamination.
              </li>
            </ul>
          </div>

          {/* Market Trends */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaChartLine className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Market Trends
            </h2>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
              <li>Stay updated on poultry product prices (eggs, meat).</li>
              <li>
                Monitor feed price fluctuations and adjust strategies
                accordingly.
              </li>
              <li>Analyze demand for poultry products in your region.</li>
              <li>Leverage peak season opportunities for better sales.</li>
            </ul>
          </div>

          {/* Sustainable Practices */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaLeaf className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Sustainable Practices
            </h2>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
              <li>
                Implement waste recycling systems to minimize environmental
                impact.
              </li>
              <li>Use energy-efficient lighting and heating systems.</li>
              <li>Adopt water conservation practices in the poultry farm.</li>
              <li>
                Engage in responsible disposal of poultry litter and
                by-products.
              </li>
            </ul>
          </div>
        </div>

        {/* Download CTA */}
        <div className="flex justify-center mt-12">
          <button
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            onClick={() => {
              // This will trigger the download
              const fileUrl = "/path-to-your-file/advisory.pdf";
              const link = document.createElement("a");
              link.href = fileUrl;
              link.setAttribute("download", "advisory.pdf");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            Download Full Advisory as PDF
          </button>
        </div>

        <div className="mb-4">
          <div className="mt-12 text-center">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">
              Need More Advice?
            </h3>
            <p className="text-slate-600 mb-6">
              Contact our experts for personalized advice or explore our
              resources for further guidance on poultry farming.
            </p>

            {/* Contact Options */}
            <div className="flex justify-center gap-6">
              {/* Call Button */}

              <a
                href="tel:+2330243999631"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <FaPhoneAlt />
                Call an Expert
              </a>

              {/* Email Button */}
              <a
                href="mailto:stephen.amankwah@meteo.gov.gh"
                className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 text-slate-700 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <FaEnvelope />
                Email an Expert
              </a>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default PoultryAdvisory;
