import PageTitle from '../components/PageTitle';
import nationalAssemblyVisitImage from "../assets/images/image2.png";

const BlogNationalAssemblyVisit = () => {
  return (
    <>
      <PageTitle title="National Assembly Visit Blog" />
      <div className="pt-24 pb-16 px-4 md:px-0 max-w-5xl mx-auto bg-white shadow-lg rounded-lg">
      {/* Blog Header */}
      <header className="mb-12">
        {/* Featured Image */}
        <div className="relative mb-8">
          <img
            src={nationalAssemblyVisitImage}
            alt="National Assembly Visit to Meteorological Agency"
            className="w-full h-auto rounded-lg shadow-lg object-cover"
          />
          <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg">
            <p className="text-xs font-semibold uppercase">Official Visit</p>
          </div>
        </div>

        {/* Title, Author, and Date */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-blue-800 mb-4">
            National Assembly Visit to the Meteorological Agency
          </h1>
          <p className="text-gray-500 text-sm mb-4">
            Published on October 12, 2024 by{" "}
            <span className="font-semibold text-gray-700">Admin</span>
          </p>
        </div>
      </header>

      {/* Blog Content */}
      <article className="leading-relaxed text-lg text-gray-700 mb-8">
        <p className="mb-6">
          The National Assembly committee on Environment, Forestry, and Mining
          recently paid a visit to the Ghana Meteorological Agency (GMet) as
          part of an oversight responsibility to assess and understand the
          current state of Ghana’s meteorological infrastructure. The visit was
          crucial to highlight the importance of accurate weather forecasting in
          agriculture, public safety, and national planning.
        </p>

        <p className="mb-6">
          During the visit, the committee was briefed on the modernization
          efforts at GMet, including advancements in meteorological data
          collection and the integration of satellite technology. GMet officials
          demonstrated how real-time weather data is collected and processed to
          provide timely forecasts.
        </p>

        <p className="mb-6">
          The committee was particularly interested in GMet’s early warning
          systems for extreme weather events, which play a vital role in
          reducing the impact of floods and droughts in Ghana. They also
          emphasized the need for increased government support to further
          improve the agency’s capacity to monitor climate change and provide
          accurate data for disaster preparedness.
        </p>

        <blockquote className="border-l-4 border-blue-600 italic text-blue-700 px-4 py-2 my-6">
          Investing in our meteorological services is critical to our nation
          security and economic well-being, said Hon. John Doe, chairperson of
          the committee.
        </blockquote>

        <p className="mb-6">
          The visit concluded with a commitment from the National Assembly to
          secure additional funding and support for GMet’s continued
          modernization efforts. This visit underscores the importance of
          national collaboration in addressing the effects of climate change and
          preparing the country for future weather-related challenges.
        </p>
      </article>

      {/* Call-to-Action (Optional) */}
      <div className="bg-blue-50 border-l-4 border-blue-600 px-6 py-4 mb-8 rounded-md shadow-md">
        <h2 className="text-2xl font-semibold text-blue-800 mb-2">
          Support GMet Mission
        </h2>
        <p className="text-gray-700">
          Learn more about how GMet is working to improve weather forecasting in
          Ghana and how you can support its mission to protect communities from
          extreme weather.
        </p>
      </div>

      {/* Related Articles Section */}
      <section className="border-t border-gray-200 pt-6">
        <h3 className="text-3xl font-semibold text-blue-800 mb-6">
          Related Articles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Related Article Item */}
          <div className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              Climate Committee Calls for More Support to GMet
            </h4>
            <p className="text-gray-600 mb-4">
              The National Assembly has pledged more support for the Ghana
              Meteorological Agency after a recent visit.
            </p>
            <a href="/" className="text-blue-600 font-semibold hover:underline">
              Read More →
            </a>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              GMet’s Role in Disaster Preparedness
            </h4>
            <p className="text-gray-600 mb-4">
              Learn how GMet’s accurate weather data is helping Ghana prepare
              for natural disasters.
            </p>
            <a href="/" className="text-blue-600 font-semibold hover:underline">
              Read More →
            </a>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              GMet Launches New Satellite Weather Monitoring System
            </h4>
            <p className="text-gray-600 mb-4">
              The Ghana Meteorological Agency has unveiled a new satellite
              system to improve real-time weather monitoring.
            </p>
            <a href="/" className="text-blue-600 font-semibold hover:underline">
              Read More →
            </a>
          </div>
        </div>
      </section>
      </div>
    </>
  );
};

export default BlogNationalAssemblyVisit;
