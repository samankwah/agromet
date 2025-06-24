import {
  FaSeedling,
  FaSun,
  FaWater,
  FaEnvelope,
  FaPhoneAlt,
  FaCalendarAlt,
} from "react-icons/fa";

import Modal from "./Modal";
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
    <div className="min-h-screen bg-blue-50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-8">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-blue-700 mb-2">
            Agro-Characteristics Advisory for Ghana
          </h1>
          <p className="text-gray-700 text-lg">
            Stay informed about the best practices for crop production in
            Ghana’s tropical climate. Get advice on soil preparation,
            irrigation, pest control, and planting based on the local crop
            calendar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Season: Major Rainy Season */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaSeedling className="text-blue-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Major Rainy Season, Southern Ghana (March - July)
            </h2>
            <p className="text-gray-700">
              Recommended crops: Maize, Rice, Cassava. The start of the major
              rainy season is the optimal time to plant maize and rice. Ensure
              proper land preparation and consider organic fertilizers.
            </p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaSeedling className="text-blue-600 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Northern Rainy Season (May - October)
            </h2>
            <p className="text-gray-700">
              Recommended crops: Maize, Rice, Sorghum, Cowpea, Peanut, Soyabean.
              The start of the major rainy season is the optimal time to plant
              maize and rice. Ensure proper land preparation and consider
              organic fertilizers.
            </p>
          </div>

          {/* Season: Minor Rainy Season */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaWater className="text-blue-500 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Minor Rainy Season (September - November)
            </h2>
            <p className="text-gray-700">
              Recommended crops: Vegetables (Tomatoe, Pepper), Groundnut, Yam.
              Take advantage of the shorter rainy season to plant vegetables and
              short-cycle crops like groundnuts and yams.
            </p>
          </div>

          {/* Season: Dry Season */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <FaSun className="text-yellow-500 text-3xl mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Dry Season (December - March)
            </h2>
            <p className="text-gray-700">
              Recommended tasks: Irrigation for vegetables (onion, carrot), Land
              preparation for the next rainy season. Use irrigation systems
              during the dry season to sustain vegetable growth.
            </p>
          </div>
        </div>
        {/* Advisory Cards */}
        <div className="text-center py-8">
          <h1 className="text-4xl text-blue-700 font-bold mb-2">
            Crop Advisory
          </h1>
          <p className="text-gray-700">
            Get specific guidance on maize and rice farming in Ghana.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between mb-8 space-y-4 md:space-y-0">
          {/* Buttons for crop advisory */}
          <div className="flex flex-col md:flex-row space-x-0 md:space-x-4 space-y-4 md:space-y-0">
            <button
              className={`p-4 rounded-lg shadow-md w-full md:w-auto ${
                selectedCrop === "maize"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600"
              }`}
              onClick={() => handleCropChange("maize")}
            >
              Maize Advisory
            </button>
            <button
              className={`p-4 rounded-lg shadow-md w-full md:w-auto ${
                selectedCrop === "rice"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600"
              }`}
              onClick={() => handleCropChange("rice")}
            >
              Rice Advisory
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
              className="p-4 bg-white rounded-lg shadow-lg text-center"
            >
              <div className="text-3xl text-blue-600 mb-2">{stage.icon}</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {stage.title}
              </h3>
              <p className="text-gray-600">{stage.advice}</p>
              <button
                className="mt-2 text-sm text-blue-500 underline"
                onClick={() => handleShowDetails(stage)}
              >
                Learn more
              </button>
            </div>
          ))}
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
              Reach out to our agricultural experts for personalized advice
              tailored to Ghana climate and your specific region.
            </p>
          </div>

          <div className="flex justify-center gap-6">
            {/* Call Button */}

            <a
              href="tel:+2330243999631"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-200 flex items-center gap-2"
            >
              <FaPhoneAlt />
              Call an Expert
            </a>

            {/* Email Button */}
            <a
              href="mailto:stephen.amankwah@meteo.gov.gh"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-200 flex items-center gap-2"
            >
              <FaEnvelope />
              Email an Expert
            </a>
          </div>
          {/* Modal for Detailed Advice */}
          {modalData && (
            <Modal title={modalData.title} onClose={handleCloseModal}>
              <div className="p-4">
                <h3 className="text-lg font-bold text-blue-700 mb-6">
                  {modalData.title}
                </h3>
                <p className="text-gray-600">{modalData.details}</p>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvisoryPage;
