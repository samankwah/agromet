import {
  FaSeedling,
  FaSun,
  FaWater,
  FaEnvelope,
  FaPhoneAlt,
  FaCalendarAlt,
} from "react-icons/fa";

import Modal from "./Modal";
import PageTitle from "../components/PageTitle";
import Breadcrumb from "../components/common/Breadcrumb";
import T from "../components/common/T";
import {
  FaTractor,
  FaBug,
  FaHandHoldingWater,
  FaTools,
  FaWarehouse,
} from "react-icons/fa";
import { useState } from "react";

const regionsAndDistricts = {
  GreaterAccra: [
    "Accra",
    "Tema",
    "Dome",
    "Adenta",
    "Ningo-Prampram",
    "Kpone-Katamanso",
  ],
  Ashanti: [
    "Kumasi",
    "Obuasi",
    "Asante Akim North",
    "Asante Akim South",
    "Amansie West",
    "Amansie Central",
    "Oforikrom",
    "Kwadaso",
    "Asokwa",
  ],
  Western: [
    "Sekondi-Takoradi",
    "Shama",
    "Mpohor",
    "Ellembele",
    "Jomoro",
    "Ahanta West",
  ],
  WesternNorth: [
    "Sefwi Wiawso",
    "Bodi",
    "Juaboso",
    "Bia West",
    "Bia East",
    "Sefwi Akontombra",
  ],
  Central: [
    "Cape Coast",
    "Elmina",
    "Abura-Asebu-Kwamankese",
    "Twifo-Heman-Lower-Denkyira",
    "Assin North",
    "Assin South",
  ],
  Eastern: [
    "Koforidua",
    "Birem North",
    "Birem South",
    "Abuakwa North",
    "Abuakwa South",
    "Kwahu East",
    "Kwahu South",
  ],
  Northern: ["Tamale", "Gushegu", "Bimbilla", "Savelugu", "Yendi", "Karaga"],
  UpperEast: ["Bolgatanga", "Bawku", "Navrongo", "Bongo", "Pusiga", "Tempane"],
  UpperWest: [
    "Wa",
    "Nandom",
    "Lawra",
    "Jirapa",
    "Sissala East",
    "Sissala West",
  ],
  Volta: ["Ho", "Hohoe", "Kpando", "Keta", "Akatsi", "Afadjato South"],
  Oti: ["Dambai", "Nkwanta", "Krachi East", "Krachi West"],
};

