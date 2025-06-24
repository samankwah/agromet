// src/pages/DashboardPage.jsx
import React from "react";
import Dashboard from "../components/Dashboard/Dashboard";
import Navbar from "../components/Header"; // Your existing navbar
// import Footer from "../components/Footer"; // Your existing footer

const DashboardPage = () => {
  // You might fetch the user's name from your authentication context/state
  const username = "User"; // Replace with actual username from your auth system

  return (
    <div>
      {/* <Navbar /> Your existing navigation */}
      <Dashboard username={username} />
      {/* <Footer /> Your existing footer */}
    </div>
  );
};

export default DashboardPage;
