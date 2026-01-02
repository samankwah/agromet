// import sonForecastImage from "../assets/images/image3.png";

// const BlogSonForecast = () => {
//   return (
//     <div className="pt-24 pb-16 px-4 md:px-0 max-w-5xl mx-auto bg-white shadow-lg rounded-lg">
//       {/* Blog Header */}
//       <header className="mb-12">
//         {/* Featured Image */}
//         <div className="relative mb-8">
//           <img
//             src={sonForecastImage}
//             alt="Release of the SON Seasonal Forecast"
//             className="w-full h-auto rounded-lg shadow-lg object-cover"
//           />
//           <div className="absolute top-4 left-4 bg-yellow-600 text-white px-4 py-2 rounded-md shadow-lg">
//             <p className="text-xs font-semibold uppercase">Seasonal Forecast</p>
//           </div>
//         </div>

//         {/* Title, Author, and Date */}
//         <div className="text-center">
//           <h1 className="text-5xl font-bold text-blue-800 mb-4">
//             Release of the SON (September - November) Seasonal Forecast
//           </h1>
//           <p className="text-gray-500 text-sm mb-4">
//             Published on September 10, 2024 by{" "}
//             <span className="font-semibold text-gray-700">GMet Team</span>
//           </p>
//         </div>
//       </header>

//       {/* Blog Content */}
//       <article className="leading-relaxed text-lg text-gray-700 mb-8">
//         <p className="mb-6">
//           The Ghana Meteorological Agency (GMet) has officially released the
//           **SON (September - November)** seasonal forecast, providing crucial
//           insights into the expected weather patterns across the country for the
//           upcoming months. This forecast aims to assist farmers, policymakers,
//           and the general public in preparing for the changing weather
//           conditions.
//         </p>

//         <p className="mb-6">
//           The SON period represents the tail end of the major rainy season in
//           southern Ghana and the transition to the dry season in the northern
//           parts of the country. According to GMet forecast, **above-average
//           rainfall** is expected in parts of the Southern and Middle Belt,
//           particularly in the **Ashanti, Eastern, and Western regions**, while
//           the northern regions will experience relatively dry conditions with
//           isolated showers.
//         </p>

//         <p className="mb-6">
//           GMet’s forecast has been compiled using advanced meteorological data
//           from satellite systems, ground stations, and weather models. The
//           Agency emphasized the potential impact of this seasonal forecast on
//           agricultural activities, public safety, and disaster management. The
//           public is encouraged to stay informed about updates as the weather can
//           change rapidly during this period.
//         </p>

//         {/* Key Points */}
//         <div className="bg-yellow-50 border-l-4 border-yellow-500 px-6 py-4 my-6 rounded-md shadow-md">
//           <h2 className="text-2xl font-semibold text-yellow-800 mb-2">
//             Key Insights from the SON Forecast
//           </h2>
//           <ul className="list-disc ml-6 text-gray-700">
//             <li className="mb-2">
//               **Above-average rainfall** is expected in the Southern Belt,
//               including Greater Accra and Volta regions.
//             </li>
//             <li className="mb-2">
//               **Isolated showers** are likely in the Northern parts of Ghana,
//               while the Middle Belt will experience a mix of dry and wet spells.
//             </li>
//             <li className="mb-2">
//               Farmers in the south are advised to prepare for possible
//               **flooding** in low-lying areas.
//             </li>
//             <li className="mb-2">
//               The public is encouraged to stay updated on potential **storm
//               warnings** and weather advisories.
//             </li>
//           </ul>
//         </div>

//         <p className="mb-6">
//           Furthermore, GMet stressed the importance of using weather forecasts
//           to support agricultural planning, especially for farmers in the
//           southern regions. These forecasts will help farmers adjust their
//           planting schedules and choose the right crops for the expected
//           rainfall patterns.
//         </p>

//         <blockquote className="border-l-4 border-yellow-600 italic text-yellow-700 px-4 py-2 my-6">
//           We urge the public to take this forecast seriously and make necessary
//           preparations for the season ahead. The right decisions can minimize
//           the risks posed by heavy rainfall or drought, stated Dr. Kofi Owusu,
//           Director-General of GMet.
//         </blockquote>

