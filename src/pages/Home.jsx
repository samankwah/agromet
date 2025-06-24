import { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
} from "react-leaflet";
import WeatherInteractiveMap from "../components/WeatherInteractiveMap";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import backgroundImage from "../assets/images/prisma.png";
import {
  FaCloudSun,
  FaThermometerHalf,
  FaCloudSunRain,
  FaArrowRight,
  FaExclamationTriangle,
} from "react-icons/fa";
import thermometer from "../assets/images/thermometer.svg";
import event1 from "../assets/images/event1.png";
import event2 from "../assets/images/event2.png";
import event3 from "../assets/images/event3.png";
import mofa from "../assets/icons/mofa.png";
import ecowas from "../assets/icons/ecowas.png";
import worldbank from "../assets/icons/worldbank.png";
import fsrp from "../assets/icons/fsrp.png";
import gmet from "../assets/icons/gmet.png";
import "../components/PopupStyles.css";
import cap from "../assets/icons/CAP.png";
import PropTypes from "prop-types";
import axios from "axios";
import {
  ChevronRight,
  Cloud,
  BarChart2,
  Wheat,
  Bird,
  Search,
} from "lucide-react";

const sliderSettings = {
  infinite: true,
  speed: 3000,
  slidesToShow: 4,
  arrows: false,
  autoplay: true,
  autoplaySpeed: 0,
  slidesToScroll: 1,
  responsive: [
    { breakpoint: 1200, settings: { slidesToShow: 4 } },
    { breakpoint: 992, settings: { slidesToShow: 3 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } },
    { breakpoint: 576, settings: { slidesToShow: 2 } },
  ],
};

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth });
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
};

// SeverityPolygon component with click handler
const SeverityPolygon = ({
  coordinates,
  severity,
  message,
  onPolygonClick,
}) => {
  const colorMap = {
    low: { fillColor: "green", color: "darkgreen" },
    medium: { fillColor: "yellow", color: "orange" },
    high: { fillColor: "red", color: "darkred" },
  };
  const { fillColor, color } = colorMap[severity] || {
    fillColor: "blue",
    color: "darkblue",
  };
  const handleClick = (event) => {
    const latlng = event.latlng;
    onPolygonClick(latlng, message, severity);
  };
  return (
    <Polygon
      positions={coordinates}
      pathOptions={{
        fillColor,
        color,
        weight: 2,
        opacity: 1,
        fillOpacity: 0.4,
      }}
      eventHandlers={{ click: handleClick }}
    />
  );
};

SeverityPolygon.propTypes = {
  coordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
    .isRequired,
  severity: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onPolygonClick: PropTypes.func.isRequired,
};

// Dynamic Popup component for polygons
const DynamicPopup = ({ popupData, setPopupData }) => {
  const map = useMap();
  useMemo(() => {
    if (popupData) {
      const { position, message, severity } = popupData;
      const popup = L.popup()
        .setLatLng(position)
        .setContent(
          `
          <div class="popup-content flex flex-col">
            <h2 class="location-title text-blue-900 capitalize">${severity} Rainfall Zone</h2>
            <hr class="border-blue-500" />
            <p class="text-blue-600 font-bold">${new Date().toLocaleDateString()}</p>
            <hr class="border-gray-300" />
            <div class="weather-details">
              <div class="weather-info flex items-center my-2">
                <i class="fas fa-cloud-sun text-gray-900 text-xl mr-2"></i>
                <p><strong>Forecast:</strong> ${message}</p>
              </div>
            </div>
          </div>
        `
        )
        .openOn(map);
      const closePopup = () => {
        map.closePopup(popup);
        setPopupData(null);
      };
      map.on("click", closePopup);
      return () => {
        map.off("click", closePopup);
        map.closePopup(popup);
      };
    }
  }, [popupData, map, setPopupData]);
  return null;
};

DynamicPopup.propTypes = {
  popupData: PropTypes.object,
  setPopupData: PropTypes.func.isRequired,
};

