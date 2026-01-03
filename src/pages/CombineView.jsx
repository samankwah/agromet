import { useState } from "react";
import MediaPage from "../pages/MediaPage";
import CropCalendar from "../pages/CropCalendar";
import PageTitle from "../components/PageTitle";

const CombinedView = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarProps, setCalendarProps] = useState({
    crop: "all",
    region: "All Regions",
    district: "All Districts",
    yearSeason: "2025 Major Season",
  });

  const handleMediaPageClick = (crop, region, district, yearSeason) => {
    setCalendarProps({ crop, region, district, yearSeason });
    setShowCalendar(true);
  };

  return (
    <>
      <PageTitle title="Media & Calendar" />
      <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row">
        {/* MediaPage Section */}
        <div
          className={`${
            showCalendar ? "lg:w-1/2" : "w-full"
          } p-4 overflow-x-auto`}
        >
          <MediaPage onActivityClick={handleMediaPageClick} />
        </div>

        {/* CropCalendar Section (shown on click) */}
        {showCalendar && (
          <div className="lg:w-1/2 p-4 overflow-x-auto">
            <CropCalendar
              initialCrop={calendarProps.crop}
              initialRegion={calendarProps.region}
              initialDistrict={calendarProps.district}
              initialYearSeason={calendarProps.yearSeason}
            />
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default CombinedView;