//         <p className="mb-6">
//           The forecast also serves as a reminder for emergency services to be on
//           high alert for potential **flooding**, particularly in urban areas
//           where drainage systems may be overwhelmed by heavy rains.
//         </p>
//       </article>

//       {/* Call-to-Action (Optional) */}
//       <div className="bg-blue-50 border-l-4 border-blue-600 px-6 py-4 mb-8 rounded-md shadow-md">
//         <h2 className="text-2xl font-semibold text-blue-800 mb-2">
//           Stay Informed on Weather Alerts
//         </h2>
//         <p className="text-gray-700">
//           Keep up with real-time weather updates and seasonal forecasts from
//           GMet by following our official channels.
//         </p>
//       </div>

//       {/* Related Articles Section */}
//       <section className="border-t border-gray-200 pt-6">
//         <h3 className="text-3xl font-semibold text-blue-800 mb-6">
//           Related Articles
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           {/* Related Article Item */}
//           <div className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
//             <h4 className="text-xl font-bold text-gray-800 mb-2">
//               How to Prepare for Heavy Rainfall in Ghana
//             </h4>
//             <p className="text-gray-600 mb-4">
//               Learn about the measures you can take to protect your property
//               during the rainy season.
//             </p>
//             <a href="/" className="text-blue-600 font-semibold hover:underline">
//               Read More →
//             </a>
//           </div>

//           <div className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
//             <h4 className="text-xl font-bold text-gray-800 mb-2">
//               GMet Role in Disaster Preparedness
//             </h4>
//             <p className="text-gray-600 mb-4">
//               Discover how GMet helps Ghana prepare for extreme weather events
//               and natural disasters.
//             </p>
//             <a href="/" className="text-blue-600 font-semibold hover:underline">
//               Read More →
//             </a>
//           </div>

//           <div className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
//             <h4 className="text-xl font-bold text-gray-800 mb-2">
//               Seasonal Forecasting Explained
//             </h4>
//             <p className="text-gray-600 mb-4">
//               Understand the science behind seasonal forecasting and its impact
//               on agriculture and daily life.
//             </p>
//             <a href="/" className="text-blue-600 font-semibold hover:underline">
//               Read More →
//             </a>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default BlogSonForecast;

// import calendarImage from "../assets/images/event2.png"; // Add your image path

// const EventHeavyRainfallAlert = () => {
//   return (
//     <div className="pt-24 pb-16 px-4 md:px-0 max-w-5xl mx-auto bg-white shadow-lg rounded-lg">
//       {/* Header Section */}
//       <header className="mb-12">
//         {/* Featured Image */}
//         <div className="relative mb-8">
//           <img
//             src={calendarImage}
//             alt="Heavy Rainfall Warning for Northern Regions"
//             className="w-full h-auto rounded-lg shadow-lg object-cover"
//           />
//           <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg">
//             <p className="text-xs font-semibold uppercase">Weather Alert</p>
//           </div>
//         </div>

//         {/* Title, Date, and Venue */}
//         <div className="text-center">
//           <h1 className="text-5xl font-bold text-red-800 mb-4">
//             Heavy Rainfall Expected in Northern Regions
//           </h1>
//           <p className="text-gray-500 text-sm mb-4">
//             Issued by Ghana Meteorological Agency (GMet)
//           </p>
//           <p className="text-lg text-gray-600">
//             <strong>Forecast Period:</strong> Week of April 21, 2025 •{" "}
//             <strong>Location:</strong> Northern Regions, Ghana
//           </p>
//         </div>
//       </header>

//       {/* Alert Content */}
//       <article className="leading-relaxed text-lg text-gray-700 mb-8">
//         <p className="mb-6">
//           The Ghana Meteorological Agency (GMet) has issued a warning for
//           **heavy rainfall** expected across the northern regions of Ghana
//           during the week of April 21, 2025. This forecast indicates significant
//           precipitation that could lead to flooding, disruptions in
//           transportation, and potential damage to crops and infrastructure.
//         </p>

//         <p className="mb-6">
//           Residents in the Northern, North East, Savannah, and Upper East
//           regions are advised to take precautions, including avoiding
//           flood-prone areas, securing property, and staying updated with GMet’s
//           weather alerts. Farmers are urged to protect crops and livestock from
//           potential flood impacts.
//         </p>