const WeatherIcon = ({ condition }) => {
  switch (condition) {
    case "Cloudy, Sunny Intervals":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 512"
          height="60"
          width="60"
        >
          <path
            fill="white"
            d="M640 258.3c0-51.6-40.2-93.5-89.6-93.5h-.5c-16.6-40.7-55.3-69.2-99.4-69.2-46.4 0-86.2 30.1-101.5 74.2-25.3 8.8-45.2 29.1-54.7 54.9-48.3 5-86.3 45.5-86.3 95.1 0 1.8.1 3.7.2 5.6-38 13.2-64.2 49.2-64.2 90.5 0 53 43.1 96.1 96 96.1h240c52.9 0 96-43.1 96-96.1 0-24.7-9.4-47.1-24.8-64.1 49-.5 88.8-42.2 88.8-93.5zM480 480H240c-35.3 0-64-28.7-64-64.1 0-31 22.2-57.5 52.8-62.9l16.5-2.9-3.6-16.3c-1.1-5-1.7-9.6-1.7-13.9 0-35.3 28.7-64.1 64-64.1 24.6 0 47.2 14.5 57.8 37l8.6 18.4 15.8-12.7c8.8-7 19.1-10.7 29.8-10.7 26.5 0 48 21.5 48 48v16h16c35.3 0 64 28.7 64 64.1S515.3 480 480 480zm70.4-160.2h-56.1c-7.5-36.5-39.7-64.1-78.3-64.1-12 0-23.7 2.7-34.4 7.9-13-18-32-30.8-53.2-36.5 9.6-17.3 26.7-29.1 46.7-30.1 5.6-39.3 37-69.4 75.3-69.4 40.3 0 72.9 33.3 75.9 75.5 7.4-3.7 15.3-6.3 24-6.3 31.8 0 57.6 27.5 57.6 61.5.1 34-25.7 61.5-57.5 61.5zm-384.9-7.7c-2.1-1-4.3-1.7-6.6-1.7-1 0-2.1.1-3.1.3l-63.2 12.5 12.5-63.2c1.2-6.3-1.4-12.8-6.8-16.5l-53.5-35.8 53.5-35.8c5.4-3.6 8-10.1 6.8-16.5L92.6 92.2l63.2 12.5c6.5 1.3 12.8-1.5 16.4-6.8L208 44.4 243.8 98c3.6 5.3 9.9 8.1 16.4 6.8l63.2-12.5-12.1 61.2c4.2-2.8 8.4-5.5 13-7.8 7.3-15.7 17.5-29.4 29.3-41.2l5.8-29.5c1-5.2-.6-10.6-4.4-14.4-3.8-3.8-9-5.5-14.4-4.4l-76.2 15.1-43.1-64.6c-6-8.9-20.6-8.9-26.6 0l-43.2 64.6-76.2-15.2c-5.3-1.1-10.6.7-14.4 4.4-3.8 3.8-5.4 9.2-4.4 14.4l15.1 76.3-64.5 43.2c-4.4 3-7.1 8-7.1 13.3C0 213 2.7 218 7.1 221l64.5 43.2-15.1 76.2c-1 5.3.6 10.7 4.4 14.4s9.2 5.4 14.4 4.4l56.3-11.1c8.8-14 20.3-26.3 33.9-36zM208 149.8c28.8 0 52.5 21.2 56.9 48.8 2.4-.8 4.8-1.8 7.3-2.4 5-9 11.2-17.1 18-24.5-13.9-31.7-45.5-53.9-82.2-53.9-49.5 0-89.8 40.3-89.8 89.9 0 39.5 25.7 72.7 61.1 84.8 2.3-10.6 5.9-20.6 10.6-30.1-23-7.6-39.8-29.1-39.8-54.7.1-31.9 26-57.9 57.9-57.9z"
          />
        </svg>
      );
    case "Rains, Sunny Intervals":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 512"
          height="60"
          width="60"
        >
          <path
            fill="white"
            d="M298.2 418.1c-7.6-4.3-17.4-1.8-21.8 6l-36.6 64c-4.4 7.7-1.7 17.4 6 21.8 2.5 1.4 5.2 2.1 7.9 2.1 5.5 0 10.9-2.9 13.9-8.1l36.6-64c4.4-7.7 1.7-17.4-6-21.8zM192 140c26.4 0 48 20 51.1 45.6 4.8-3.6 9.8-6.9 15.1-9.9 1.5-8.4 3.9-16.5 6.8-24.3-14.3-25.7-41.5-43.4-73-43.4-46.2 0-83.7 37.6-83.7 83.8s37.5 83.8 83.7 83.8c.3 0 .6-.1.9-.1 1.1-11.4 3.7-22.4 7.7-32.8-2.8.5-5.6.9-8.5.9-28.5 0-51.7-23.2-51.7-51.7-.1-28.6 23.1-51.9 51.6-51.9zm-31.7 151.7c-3.6-5.3-9.9-8.1-16.4-6.8l-56 11.1L99 240c1.2-6.4-1.4-12.8-6.8-16.4l-47.4-31.8L92.2 160c5.4-3.6 8-10.1 6.8-16.4l-11.1-56 56 11.1c6.5 1.3 12.8-1.4 16.4-6.8L192 44.4l31.8 47.5c3.6 5.3 10 8.1 16.4 6.8L319.6 83c8.7-1.7 14.3-10.1 12.6-18.8-1.7-8.7-10.3-14.5-18.8-12.6l-68.9 13.6-39.2-58.5c-5.9-8.9-20.6-8.9-26.6 0l-39.1 58.5-69-13.7c-5.3-1.1-10.7.6-14.4 4.4-3.8 3.8-5.4 9.2-4.4 14.4L90 187.2 7.1 242.7c-4.4 3-7.1 7.9-7.1 13.3 0 5.3 2.7 10.3 7.1 13.3l58.4 39.1-13.7 69c-1 5.3.6 10.7 4.4 14.5 3.8 3.8 9 5.5 14.4 4.4l68.9-13.7 39.1 58.5c3.1 4.6 8.2 7.1 13.3 7.1 3.1 0 6.2-.9 8.9-2.7 7.3-4.9 9.3-14.9 4.4-22.2l-44.9-67.4zm329.9 126.4c-7.6-4.3-17.4-1.8-21.8 6l-36.6 64c-4.4 7.7-1.7 17.4 6 21.8 2.5 1.4 5.2 2.1 7.9 2.1 5.5 0 10.9-2.9 13.9-8.1l36.6-64c4.4-7.7 1.7-17.4-6-21.8zm85.1-220.8C570 158.2 536.5 128 496 128c-8.6 0-17 1.4-25.2 4.3C451.1 109.4 422.6 96 392 96c-56.5 0-102.7 45.3-104 101.6-37.8 13.3-64 49.3-64 90.4 0 52.9 43.1 96 96 96h224c52.9 0 96-43.1 96-96 0-41.3-26.6-77.6-64.7-90.7zM560 208.8zM544 352H320c-35.3 0-64-28.7-64-64 0-30.6 21.8-57 52-62.8l14.5-2.8-2-18c-.2-1.5-.4-2.9-.4-4.4 0-39.7 32.3-72 72-72 24.3 0 46.8 12.2 60.2 32.8l8.1 12.4 13-7.1c32.7-17.8 70.7 8.2 70.8 40.4l-.2 16.2 12.8 2.6c29.8 6 51.3 32.3 51.3 62.7-.1 35.3-28.8 64-64.1 64zm42.2 66.1c-7.6-4.3-17.4-1.8-21.8 6l-36.6 64c-4.4 7.7-1.7 17.4 6 21.8 2.5 1.4 5.2 2.1 7.9 2.1 5.5 0 10.9-2.9 13.9-8.1l36.6-64c4.4-7.7 1.7-17.4-6-21.8zm-192 0c-7.6-4.3-17.4-1.8-21.8 6l-36.6 64c-4.4 7.7-1.7 17.4 6 21.8 2.5 1.4 5.2 2.1 7.9 2.1 5.5 0 10.9-2.9 13.9-8.1l36.6-64c4.4-7.7 1.7-17.4-6-21.8z"
          />
        </svg>
      );
    case "Sunny Intervals":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 512"
          height="60"
          width="60"
        >
          <path
            fill="white"
            d="M558.2 185.6C542.1 151.5 507.4 128 468 128c-41.7 0-77.6 25.2-92.5 62.5-32.5 11.4-55.5 42.1-55.5 78.3 0 45.9 37.3 83.2 83.2 83.2h153.6c45.9 0 83.2-37.3 83.2-83.2 0-45.4-36.6-82.4-81.8-83.2zM556.8 320H403.2c-28.3 0-51.2-22.9-51.2-51.2 0-27.5 21.8-49.8 49-51 4.9-32.7 32.9-57.8 67-57.8 35.8 0 64.8 27.8 67.5 62.9 6.5-3.1 13.6-5.3 21.3-5.3 28.3 0 51.2 22.9 51.2 51.2S585.1 320 556.8 320zm-153.6 64c-.7 0-1.4-.2-2.1-.2l4.3 21.6-84.8-16.8c-6.6-1.3-12.8 1.4-16.4 6.8L256 467.2l-48.1-71.9c-3.6-5.3-9.9-8.1-16.4-6.8l-84.8 16.8 16.8-84.8c1.2-6.3-1.4-12.8-6.8-16.4L44.8 256l71.9-48.1c5.4-3.6 8-10.1 6.8-16.4l-16.8-84.8 84.8 16.8c6.5 1.3 12.8-1.5 16.4-6.8L256 44.8l48.1 71.9c3.6 5.3 9.9 8.1 16.4 6.8L428.8 102c8.7-1.7 14.3-10.1 12.6-18.8-1.7-8.7-10.1-14.4-18.8-12.6L324.8 90 269.3 7.1c-3-4.4-8-7.1-13.3-7.1s-10.3 2.7-13.3 7.1L187.2 90 89.4 70.6c-5.3-1.1-10.6.6-14.4 4.4s-5.4 9.2-4.4 14.4L90 187.2 7.1 242.7c-4.4 3-7.1 7.9-7.1 13.3s2.7 10.3 7.1 13.3L90 324.8l-19.4 97.8c-1 5.2.6 10.7 4.4 14.4 3.8 3.8 9.1 5.4 14.4 4.4l97.8-19.4 55.5 82.9c3 4.4 8 7.1 13.3 7.1s10.3-2.7 13.3-7.1l55.4-82.9 97.8 19.4c5.4 1.1 10.7-.6 14.4-4.4 3.8-3.8 5.4-9.2 4.4-14.4l-7.6-38.6h-30.5zM256 179.7c21 0 40 8.5 53.8 22.3 6.2-8.7 13.6-16.4 22-23.1-19.5-19.2-46.3-31.1-75.8-31.1-59.7 0-108.3 48.6-108.3 108.3S196.3 364.3 256 364.3c22.8 0 44-7.2 61.5-19.3-7.1-8-13.1-16.9-17.8-26.6-12.4 8.7-27.4 13.9-43.7 13.9-42.1 0-76.3-34.2-76.3-76.3s34.2-76.3 76.3-76.3z"
          />
        </svg>
      );
    case "Sunny Intervals, Showers":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 512"
          height="60"
          width="60"
        >
          <path
            fill="white"
            d="M640 258.3c0-51.6-40.2-93.5-89.6-93.5h-.5c-16.6-40.7-55.3-69.2-99.4-69.2-46.4 0-86.2 30.1-101.5 74.2-25.3 8.8-45.2 29.1-54.7 54.9-48.3 5-86.3 45.5-86.3 95.1 0 1.8.1 3.7.2 5.6-38 13.2-64.2 49.2-64.2 90.5 0 53 43.1 96.1 96 96.1h240c52.9 0 96-43.1 96-96.1 0-24.7-9.4-47.1-24.8-64.1 49-.5 88.8-42.2 88.8-93.5zM480 480H240c-35.3 0-64-28.7-64-64.1 0-31 22.2-57.5 52.8-62.9l16.5-2.9-3.6-16.3c-1.1-5-1.7-9.6-1.7-13.9 0-35.3 28.7-64.1 64-64.1 24.6 0 47.2 14.5 57.8 37l8.6 18.4 15.8-12.7c8.8-7 19.1-10.7 29.8-10.7 26.5 0 48 21.5 48 48v16h16c35.3 0 64 28.7 64 64.1S515.3 480 480 480zm70.4-160.2h-56.1c-7.5-36.5-39.7-64.1-78.3-64.1-12 0-23.7 2.7-34.4 7.9-13-18-32-30.8-53.2-36.5 9.6-17.3 26.7-29.1 46.7-30.1 5.6-39.3 37-69.4 75.3-69.4 40.3 0 72.9 33.3 75.9 75.5 7.4-3.7 15.3-6.3 24-6.3 31.8 0 57.6 27.5 57.6 61.5.1 34-25.7 61.5-57.5 61.5zm-384.9-7.7c-2.1-1-4.3-1.7-6.6-1.7-1 0-2.1.1-3.1.3l-63.2 12.5 12.5-63.2c1.2-6.3-1.4-12.8-6.8-16.5l-53.5-35.8 53.5-35.8c5.4-3.6 8-10.1 6.8-16.5L92.6 92.2l63.2 12.5c6.5 1.3 12.8-1.5 16.4-6.8L208 44.4 243.8 98c3.6 5.3 9.9 8.1 16.4 6.8l63.2-12.5-12.1 61.2c4.2-2.8 8.4-5.5 13-7.8 7.3-15.7 17.5-29.4 29.3-41.2l5.8-29.5c1-5.2-.6-10.6-4.4-14.4-3.8-3.8-9-5.5-14.4-4.4l-76.2 15.1-43.1-64.6c-6-8.9-20.6-8.9-26.6 0l-43.2 64.6-76.2-15.2c-5.3-1.1-10.6.7-14.4 4.4-3.8 3.8-5.4 9.2-4.4 14.4l15.1 76.3-64.5 43.2c-4.4 3-7.1 8-7.1 13.3C0 213 2.7 218 7.1 221l64.5 43.2-15.1 76.2c-1 5.3.6 10.7 4.4 14.4s9.2 5.4 14.4 4.4l56.3-11.1c8.8-14 20.3-26.3 33.9-36zM208 149.8c28.8 0 52.5 21.2 56.9 48.8 2.4-.8 4.8-1.8 7.3-2.4 5-9 11.2-17.1 18-24.5-13.9-31.7-45.5-53.9-82.2-53.9-49.5 0-89.8 40.3-89.8 89.9 0 39.5 25.7 72.7 61.1 84.8 2.3-10.6 5.9-20.6 10.6-30.1-23-7.6-39.8-29.1-39.8-54.7.1-31.9 26-57.9 57.9-57.9z"
          />
        </svg>
      );
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 512"
          height="40"
          width="40"
        >
          <path
            fill="white"
            d="M558.2 185.6C542.1 151.5 507.4 128 468 128c-41.7 0-77.6 25.2-92.5 62.5-32.5 11.4-55.5 42.1-55.5 78.3 0 45.9 37.3 83.2 83.2 83.2h153.6c45.9 0 83.2-37.3 83.2-83.2 0-45.4-36.6-82.4-81.8-83.2zM556.8 320H403.2c-28.3 0-51.2-22.9-51.2-51.2 0-27.5 21.8-49.8 49-51 4.9-32.7 32.9-57.8 67-57.8 35.8 0 64.8 27.8 67.5 62.9 6.5-3.1 13.6-5.3 21.3-5.3 28.3 0 51.2 22.9 51.2 51.2S585.1 320 556.8 320zm-153.6 64c-.7 0-1.4-.2-2.1-.2l4.3 21.6-84.8-16.8c-6.6-1.3-12.8 1.4-16.4 6.8L256 467.2l-48.1-71.9c-3.6-5.3-9.9-8.1-16.4-6.8l-84.8 16.8 16.8-84.8c1.2-6.3-1.4-12.8-6.8-16.4L44.8 256l71.9-48.1c5.4-3.6 8-10.1 6.8-16.4l-16.8-84.8 84.8 16.8c6.5 1.3 12.8-1.5 16.4-6.8L256 44.8l48.1 71.9c3.6 5.3 9.9 8.1 16.4 6.8L428.8 102c8.7-1.7 14.3-10.1 12.6-18.8-1.7-8.7-10.1-14.4-18.8-12.6L324.8 90 269.3 7.1c-3-4.4-8-7.1-13.3-7.1s-10.3 2.7-13.3 7.1L187.2 90 89.4 70.6c-5.3-1.1-10.6.6-14.4 4.4s-5.4 9.2-4.4 14.4L90 187.2 7.1 242.7c-4.4 3-7.1 7.9-7.1 13.3s2.7 10.3 7.1 13.3L90 324.8l-19.4 97.8c-1 5.2.6 10.7 4.4 14.4 3.8 3.8 9.1 5.4 14.4 4.4l97.8-19.4 55.5 82.9c3 4.4 8 7.1 13.3 7.1s10.3-2.7 13.3-7.1l55.4-82.9 97.8 19.4c5.4 1.1 10.7-.6 14.4-4.4 3.8-3.8 5.4-9.2 4.4-14.4l-7.6-38.6h-30.5zM256 179.7c21 0 40 8.5 53.8 22.3 6.2-8.7 13.6-16.4 22-23.1-19.5-19.2-46.3-31.1-75.8-31.1-59.7 0-108.3 48.6-108.3 108.3S196.3 364.3 256 364.3c22.8 0 44-7.2 61.5-19.3-7.1-8-13.1-16.9-17.8-26.6-12.4 8.7-27.4 13.9-43.7 13.9-42.1 0-76.3-34.2-76.3-76.3s34.2-76.3 76.3-76.3z"
          />
        </svg>
      );
  }
};

