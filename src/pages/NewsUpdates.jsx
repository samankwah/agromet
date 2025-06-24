const NewsUpdates = () => {
  const newsArticles = [
    {
      title: "Heavy Rainfall Expected This Week",
      date: "September 20, 2024",
      summary:
        "Meteorologists predict heavy rainfall in the western regions, with possible flooding.",
    },
    {
      title: "Drought Conditions Persist in the East",
      date: "September 15, 2024",
      summary:
        "The eastern parts of the country are experiencing prolonged drought, affecting crops.",
    },
    {
      title: "New Agricultural Policies Announced",
      date: "September 10, 2024",
      summary:
        "The government has announced new policies aimed at supporting farmers during this transition period.",
    },
    // Add more articles as needed
  ];

  return (
    <div className="bg-gradient-to-br from-green-50 to-green-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-green-800 text-3xl font-bold mb-4 text-center">
          Latest News Updates
        </h1>

        <div className="space-y-4">
          {newsArticles.map((article, index) => (
            <div key={index} className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold text-green-600">
                {article.title}
              </h2>
              <p className="text-gray-500 text-sm mb-1">{article.date}</p>
              <p className="text-gray-700">{article.summary}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <a
            href="/path/to/full-news-archive"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
          >
            View Full News Archive
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewsUpdates;
