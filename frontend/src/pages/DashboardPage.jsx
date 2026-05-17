// src/pages/DashboardPage.jsx
import React from "react";
import Dashboard from "../components/Dashboard/Dashboard";
import PageTitle from "../components/PageTitle";

const DashboardPage = () => {
  // You might fetch the user's name from your authentication context/state
  const username = "User"; // Replace with actual username from your auth system

  return (
    <>
      <PageTitle title="Admin Dashboard" />
      <div>
        <Dashboard username={username} />
      </div>
    </>
  );
};

export default DashboardPage;