WeatherIcon.propTypes = {
  condition: PropTypes.string.isRequired,
};

const getFormattedDate = () => {
  const options = { day: "2-digit", month: "long", year: "numeric" };
  return new Date().toLocaleDateString("en-US", options);
};

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [12, 21],
  iconAnchor: [8, 21],
  popupAnchor: [1, 54],
  shadowSize: [21, 21],
});

L.Marker.prototype.options.icon = DefaultIcon;

const WeatherCard = ({ city, condition, minTemp, maxTemp, type }) => (
  <div className="flex flex-col text-left justify-center text-white px-3 sm:px-6 border-r border-r-white">
    <div className="flex gap-3 sm:gap-4 items-center justify-between mb-1">
      <div className="flex-1 min-w-0">
        <h3 className="font-montserrat font-semibold text-sm sm:text-base truncate">
          {city}
        </h3>
        {/* <p className="text-xs text-blue-200 truncate">{type}</p> */}
      </div>
      <WeatherIcon
        className="text-right text-lg sm:text-xl flex-shrink-0"
        condition={condition}
      />
    </div>
    <p className="text-xs sm:text-sm font-montserrat mb-2 truncate">
      {condition}
    </p>
    <div className="flex items-center gap-2">
      <img
        className="mysvg flex-shrink-0"
        src={thermometer}
        alt="thermometer icon"
        height="20"
        width="20"
      />
      <p className="text-xs">
        Min: {minTemp}°C | Max: {maxTemp}°C
      </p>
    </div>
  </div>
);