//         <p className="mb-6">
//           GMet will continue to monitor the situation and provide real-time
//           updates through its digital platforms and local authorities. Stay
//           informed and prioritize safety during this period of adverse weather.
//         </p>
//       </article>

//       {/* Key Information Section */}
//       <div className="bg-red-50 border-l-4 border-red-600 px-6 py-4 my-6 rounded-md shadow-md">
//         <h2 className="text-2xl font-semibold text-red-800 mb-4">
//           Alert Highlights
//         </h2>
//         <ul className="list-disc list-inside text-gray-700">
//           <li className="mb-2">
//             **Affected Regions**: Northern, North East, Savannah, Upper East
//           </li>
//           <li className="mb-2">
//             **Expected Rainfall**: Heavy, with potential for flooding
//           </li>
//           <li className="mb-2">
//             **Safety Measures**: Avoid flood-prone areas, secure property
//           </li>
//           <li className="mb-2">
//             **Updates**: Real-time alerts via GMet platforms
//           </li>
//         </ul>
//       </div>

//       {/* Call-to-Action */}
//       <div className="bg-blue-50 border-l-4 border-blue-600 px-6 py-4 mb-8 rounded-md shadow-md">
//         <h2 className="text-2xl font-semibold text-blue-800 mb-4">
//           Stay Informed
//         </h2>
//         <p className="text-gray-700 mb-4">
//           Stay safe by following GMet’s weather updates and adhering to safety
//           guidelines during this heavy rainfall period. Access resources and
//           recommendations to protect yourself and your property.
//         </p>
//         <a
//           href="/safety-guidelines"
//           className="inline-block bg-red-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-red-700 transition-colors duration-300"
//         >
//           View Safety Guidelines
//         </a>
//       </div>

//       {/* Alert Details */}
//       <section className="mt-12 border-t border-gray-200 pt-8">
//         <h3 className="text-3xl font-semibold text-red-800 mb-6">
//           Alert Details
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           <div className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
//             <h4 className="text-xl font-bold text-gray-800 mb-2">
//               Forecast Period
//             </h4>
//             <p className="text-gray-600">Week of April 21, 2025</p>
//           </div>

//           <div className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
//             <h4 className="text-xl font-bold text-gray-800 mb-2">Location</h4>
//             <p className="text-gray-600">Northern Regions, Ghana</p>
//           </div>

//           <div className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
//             <h4 className="text-xl font-bold text-gray-800 mb-2">Issuer</h4>
//             <p className="text-gray-600">Ghana Meteorological Agency (GMet)</p>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default EventHeavyRainfallAlert;