const advisoryData = {
  maize: {
    title: "Maize Advisory",
    stages: [
      {
        title: "Site Selection",
        icon: <FaSeedling />,
        advice:
          "Select well-drained loamy soil. Ensure proper sunlight exposure.",
        details:
          "Maize performs best in well-drained soils that receive full sunlight. Avoid flood-prone areas. Ensure fertile land.",
      },
      {
        title: "Land Preparation",
        icon: <FaTractor />,
        advice: "Clear the land early and ensure proper tillage.",
        details:
          "Use minimum tillage, and ensure the land is clear from debris. Spot burning may be used to clear organic matter. Prepare the land before the rains.",
      },
      {
        title: "Seed Selection",
        icon: <FaSeedling />,
        advice: "Purchase certified seed from registered input dealers.",
        details:
          "Use recommended maize varieties such as Abontem for short-duration growth (80-90 days) or Obaatampa for long-duration growth (105-120 days).",
      },
      {
        title: "First Fertilizer Application",
        icon: <FaHandHoldingWater />,
        advice:
          "Apply NPK 20:10:10 at the rate of 2 bags per acre, 14 days after planting.",
        details:
          "Ensure the field is moist before application. Use side placement at 3-5 cm away from the plant. Broadcast evenly for healthy growth.",
      },
      {
        title: "Weed Management",
        icon: <FaTools />,
        advice:
          "Control weeds early, using manual weeding or recommended selective herbicides.",
        details:
          "Apply herbicides such as Nico or Nomini Rice Pro. Weeding should be done within 3 weeks after planting to avoid crop competition.",
      },
      {
        title: "Pest Control",
        icon: <FaBug />,
        advice:
          "Apply pesticides to control Fall Armyworm and other pests early.",
        details:
          "Common pests like Fall Armyworm can be controlled using pesticides such as Warrior, Super Viper, or Bypel Attack. Apply early in the morning or late in the evening for best results.",
      },
      {
        title: "Second Fertilizer Application",
        icon: <FaHandHoldingWater />,
        advice:
          "Apply Urea at a rate of 1 bag per acre 6 weeks after planting.",
        details:
          "Ensure that the field is moist before application. Urea should be applied 3 weeks after the first fertilizer application for optimum nutrient absorption.",
      },
      {
        title: "Harvest",
        icon: <FaWarehouse />,
        advice:
          "Harvest when the maize is mature, and store in well-ventilated areas.",
        details:
          "Harvesting should be done early when the maize silk turns dry and brown. Store in hermetic bags to avoid pest attacks during storage.",
      },
    ],
  },
  GreaterAccra: {
    title: "Maize Advisory for Greater Accra",
    stages: [
      {
        title: "Irrigation",
        icon: <FaWater />,
        advice: "Utilize drip irrigation for better moisture retention.",
        details:
          "Given the urban nature of Greater Accra, consider efficient irrigation systems to manage water use effectively.",
      },
      {
        title: "Pest Control",
        icon: <FaBug />,
        advice: "Monitor for pests like the fall armyworm.",
        details:
          "Urban areas may have unique pest challenges, so stay vigilant.",
      },
    ],
  },
  Ashanti: {
    title: "Maize Advisory for Ashanti",
    stages: [
      {
        title: "Pest Control",
        icon: <FaBug />,
        advice: "Monitor for common pests and use integrated pest management.",
        details:
          "In the Ashanti region, pests like the fall armyworm can be prevalent, so regular monitoring is crucial.",
      },
      {
        title: "Fertilization",
        icon: <FaTractor />,
        advice: "Use organic fertilizers for better soil health.",
        details:
          "Organic fertilizers can enhance soil quality and maize yield.",
      },
    ],
  },
  rice: {
    title: "Rice Advisory",
    stages: [
      {
        title: "Site Selection",
        icon: <FaSeedling />,
        advice: "Select clay loam soil with good water retention.",
        details:
          "Clay loam soils are ideal for rice as they retain water. Ensure access to water sources for proper irrigation.",
      },
      {
        title: "Land Preparation",
        icon: <FaTractor />,
        advice:
          "Clear land early and create bunds to retain water during the growing season.",
        details:
          "Land preparation for rice includes bund construction, plowing, and leveling to ensure even water distribution. Prepare the land before the onset of the rainy season.",
      },
      {
        title: "Nursery Establishment",
        icon: <FaSeedling />,
        advice: "Use certified and improved seeds in appropriate beds.",
        details:
          "Rice nurseries should be established using raised or sunken beds, depending on water availability. Apply fertilizer and control pests early in the nursery stage.",
      },
      {
        title: "First Weeding",
        icon: <FaTools />,
        advice: "Weed 3 weeks after transplanting using selective herbicides.",
        details:
          "Control weeds using recommended herbicides. Use protective gear while spraying, and ensure that empty containers are buried appropriately.",
      },
      {
        title: "First Fertilizer Application",
        icon: <FaHandHoldingWater />,
        advice: "Apply NPK 20:10:10 three weeks after transplanting.",
        details:
          "Apply NPK fertilizer when there is adequate moisture in the field. Use broadcasting methods to ensure even distribution across the field.",
      },
      {
        title: "Pest Control",
        icon: <FaBug />,
        advice:
          "Control pests such as rice weevils and stem borers using selective insecticides.",
        details:
          "Use recommended pesticides like Azadirachtin to control pests that attack rice in its early growth stages.",
      },
      {
        title: "Bird Scaring and Netting",
        icon: <FaCalendarAlt />,
        advice: "Use scarecloths and nets to protect crops from birds.",
        details:
          "Set up nets at appropriate distances and mend them regularly. Remove dead birds from the fields and keep the area well-maintained.",
      },
      {
        title: "Harvesting",
        icon: <FaWarehouse />,
        advice: "Harvest rice when 70-80% of the pinnacles are dry.",
        details:
          "Harvesting should be done between July and August. Dry the harvested rice on platforms or tarpaulins to achieve the ideal moisture content of 13-15%.",
      },
    ],
  },
  GreaterAccraRegion: {
    title: "Rice Advisory for Greater Accra",
    stages: [
      {
        title: "Water Management",
        icon: <FaWater />,
        advice: "Implement efficient water use strategies.",
        details:
          "Due to limited water resources, ensure efficient water usage.",
      },
      {
        title: "Pest Monitoring",
        icon: <FaBug />,
        advice: "Regularly check for pests and diseases.",
        details: "Urban rice fields can attract specific pests; stay vigilant.",
      },
    ],
  },
  AshantiRegion: {
    title: "Rice Advisory for Ashanti",
    stages: [
      {
        title: "Soil Preparation",
        icon: <FaSeedling />,
        advice: "Prepare soil properly for water retention.",
        details: "Ensure good soil structure for effective rice growth.",
      },
      {
        title: "Crop Rotation",
        icon: <FaTractor />,
        advice: "Consider rotating rice with legumes.",
        details: "This practice can improve soil fertility and reduce pests.",
      },
    ],
  },
};

