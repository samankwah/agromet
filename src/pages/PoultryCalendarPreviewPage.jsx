import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CalendarFullPageView from '../components/common/CalendarFullPageView';
import calendarPreviewParser from '../utils/calendarPreviewParser';

const PoultryCalendarPreviewPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        // Get data from URL params or localStorage
        const storedData = localStorage.getItem('poultryCalendarPreviewData');
        const fileData = searchParams.get('data');
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setCalendarData(parsedData);
        } else if (fileData) {
          // Handle base64 encoded file data
          const decodedData = JSON.parse(atob(fileData));
          setCalendarData(decodedData);
        } else {
          setError('No poultry calendar data available');
        }
      } catch (err) {
        setError('Failed to load poultry calendar data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
  }, [searchParams]);

  const handleBack = () => {
    // Clear only the preview data, preserve form data for restoration
    localStorage.removeItem('poultryCalendarPreviewData');
    
    // Navigate back to dashboard with a parameter to ensure modal opens
    // The form data will be restored by the PoultryCalendarForm component
    navigate('/dashboard?openModal=poultry-calendar');
  };

  return (
    <CalendarFullPageView 
      calendarData={calendarData}
      loading={loading}
      error={error}
      onBack={handleBack}
    />
  );
};

export default PoultryCalendarPreviewPage;