import { useState } from "react";
import PageTitle from '../components/PageTitle';
import calendarImage from "../assets/images/event2.png"; // Add your image path
import {
  FaCloudRain,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaShareAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const EventHeavyRainfallAlert = () => {
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  const toggleTips = () => setIsTipsOpen(!isTipsOpen);

  return (
    <>
      <PageTitle title="SON Forecast Blog" />
      <div className="pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto bg-gradient-to-b from-blue-100 to-gray-100 shadow-2xl rounded-2xl overflow-hidden">
      {/* Header Section */}
      <header className="mb-12 animate-fade-in">
        {/* Featured Image */}
        <div className="relative mb-8 overflow-hidden rounded-xl">
          <img
            src={calendarImage}
            alt="Heavy Rainfall Warning for Northern Regions"
            className="w-full h-64 md:h-96 object-cover transform hover:scale-105 transition-transform duration-500 ease-in-out"
          />
          <div className="absolute top-4 left-4 bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
            <FaCloudRain className="mr-2" />
            <p className="text-sm font-bold uppercase">Weather Alert</p>
          </div>
        </div>

        {/* Title, Date, and Venue */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-red-700 mb-4">
            Heavy Rainfall Alert: Northern Regions
          </h1>
          <p className="text-gray-600 text-sm md:text-base mb-4">
            Issued by Ghana Meteorological Agency (GMet)
          </p>
          <p className="text-lg md:text-xl text-gray-700 font-semibold">
            <strong>Period:</strong> Week of April 21, 2025 •{" "}
            <strong>Location:</strong> Northern Regions, Ghana
          </p>
        </div>
      </header>

      {/* Alert Content */}
      <article className="leading-relaxed text-base md:text-lg text-gray-800 mb-12 animate-fade-in">
        <p className="mb-6">
          Brace for impact! The Ghana Meteorological Agency (GMet) has issued an
          urgent warning for **heavy rainfall** across Northern Ghana starting
          April 21, 2025. Expect intense downpours that could trigger flooding,
          disrupt travel, and threaten crops and infrastructure.
        </p>

        <p className="mb-6">
          If you’re in the Northern, North East, Savannah, or Upper East
          regions, act now: steer clear of flood-prone zones, secure your
          property, and keep an eye on GMet’s updates. Farmers, take steps to
          shield your crops and livestock from potential damage.
        </p>

        <p className="mb-6">
          GMet is on high alert, delivering real-time updates via digital
          platforms and local authorities. Stay safe, stay informed, and let’s
          weather this storm together!
        </p>
      </article>

      {/* Severity Indicator */}
      <div className="bg-red-50 border-l-4 border-red-700 px-6 py-4 mb-8 rounded-lg shadow-md animate-fade-in">
        <h2 className="text-2xl font-semibold text-red-700 mb-4 flex items-center">
          <FaCloudRain className="mr-2" /> Rainfall Severity
        </h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-red-600 h-4 rounded-full"
            style={{ width: "80%" }}
          ></div>
        </div>
        <p className="text-gray-700 mt-2">
          High Risk: Potential for severe flooding
        </p>
      </div>

      {/* Quick Tips Section (Collapsible) */}
      <div className="bg-blue-50 border-l-4 border-blue-600 px-6 py-4 mb-8 rounded-lg shadow-md animate-fade-in">
        <button
          onClick={toggleTips}
          className="w-full flex justify-between items-center text-2xl font-semibold text-blue-800 mb-4 focus:outline-none"
        >
          <span>Quick Safety Tips</span>
          {isTipsOpen ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        {isTipsOpen && (
          <ul className="list-disc list-inside text-gray-700 animate-fade-in">
            <li className="mb-2">Avoid crossing flooded roads or rivers.</li>
            <li className="mb-2">Elevate valuables above flood levels.</li>
            <li className="mb-2">Monitor local news and GMet alerts.</li>
            <li className="mb-2">Prepare an emergency kit with essentials.</li>
          </ul>
        )}
      </div>

      {/* Call-to-Action */}
      <div className="bg-gray-50 border-l-4 border-blue-600 px-6 py-4 mb-12 rounded-lg shadow-md animate-fade-in">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4">
          Take Action Now
        </h2>
        <p className="text-gray-700 mb-6">
          Don’t get caught unprepared! Follow GMet’s live updates and safety
          guidelines to protect yourself, your family, and your property during
          this heavy rainfall.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/safety-guidelines"
            className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300"
          >
            View Safety Guidelines
          </a>
          <a
            href="/live-updates"
            className="inline-block bg-green-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-300"
          >
            Get Live Updates
          </a>
          <div className="flex gap-2">
            <a
              href="#"
              className="inline-flex items-center bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-gray-700 transition-colors duration-300"
            >
              <FaShareAlt className="mr-2" /> Share
            </a>
          </div>
        </div>
      </div>

      {/* Alert Details */}
      <section className="mt-12 animate-fade-in">
        <h3 className="text-3xl font-semibold text-red-700 mb-8">
          Alert Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-start">
            <FaCalendarAlt className="text-blue-600 text-2xl mr-4" />
            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                Forecast Period
              </h4>
              <p className="text-gray-600">Week of April 21, 2025</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-start">
            <FaMapMarkerAlt className="text-blue-600 text-2xl mr-4" />
            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Location</h4>
              <p className="text-gray-600">Northern Regions, Ghana</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-start">
            <FaCloudRain className="text-blue-600 text-2xl mr-4" />
            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Issuer</h4>
              <p className="text-gray-600">
                Ghana Meteorological Agency (GMet)
              </p>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
};

export default EventHeavyRainfallAlert;