WeatherCard.propTypes = {
  city: PropTypes.string.isRequired,
  condition: PropTypes.string.isRequired,
  minTemp: PropTypes.number.isRequired,
  maxTemp: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
};

const Home = () => {
  const [data, setData] = useState({});
  const [location, setLocation] = useState("");

  const [currentDateTime, setCurrentDateTime] = useState("");
  const [formattedTime, setFormattedTime] = useState("");
  const [setPopupData] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);

  const forecastCategories = [
    {
      title: "Weather Forecasts",
      icon: <Cloud className="text-blue-500" />,
      items: [
        { name: "Weekly Forecast", path: "/7-days-forecast" },
        {
          name: "Subseasonal 2 Seasonal Forecast",
          path: "/subseasonal-forecast",
        },
        { name: "Seasonal Forecast", path: "/seasonal-forecast" },
      ],
    },
    {
      title: "Environmental Monitoring",
      icon: <BarChart2 className="text-green-600" />,
      items: [{ name: "Flood and Drought Bulletins", path: "/flood-drought" }],
    },
    {
      title: "Agricultural Resources",
      icon: <Wheat className="text-amber-600" />,
      items: [
        { name: "Agrometeorological Bulletins", path: "/agro-bulletins" },
        { name: "Crop Calendar", path: "/crop-calendar" },
        { name: "Crop Advisories", path: "/crop-advisory" },
      ],
    },
    {
      title: "Livestock Management",
      icon: <Bird className="text-purple-600" />,
      items: [
        { name: "Poultry Calendar", path: "/poultry-calendar" },
        { name: "Poultry Advisories", path: "/poultry-advisory" },
      ],
    },
  ];

  const toggleCategory = (index) => {
    if (expandedCategory === index) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(index);
    }
  };

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=4a1a256c56d0d338ce9ef49b4f933ca4`;

  const searchLocation = (event) => {
    if (event.key === "Enter") {
      axios
        .get(url)
        .then((response) => {
          setData(response.data);
          console.log(response.data);
        })
        .catch((error) => {
          console.error("Error fetching weather data:", error);
          alert("Could not fetch weather data. Please try another location.");
        });
      setLocation("");
    }
  };

  // All 16 Regional Capitals and Major Municipal Capitals in Ghana
  const ghanaCities = [
    // Regional Capitals
    {
      name: "Accra",
      lat: 5.6037,
      lng: -0.187,
      type: "Regional Capital",
      region: "Greater Accra",
    },
    {
      name: "Bolgatanga",
      lat: 10.7856,
      lng: -0.8514,
      type: "Regional Capital",
      region: "Upper East",
    },
    {
      name: "Kumasi",
      lat: 6.6885,
      lng: -1.6244,
      type: "Regional Capital",
      region: "Ashanti",
    },
    {
      name: "Tarkwa",
      lat: 5.3004,
      lng: -1.9959,
      type: "Municipal Capital",
      region: "Western",
    },
    {
      name: "Tamale",
      lat: 9.4034,
      lng: -0.8424,
      type: "Regional Capital",
      region: "Northern",
    },
    {
      name: "Cape Coast",
      lat: 5.1054,
      lng: -1.2466,
      type: "Regional Capital",
      region: "Central",
    },
    {
      name: "Koforidua",
      lat: 6.0941,
      lng: -0.2631,
      type: "Regional Capital",
      region: "Eastern",
    },

    {
      name: "Ho",
      lat: 6.6009,
      lng: 0.4709,
      type: "Regional Capital",
      region: "Volta",
    },
    {
      name: "Obuasi",
      lat: 6.2028,
      lng: -1.6703,
      type: "Municipal Capital",
      region: "Ashanti",
    },
    {
      name: "Yendi",
      lat: 9.4427,
      lng: -0.0093,
      type: "Regional Capital",
      region: "North East",
    },
    {
      name: "Takoradi",
      lat: 4.8845,
      lng: -1.7554,
      type: "Regional Capital",
      region: "Western",
    },
    {
      name: "Sunyani",
      lat: 7.3378,
      lng: -2.3267,
      type: "Regional Capital",
      region: "Bono",
    },
    {
      name: "Elmina",
      lat: 5.0831,
      lng: -1.3488,
      type: "Municipal Capital",
      region: "Central",
    },
    {
      name: "Techiman",
      lat: 7.5931,
      lng: -1.9381,
      type: "Regional Capital",
      region: "Bono East",
    },
    {
      name: "Goaso",
      lat: 6.8009,
      lng: -2.5303,
      type: "Regional Capital",
      region: "Ahafo",
    },
    {
      name: "Sefwi Wiawso",
      lat: 6.2167,
      lng: -2.4833,
      type: "Regional Capital",
      region: "Western North",
    },

    {
      name: "Wa",
      lat: 10.06,
      lng: -2.5057,
      type: "Regional Capital",
      region: "Upper West",
    },
    {
      name: "Damongo",
      lat: 9.0842,
      lng: -1.815,
      type: "Regional Capital",
      region: "Savannah",
    },

    {
      name: "Dambai",
      lat: 8.0167,
      lng: 0.4333,
      type: "Regional Capital",
      region: "Oti",
    },

    {
      name: "Tema",
      lat: 5.6698,
      lng: -0.0166,
      type: "Municipal Capital",
      region: "Greater Accra",
    },
  ];

  const [weatherData, setWeatherData] = useState([]);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Ambee Weather API configuration
  const AMBEE_API_KEY =
    import.meta.env.VITE_AMBEE_API_KEY ||
    import.meta.env.VITE_BASE_AMBEE_API_KEY;
  const AMBEE_BASE_URL = "/api/ambee";

  // Fetch weather data for a specific city
  const fetchCityWeather = async (city) => {
    // Check if API key is available and not the placeholder
    if (!AMBEE_API_KEY || AMBEE_API_KEY === "your-ambee-api-key-here") {
      console.info(
        `Ambee API key not configured, using mock weather data for ${city.name}`
      );
      return getMockWeatherForCity(city);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `${AMBEE_BASE_URL}/weather/latest/by-lat-lng?lat=${city.lat}&lng=${city.lng}`,
        {
          headers: {
            "Content-type": "application/json",
            "x-api-key": AMBEE_API_KEY,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.data) {
        return formatWeatherDataForCity(city, data.data);
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      console.warn(
        `Ambee API unavailable for ${city.name}, using mock data:`,
        error.message
      );
      return getMockWeatherForCity(city);
    }
  };

  // Format weather data from Ambee API
  const formatWeatherDataForCity = (cityData, weatherData) => {
    // Convert Fahrenheit to Celsius
    const tempCelsius = Math.round(((weatherData.temperature - 32) * 5) / 9);

    // Get condition from summary
    const condition = getWeatherCondition(weatherData.summary);

    // Calculate min/max temps (simulate daily range)
    const minTemp = Math.max(tempCelsius - 3, 18);
    const maxTemp = tempCelsius + 4;

    return {
      city: cityData.name,
      condition: condition,
      minTemp: minTemp,
      maxTemp: maxTemp,
      type: cityData.type,
      region: cityData.region,
      summary: weatherData.summary || "No detailed forecast available",
      humidity: weatherData.humidity,
      windSpeed: Math.round(weatherData.windSpeed * 3.6), // Convert m/s to km/h
    };
  };

  // Get weather condition from summary
  const getWeatherCondition = (summary) => {
    const summaryLower = (summary || "").toLowerCase();
    if (summaryLower.includes("rain") || summaryLower.includes("shower"))
      return "Rains, Sunny Intervals";
    if (summaryLower.includes("cloud")) return "Cloudy, Sunny Intervals";
    if (summaryLower.includes("clear") || summaryLower.includes("sunny"))
      return "Sunny Intervals";
    if (summaryLower.includes("storm")) return "Rains, Sunny Intervals";
    if (summaryLower.includes("fog") || summaryLower.includes("mist"))
      return "Cloudy, Sunny Intervals";
    return "Sunny Intervals";
  };

  // Generate mock weather data for fallback
  const getMockWeatherForCity = (cityData) => {
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour < 6 || hour > 18;

    // Base temperature varies by latitude (northern cities are hotter)
    const baseTemp = cityData.lat > 9 ? 30 : cityData.lat > 7 ? 28 : 26;
    const tempVariation = isNight ? -3 : 2;
    const currentTemp = Math.round(
      baseTemp + tempVariation + Math.random() * 4
    );

    // Time-based weather conditions
    const timeBasedConditions = isNight
      ? ["Cloudy, Sunny Intervals", "Sunny Intervals"]
      : [
          "Sunny Intervals",
          "Cloudy, Sunny Intervals",
          "Rains, Sunny Intervals",
        ];

    const condition =
      timeBasedConditions[
        Math.floor(Math.random() * timeBasedConditions.length)
      ];

    return {
      city: cityData.name,
      condition: condition,
      minTemp: Math.max(currentTemp - 3, 18),
      maxTemp: currentTemp + 4,
      type: cityData.type,
      region: cityData.region,
      summary: `${condition} with typical West African weather`,
      humidity: Math.round(60 + Math.random() * 30),
      windSpeed: Math.round(5 + Math.random() * 20),
    };
  };

  const settings = {
    infinite: true,
    slidesToShow: 6,
    slidesToScroll: 2,
    autoplay: true,
    autoplaySpeed: 4000,
    speed: 500,
    pauseOnHover: true,
    responsive: [
      { breakpoint: 1400, settings: { slidesToShow: 5, slidesToScroll: 2 } },
      { breakpoint: 1200, settings: { slidesToShow: 4, slidesToScroll: 2 } },
      { breakpoint: 992, settings: { slidesToShow: 3, slidesToScroll: 1 } },
      { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 576, settings: { slidesToShow: 2, slidesToScroll: 2 } },
    ],
  };

  // Load weather data for all cities
  const loadAllCitiesWeather = async () => {
    setLoadingWeather(true);
    try {
      console.log("🌤️ Loading weather data for Ghana cities...");

      const weatherPromises = ghanaCities.map(async (city) => {
        try {
          const weatherData = await fetchCityWeather(city);
          console.log(`✅ Weather loaded for ${city.name}:`, weatherData);
          return weatherData;
        } catch (error) {
          console.warn(
            `⚠️ Failed to fetch weather for ${city.name}:`,
            error.message
          );
          return getMockWeatherForCity(city);
        }
      });

      const results = await Promise.allSettled(weatherPromises);
      const weatherDataArray = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      setWeatherData(weatherDataArray);
      console.log(
        `🌟 Successfully loaded weather for ${weatherDataArray.length} cities`
      );
    } catch (error) {
      console.error("❌ Error loading weather data:", error);
      // Fallback to mock data for all cities
      const fallbackData = ghanaCities.map((city) =>
        getMockWeatherForCity(city)
      );
      setWeatherData(fallbackData);
      console.log("🔄 Using fallback weather data for all cities");
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    loadAllCitiesWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run on mount


  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateOptions = { day: "2-digit", month: "short", year: "numeric" };
      const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
      setCurrentDateTime(now.toLocaleDateString("en-US", dateOptions));
      setFormattedTime(now.toLocaleTimeString("en-US", timeOptions));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handlePolygonClick = (latlng, message, severity) => {
    setPopupData({ position: latlng, message, severity });
  };

  return (
    <div
      className="min-h-screen bg-gray-950 mx-auto px-4 py-1 md:px-8 lg:px-12"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "1400px 1200px",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        WebkitBackgroundSize: "1200px 800px",
        MozBackgroundSize: "1200px 800px",
      }}
    >
      <main className="flex-grow mt-8 md:mt-16 container mx-auto">
        <div className="pt-8 md:pt-12 lg:pt-2">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white text-center my-8 md:my-10 lg:my-16">
            Agro-Climatic Information Services
          </h1>

          {data.name && (
            <div className="bg-white/20 backdrop-blur-[5px] rounded-xl p-4 mt-4 max-w-md mx-auto">
              <h3 className="text-white font-bold">Weather for {data.name}</h3>
              <p className="text-white">
                Condition: {data.weather && data.weather[0]?.description}
              </p>
              <p className="text-white">
                Temperature: {data.main && Math.round(data.main.temp - 273.15)}
                °C
              </p>
            </div>
          )}
          <div className="bg-[#218af300] rounded-lg shadow-lg p-4 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-lg md:text-xl">
                Weather for {getFormattedDate()}
              </h2>
              {loadingWeather && (
                <div className="flex items-center text-white text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading live weather...
                </div>
              )}
            </div>
            <div className="slider-container">
              {loadingWeather ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">
                      Fetching weather data for 20 major cities across Ghana...
                    </p>
                    <p className="text-xs text-blue-200 mt-1">
                      Including all regional & municipal capitals
                    </p>
                  </div>
                </div>
              ) : weatherData.length > 0 ? (
                <Slider {...settings}>
                  {weatherData.map((data, index) => (
                    <WeatherCard key={`${data.city}-${index}`} {...data} />
                  ))}
                </Slider>
              ) : (
                <div className="text-center text-white py-4">
                  <p className="text-sm">
                    Weather data for major Ghana cities unavailable.
                  </p>
                  <p className="text-xs text-blue-200 mt-1">
                    Please try again later.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="left-sidebar h-auto my:auto lg:col-span-0 bg-white/20 backdrop-blur-[5px] border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-xl mt-1 p-4">
              <h2 className="text-red-600 text-1xl font-bold mb-4 flex items-center">
                <img src={cap} alt="Alert" className="h-6 w-6 mr-2" />
                <i className="fas fa-bell mr-2"></i> Latest Weather Warnings
              </h2>
              <ul className="space-y-4">
                <li className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="text-red-500 mr-2" />
                    <p className="font-bold text-blue-700">
                      No active alerts currently
                    </p>
                  </div>
                  <FaArrowRight className="text-blue-500" />
                </li>
              </ul>
            </div>
            <div className="lg:col-span-2 bg-white/20 backdrop-blur-[5px] border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-xl p-4 sticky h-full">
              <h2 className="text-gray-50 font-bold mb-2 rounded-lg">
                <i className="fas fa-calendar-alt mr-2"></i>
                {`${currentDateTime} - ${formattedTime}`}
              </h2>
              <WeatherInteractiveMap
                onRegionSelect={(regionName, regionData) => {
                  console.log("Selected region:", regionName, regionData);
                }}
                onDistrictSelect={(district) => {
                  console.log("Selected district:", district);
                }}
                showWeatherData={true}
                showAgriculturalData={true}
              />
            </div>

            <div className="bg-white/20 backdrop-blur-[5px] border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-xl p-4 w-full h-full max-w-md">
              <h2 className="text-gray-100 font-bold text-xl md:text-xl mb-4 flex items-center">
                Weather & Climate Resources
              </h2>
              <div className="mb-4 relative max-w-md mx-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={searchLocation}
                  placeholder="Enter location (e.g., Accra)"
                  className="p-2 pl-10 rounded border border-gray-300 text-black w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-3">
                {forecastCategories.map((category, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow">
                    <button
                      onClick={() => toggleCategory(idx)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-blue-50 transition-colors rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          {category.icon}
                        </div>
                        <h3 className="font-medium text-gray-800">
                          {category.title}
                        </h3>
                      </div>
                      <ChevronRight
                        className={`text-blue-500 transition-transform duration-200 ${
                          expandedCategory === idx ? "transform rotate-90" : ""
                        }`}
                      />
                    </button>

                    {expandedCategory === idx && (
                      <div className="px-3 pb-3">
                        <ul className="space-y-2 ml-10">
                          {category.items.map((item, itemIdx) => (
                            <li key={itemIdx}>
                              <a
                                href={item.path}
                                className="block py-2 px-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-sm"
                              >
                                {item.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 bg-white/20 backdrop-blur-[5px] border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-xl p-6 mb-14">
            <h2 className="text-white text-3xl md:text-2xl font-bold mb-6">
              Latest News & Updates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-100 rounded-lg shadow-lg overflow-hidden">
                <img
                  src={event1}
                  alt="Weather Event 1"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-blue-600 font-semibold text-lg">
                    Heavy Rainfall Expected in Northern Regions
                  </h3>
                  <p className="text-gray-700 text-sm mt-2">
                    Authorities issue warnings as heavy rainfall is forecasted
                    for the northern regions of Ghana this week.
                  </p>
                  <Link
                    to="blog/son-forecast"
                    className="text-blue-500 font-semibold mt-4 inline-block hover:underline"
                  >
                    Read More <FaArrowRight className="inline ml-1" />
                  </Link>
                </div>
              </div>

              {/* News Article 2 */}
              <div className="bg-gray-100 rounded-lg shadow-lg overflow-hidden">
                <img
                  src={event2}
                  alt="Weather Event 2"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-blue-600 font-semibold text-lg">
                    Drought Relief Efforts in Savannah Region
                  </h3>
                  <p className="text-gray-700 text-sm mt-2">
                    Government and NGOs launch initiatives to support farmers
                    affected by prolonged drought in the Savannah Region.
                  </p>
                  <Link
                    to="/events/crop-calen"
                    className="text-blue-500 font-semibold mt-4 inline-block hover:underline"
                  >
                    Read More <FaArrowRight className="inline ml-1" />
                  </Link>
                </div>
              </div>

              {/* News Article 3 */}
              <div className="bg-gray-100 rounded-lg shadow-lg overflow-hidden">
                <img
                  src={event3}
                  alt="Weather Event 3"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-blue-600 font-semibold text-lg">
                    New Agro-Meteorological Tools Launched
                  </h3>
                  <p className="text-gray-700 text-sm mt-2">
                    GHAAP introduces advanced tools to provide farmers with
                    precise weather and climate data.
                  </p>
                  <Link
                    to="events/clim-rep-rel"
                    className="text-blue-500 font-semibold mt-4 inline-block hover:underline"
                  >
                    Read More <FaArrowRight className="inline ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Partners Carousel */}
          <section className="mt-16 px-4">
            <div className="container mx-auto mb-10">
              <h2 className="text-3xl font-bold text-center mb-6 text-gray-100">
                Our Partners
              </h2>

              <div className="rounded-lg p-6 shadow-sm">
                <Slider {...sliderSettings}>
                  {[fsrp, mofa, gmet, worldbank, ecowas].map(
                    (partner, index) => (
                      <div key={index} className="p-3">
                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                          <img
                            src={partner}
                            alt={`Partner ${index + 1}`}
                            className="mx-auto h-16 object-contain"
                          />
                        </div>
                      </div>
                    )
                  )}
                </Slider>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;
