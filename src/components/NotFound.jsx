import { Link } from "react-router-dom";
import PageTitle from './PageTitle';
import notFound from "../assets/images/notfound.svg";

const NotFound = () => {
  return (
    <>
      <PageTitle title="Page Not Found" />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <img src={notFound} alt="404 Not Found" className="mb-6 w-80 h-auto" />
      <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
      <p className="text-2xl text-gray-700 mb-6">Oops! Page not found.</p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-500 text-white rounded-md text-lg hover:bg-blue-600 transition duration-200"
      >
        Go Back Home
      </Link>
      </div>
    </>
  );
};

export default NotFound;