const AdvisoryPage = () => {
  const [selectedCrop, setSelectedCrop] = useState("maize");
  const [modalData, setModalData] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState();
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const handleCropChange = (crop) => {
    setSelectedCrop(crop);
  };

  const handleShowDetails = (stage) => {
    setModalData(stage);
  };

  const handleCloseModal = () => {
    setModalData(null);
  };

  const handleRegionChange = (e) => {
    setSelectedRegion(e.target.value);
    setSelectedDistrict(""); // Reset district when region changes
  };

  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
  };

  return (
    <>
      <PageTitle title="Crop Advisory Services" />
      <div className="neo-page min-h-screen pt-32 md:pt-36 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <Breadcrumb />
        <div className="text-center py-12">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4">
            <T>Crop Advisory</T>
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            <T>Agro-Characteristics Advisory for</T>{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              <T>Ghana</T>
            </span>
          </h1>
          <p className="text-slate-600 text-lg max-w-3xl mx-auto">
            <T>Stay informed about the best practices for crop production in
            Ghana’s tropical climate. Get advice on soil preparation,
            irrigation, pest control, and planting based on the local crop
            calendar.</T>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Season: Major Rainy Season */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaSeedling className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              <T>Major Rainy Season, Southern Ghana (March - July)</T>
            </h2>
            <p className="text-gray-700">
              <T>Recommended crops: Maize, Rice, Cassava. The start of the major
              rainy season is the optimal time to plant maize and rice. Ensure
              proper land preparation and consider organic fertilizers.</T>
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaSeedling className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              <T>Northern Rainy Season (May - October)</T>
            </h2>
            <p className="text-gray-700">
              <T>Recommended crops: Maize, Rice, Sorghum, Cowpea, Peanut, Soyabean.
              The start of the major rainy season is the optimal time to plant
              maize and rice. Ensure proper land preparation and consider
              organic fertilizers.</T>
            </p>
          </div>

          {/* Season: Minor Rainy Season */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaWater className="text-emerald-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              <T>Minor Rainy Season (September - November)</T>
            </h2>
            <p className="text-gray-700">
              <T>Recommended crops: Vegetables (Tomatoe, Pepper), Groundnut, Yam.
              Take advantage of the shorter rainy season to plant vegetables and
              short-cycle crops like groundnuts and yams.</T>
            </p>
          </div>

          {/* Season: Dry Season */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl p-6">
            <FaSun className="text-amber-500 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              <T>Dry Season (December - March)</T>
            </h2>
            <p className="text-gray-700">
              <T>Recommended tasks: Irrigation for vegetables (onion, carrot), Land
              preparation for the next rainy season. Use irrigation systems
              during the dry season to sustain vegetable growth.</T>
            </p>
          </div>
        </div>
        {/* Advisory Cards */}
        <div className="text-center py-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-3">
            <T>Crop Advisory</T>
          </h2>
          <p className="text-slate-600">
            <T>Get specific guidance on maize and rice farming in Ghana.</T>
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between mb-8 space-y-4 md:space-y-0">
          {/* Buttons for crop advisory */}
          <div className="flex flex-col md:flex-row space-x-0 md:space-x-4 space-y-4 md:space-y-0">
            <button
              className={`px-6 py-3 rounded-lg font-semibold transition-colors w-full md:w-auto ${
                selectedCrop === "maize"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-white border border-slate-300 text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
              }`}
              onClick={() => handleCropChange("maize")}
            >
              <T>Maize Advisory</T>
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-semibold transition-colors w-full md:w-auto ${
                selectedCrop === "rice"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-white border border-slate-300 text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
              }`}
              onClick={() => handleCropChange("rice")}
            >
              <T>Rice Advisory</T>
            </button>
          </div>

          {/* Region and district selectors */}
          <div className="flex flex-col md:flex-row space-x-0 md:space-x-4 space-y-4 md:space-y-0">
            <select
              value={selectedRegion}
              onChange={handleRegionChange}
              className="border rounded-lg p-2 w-full md:w-auto"
            >
              <option value="">Select Region</option>
              {Object.keys(regionsAndDistricts).map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>

            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="border rounded-lg p-2 w-full md:w-auto"
              disabled={!selectedRegion}
            >
              <option value="">Select District</option>
              {selectedRegion &&
                regionsAndDistricts[selectedRegion].map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
          {advisoryData[selectedCrop].stages.map((stage, index) => (
            <div
              key={index}
              className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 text-2xl flex items-center justify-center mx-auto mb-4">{stage.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {stage.title}
              </h3>
              <p className="text-slate-600 text-sm">{stage.advice}</p>
              <button
                className="mt-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                onClick={() => handleShowDetails(stage)}
              >
                <T>Learn more</T>
              </button>
            </div>
          ))}
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
            <T>Download Full Advisory as PDF</T>
          </button>
        </div>

        <div className="mb-4">
          <div className="mt-12 text-center">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">
              <T>Need More Advice?</T>
            </h3>
            <p className="text-slate-600 mb-6">
              <T>Reach out to our agricultural experts for personalized advice
              tailored to Ghana climate and your specific region.</T>
            </p>
          </div>

          <div className="flex justify-center gap-6">
            {/* Call Button */}

            <a
              href="tel:+2330243999631"
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <FaPhoneAlt />
              <T>Call an Expert</T>
            </a>

            {/* Email Button */}
            <a
              href="mailto:stephen.amankwah@meteo.gov.gh"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 text-slate-700 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <FaEnvelope />
              <T>Email an Expert</T>
            </a>
          </div>
          {/* Modal for Detailed Advice */}
          {modalData && (
            <Modal title={modalData.title} onClose={handleCloseModal}>
              <div className="p-4">
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  {modalData.title}
                </h3>
                <p className="text-slate-600">{modalData.details}</p>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default AdvisoryPage;
