import gmetVisitImage from "../assets/images/image1.png";
import PageTitle from "../components/PageTitle";

const BlogGmetVisit = () => {
  return (
    <>
      <PageTitle title="Visit to GMet by Ministry of Environment" />
      <div className="pt-24 pb-16 px-4 md:px-0 max-w-5xl mx-auto bg-white shadow-lg rounded-lg">
      {/* Blog Header */}
      <header className="mb-12">
        {/* Featured Image */}
        <div className="relative mb-8">
          <img
            src={gmetVisitImage}
            alt="GMet Visit by Ministry of Environment"
            className="w-full h-auto rounded-lg shadow-lg object-cover"
          />
          <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg">
            <p className="text-xs font-semibold uppercase">GMet Visit</p>
          </div>
        </div>

        {/* Title, Author, and Date */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-blue-800 mb-4">
            Visit to GMet by Ministry of Environment
          </h1>
          <p className="text-gray-500 text-sm mb-4">
            Published on October 10, 2024 by{" "}
            <span className="font-semibold text-gray-700">Admin</span>
          </p>
        </div>
      </header>

      {/* Blog Content */}
      <article className="leading-relaxed text-lg text-gray-700 mb-8">
        <p className="mb-6">
          Hon. Stephen Amankwah, Minister of Environment, Climate Change, and PS
          Dr. Eng. Festus visited GMet to discuss various climate-related
          topics. This visit focused on collaborative efforts between the
          Ministry and GMet to enhance climate monitoring and develop effective
          climate change mitigation strategies.
        </p>

        <p className="mb-6">
          The meeting involved discussions on modernizing meteorological
          systems, improving the accuracy of weather forecasts, and advancing
          early warning systems to help mitigate the impact of extreme weather
          events in Ghana. The Minister expressed appreciation for GMet efforts
          in providing reliable climate data and ensuring public safety.
        </p>

        <p className="mb-6">
          Both parties also stressed the importance of educating the public
          about climate change and promoting community involvement in climate
          resilience efforts. The visit marks an important milestone in the
          government ongoing commitment to addressing the challenges posed by
          climate change in Ghana.
        </p>

        <blockquote className="border-l-4 border-blue-600 italic text-blue-700 px-4 py-2 my-6">
          This collaboration represents a significant step towards a more
          resilient and sustainable climate policy framework for Ghana, stated
          Hon. Stephen Amankwah during his remarks at the event.
        </blockquote>

        <p className="mb-6">
          The outcome of the visit promises to further strengthen ties between
          the Ministry of Environment and GMet, paving the way for more
          integrated and effective climate action across the country.
        </p>
      </article>

      {/* Call-to-Action (Optional) */}
      <div className="bg-blue-50 border-l-4 border-blue-600 px-6 py-4 mb-8 rounded-md shadow-md">
        <h2 className="text-2xl font-semibold text-blue-800 mb-2">
          Join the Climate Action Movement
        </h2>
        <p className="text-gray-700">
          Stay informed on the latest climate updates and how you can contribute
          to Ghana’s sustainability efforts.
          <span className="font-semibold text-blue-600">
            {" "}
            Sign up for our newsletter
          </span>{" "}
          for regular updates.
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
              GMet Partners with International Climate Agencies
            </h4>
            <p className="text-gray-600 mb-4">
              A groundbreaking partnership between GMet and international
              agencies is underway to combat climate challenges.
            </p>
            <a href="/" className="text-blue-600 font-semibold hover:underline">
              Read More →
            </a>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              Ministerial Meeting on Climate Change
            </h4>
            <p className="text-gray-600 mb-4">
              Government officials meet to address Ghana’s rising climate
              concerns and potential policy changes.
            </p>
            <a href="/" className="text-blue-600 font-semibold hover:underline">
              Read More →
            </a>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              Ghana Early Warning Systems Show Progress
            </h4>
            <p className="text-gray-600 mb-4">
              The country early warning systems have seen significant
              improvements thanks to GMet’s efforts.
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

export default BlogGmetVisit;
