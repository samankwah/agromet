import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreatePoultryCalendar from "../components/Dashboard/CreatePoultryCalendar";
import PageTitle from "../components/PageTitle";

const CreatePoultryCalendarPage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
    // Navigate back to dashboard or previous page
    navigate("/dashboard");
  };

  const handleBackgroundClick = () => {
    // Allow navigation back to dashboard by clicking background
    handleClose();
  };

  return (
    <>
      <PageTitle title="Create Poultry Calendar" />
      <div 
        className="min-h-screen bg-gray-100 flex items-center justify-center p-4"
        onClick={handleBackgroundClick}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <CreatePoultryCalendar 
            isOpen={isModalOpen} 
            onClose={handleClose} 
          />
        </div>
        
        {/* Background overlay effect */}
        <div className="fixed inset-0 bg-black bg-opacity-30 pointer-events-none"></div>
      </div>
    </>
  );
};

export default CreatePoultryCalendarPage;