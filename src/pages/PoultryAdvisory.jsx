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
    <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen pt-24">
      {/* Main Container with max width */}
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-4xl font-bold text-blue-700 mb-4">
            Poultry Advisory - Ghana
          </h1>
          <p className="text-gray-700 text-lg">
            Detailed poultry management recommendations across different phases.
          </p>
        </div>

        {/* Advisory Cards - Each Card Mirrors a Section of the Excel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Preparation of Day Old Chicks */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaThermometerHalf className="text-blue-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Preparation of Day Old Chicks
            </h2>
            <ul className="list-disc list-inside text-gray-700">
              <li>Temperature: 37-38℃</li>
              <li>Pre-heat the brooding pen before chick placement.</li>
              <li>
                Ensure feeders and drinkers are in place prior to arrival.
              </li>
              <li>Prepare a warm and well-ventilated environment.</li>
            </ul>
          </div>

          {/* Brooder Management */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaWater className="text-blue-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Brooder Management
            </h2>
            <ul className="list-disc list-inside text-gray-700">
              <li>Temperature: 31-34℃</li>
              <li>Use charcoal or gas brooders for heat.</li>
              <li>
                Monitor the chicks regularly to ensure they are comfortable.
              </li>
              <li>Ensure proper air circulation and ventilation.</li>
            </ul>
          </div>

          {/* Feeding and Water for Starters */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaSeedling className="text-blue-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Feeding and Water for Starters
            </h2>
            <ul className="list-disc list-inside text-gray-700">
              <li>Water Temperature: 16-18℃</li>
              <li>Provide clean and fresh water at all times.</li>
              <li>Use balanced starter feed to ensure healthy growth.</li>
              <li>Place enough feeders and drinkers for easy access.</li>
            </ul>
          </div>

          {/* Vaccination */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaSyringe className="text-blue-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Vaccination
            </h2>
            <ul className="list-disc list-inside text-gray-700">
              <li>Vaccine Storage: 2-8℃</li>
              <li>
                Store vaccines at the recommended temperature to maintain
                efficacy.
              </li>
              <li>Vaccinate on time to prevent common poultry diseases.</li>
              <li>
                Follow a vaccination schedule for Newcastle, Gumboro, etc.
              </li>
            </ul>
          </div>

          {/* Feeding and Water for Growers/Finishers */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaSeedling className="text-blue-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Feeding and Water for Growers/Finishers
            </h2>
            <ul className="list-disc list-inside text-gray-700">
              <li>Water Temperature: 18-20℃</li>
              <li>Ensure constant access to clean and cool water.</li>
              <li>Provide balanced grower feed for proper growth.</li>
              <li>Monitor feed intake and adjust as necessary.</li>
            </ul>
          </div>

          {/* Housing and Ventilation */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaWarehouse className="text-blue-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Housing and Ventilation
            </h2>
            <ul className="list-disc list-inside text-gray-700">
              <li>Ensure proper ventilation to avoid heat stress.</li>
              <li>
                Maintain a dry and clean environment inside the poultry house.
              </li>
              <li>
                Protect the housing from predators and extreme weather
                conditions.
              </li>
              <li>
                Design the house with sufficient space per bird for comfort.
              </li>
            </ul>
          </div>

          {/* Biosecurity Measures */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaBiohazard className="text-blue-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Biosecurity Measures
            </h2>
            <ul className="list-disc list-inside text-gray-700">
              <li>
                Restrict unauthorized personnel from accessing poultry areas.
              </li>
              <li>Ensure proper hygiene before and after handling birds.</li>
              <li>Use footbaths and disinfectants at entry points.</li>
              <li>Isolate sick birds to prevent the spread of diseases.</li>
            </ul>
          </div>

          {/* Harvesting */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaTractor className="text-blue-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Harvesting
            </h2>
            <ul className="list-disc list-inside text-gray-700">
              <li>Ensure birds are stress-free during handling for harvest.</li>
              <li>
                Use trained personnel to handle birds carefully during harvest.
              </li>
              <li>
                Transport birds in a well-ventilated vehicle to the processing
                unit.
              </li>
              <li>Avoid overcrowding birds during transportation.</li>
            </ul>
          </div>

          {/* Processing */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaIndustry className="text-blue-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Processing
            </h2>
            <ul className="list-disc list-inside text-gray-700">
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
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaChartLine className="text-blue-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Market Trends
            </h2>
            <ul className="list-disc list-inside text-gray-700">
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
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaLeaf className="text-blue-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Sustainable Practices
            </h2>
            <ul className="list-disc list-inside text-gray-700">
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
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500"
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
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
              Need More Advice?
            </h3>
            <p className="text-gray-600 mb-6">
              Contact our experts for personalized advice or explore our
              resources for further guidance on poultry farming.
            </p>

            {/* Contact Options */}
            <div className="flex justify-center gap-6">
              {/* Call Button */}

              <a
                href="tel:+2330243999631" // Replace with the expert's actual phone number
                className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-200 flex items-center gap-2"
              >
                <FaPhoneAlt />
                Call an Expert
              </a>

              {/* Email Button */}
              <a
                href="mailto:stephen.amankwah@meteo.gov.gh" // Replace with the expert's actual email address
                className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-200 flex items-center gap-2"
              >
                <FaEnvelope />
                Email an Expert
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoultryAdvisory;
