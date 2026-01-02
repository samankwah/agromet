/* eslint-disable react/prop-types */
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const MyLink = ({ children, to, ...props }) => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on location change
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Link to={to} {...props}>
      {children}
    </Link>
  );
};

export default MyLink;
