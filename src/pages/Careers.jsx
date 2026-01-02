import PageTitle from '../components/PageTitle';

// Sample job data tailored to the Ghanaian market
const jobListings = [
  {
    title: "Software Engineer",
    department: "Engineering",
    location: "Accra, Ghana",
    description:
      "Join our innovative tech team to develop software solutions that drive business success in Ghana's growing digital economy.",
  },
  {
    title: "Product Manager",
    department: "Product Development",
    location: "Kumasi, Ghana",
    description:
      "Lead product strategy and collaborate with cross-functional teams to enhance our offerings for the Ghanaian market.",
  },
  {
    title: "Marketing Specialist",
    department: "Marketing",
    location: "Takoradi, Ghana",
    description:
      "Help us create impactful marketing strategies that resonate with our customers in Ghana and beyond.",
  },
  {
    title: "Business Analyst",
    department: "Business Development",
    location: "Tamale, Ghana",
    description:
      "Analyze market trends and help shape our business strategies to align with the needs of the Ghanaian market.",
  },
  {
    title: "Sales Representative",
    department: "Sales",
    location: "Accra, Ghana",
    description:
      "Drive sales and foster relationships with clients in Accra to promote our products and services.",
  },
  // Add more job listings as needed
];

const Careers = () => {
  return (
    <>
      <PageTitle title="Careers" />
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen p-8 ">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 pt-20">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">
          Careers in Ghana
        </h1>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Job Openings</h2>
          <p className="text-gray-600">
            Explore our current job openings and become a part of our growing
            team in Ghana!
          </p>
        </div>

        {/* Job Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobListings.map((job, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-2xl p-4 hover:shadow-lg transition duration-300"
            >
              <h3 className="text-xl font-semibold text-gray-800">
                {job.title}
              </h3>
              <p className="text-gray-600">{job.department}</p>
              <p className="text-gray-600">{job.location}</p>
              <p className="text-gray-700 mt-2">{job.description}</p>
              <button className="mt-4 p-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition duration-300">
                Apply Now
              </button>
            </div>
          ))}
        </div>

        {/* Filter Options (Optional) */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Filter Jobs</h2>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <select className="border border-gray-300 rounded p-2 flex-1">
              <option value="">Select Department</option>
              <option value="Engineering">Engineering</option>
              <option value="Product Development">Product Development</option>
              <option value="Marketing">Marketing</option>
              <option value="Business Development">Business Development</option>
              <option value="Sales">Sales</option>
              {/* Add more options as needed */}
            </select>
            <select className="border border-gray-300 rounded p-2 flex-1">
              <option value="">Select Location</option>
              <option value="Accra">Accra</option>
              <option value="Kumasi">Kumasi</option>
              <option value="Takoradi">Takoradi</option>
              <option value="Tamale">Tamale</option>
              {/* Add more options as needed */}
            </select>
            <button className="bg-blue-9-00 text-white rounded p-2 flex-none hover:bg-blue-800 transition duration-300">
              Filter
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Careers;
