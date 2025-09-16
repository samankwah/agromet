// import { createBrowserRouter } from "react-router-dom";

// import DashboardPage from "./pages/DashboardPage";
// import Home from "./pages/Home";
// import Forecast from "./pages/Forecast";

// import About from "./pages/About";
// import CropCalendar from "./pages/CropCalendar";
// import Weather from "./pages/Weather";
// import NewsUpdates from "./pages/NewsUpdates";
// import SeasonalForecast from "./pages/SeasonalForecast";

// import SevenDaysForecast from "./pages/SevenDaysForecast";
// import AgroBulletins from "./pages/AgroBulletins";
// import FloodDrought from "./pages/FloodDrought";
// import SubseasonalForecast from "./pages/SubseasonalForecast";

// import PoultryCalendar from "./pages/PoultryCalendar";
// import BlogGmetVisit from "./blog/BlogGmetVisit";
// import BlogNationalAssemblyVisit from "./blog/BlogNationalAssemblyVisit";
// import BlogSonForecast from "./blog/BlogSonForecast";
// import PoultryAdvisory from "./pages/PoultryAdvisory";
// import CropAdvisory from "./pages/CropAdvisory";
// import NotFound from "./components/NotFound";

// import OurServices from "./pages/OurServices";
// import Contact from "./pages/Contact";
// import Careers from "./pages/Careers";
// import PrivacyPolicy from "./pages/PrivacyPolicy";
// import TermsOfService from "./pages/TermsOfService";
// import ProductDetail from "./components/ProductDetail";
// import MarketPage from "./components/MarketPage";
// import YellowMaizeImage from "./assets/images/yellow maize.png";
// import WhiteMaizeImage from "./assets/images/white maize.png";
// import YellowSoyaImage from "./assets/images/yellow soya.png";
// import Yam from "./assets/images/yam.png";
// import Tomato from "./assets/images/tomatoes.png";
// import Rice from "./assets/images/rice.png";
// import Pepper from "./assets/images/pepper.png";
// import Pepper2 from "./assets/images/pepper2.png";
// import Pepper3 from "./assets/images/pepper3.png";
// import Onion from "./assets/images/onion.png";
// import Onion2 from "./assets/images/onion2.png";
// import Onion3 from "./assets/images/onion3.png";
// import LiveChicken from "./assets/images/live chicken.png";
// import DressedChicken from "./assets/images/dressed chicken.png";
// import Beans from "./assets/images/beans.png";
// import Plantain from "./assets/images/plantain.png";
// import Cassava from "./assets/images/cassava.png";
// import Sorghum from "./assets/images/sorghum.png";
// import Modal from "./components/Modal";
// import AgrometAdvisory from "./pages/AgroMetAdvisory ";
// import { RouterProvider } from "react-router-dom";
// import RootLayout from "./layouts/RootLayout";
// import AdminLayout from "./layouts/AdminLayout.jsx";
// import AdminLogin from "./pages/AdminLogin.jsx";
// import CreateCropCalendar from "./components/Dashboard/CreateCalendar.jsx";
// import MediaPage from "./pages/MediaPage.jsx";
// import AdminSignUp from "./pages/AdminSignUp.jsx";
// import CropDiagnosticTool from "./components/CropDiagnosticTool.jsx";

// const products = [
//   {
//     id: 1,
//     name: "Yellow Maize",
//     price: 299.99,
//     stock: 10,
//     image: YellowMaizeImage,
//     description:
//       "Premium quality yellow maize, sourced from organic farms. Yellow maize is rich in dietary fiber and essential vitamins, making it ideal for human consumption as well as livestock feed. It's perfect for making cornmeal, popcorn, and even as a base for various corn-based dishes. This versatile grain is a staple in many households and provides a healthy, gluten-free option for meals.",
//     reviewsCount: 3,
//   },
//   {
//     id: 2,
//     name: "White Maize",
//     price: 289.99,
//     stock: 100,
//     image: WhiteMaizeImage,
//     description:
//       "High-grade white maize that is perfect for making white cornmeal, grits, tortillas, and a variety of other dishes. White maize is also an excellent source of nutrients such as carbohydrates, fiber, and protein, making it a popular food source in many regions. Grown under ideal conditions, this white maize is suitable for both human consumption and livestock feed.",
//     reviewsCount: 5,
//   },
//   {
//     id: 3,
//     name: "Yellow Soybeans",
//     price: 399.99,
//     stock: 100,
//     image: YellowSoyaImage,
//     description:
//       "Fresh yellow soybeans, ideal for processing into a variety of soy-based products like tofu, soy milk, and soy protein. These soybeans are rich in protein and healthy fats, making them an excellent addition to vegetarian and vegan diets. They are also widely used in animal feed and biodiesel production. Perfect for both commercial and domestic use.",
//     reviewsCount: 5,
//   },
//   {
//     id: 4,
//     name: "Yam",
//     image: Yam,
//     price: 389.99,
//     stock: 200,
//     description:
//       "Premium Puna yam, known for its rich, starchy texture and delicious taste. This yam variety is widely enjoyed in African, Caribbean, and South American cuisines. It can be boiled, pounded, fried, or roasted to create flavorful meals. It's a great source of energy and nutrients such as fiber, potassium, and vitamin C, making it a healthy choice for meal preparation.",
//     reviewsCount: 5,
//   },
//   {
//     id: 5,
//     name: "Tomato",
//     image: Tomato,
//     price: 149.99,
//     stock: 80,
//     description:
//       "Fresh, farm-grown tomatoes known for their juicy and tangy flavor. These tomatoes are perfect for making sauces, salads, stews, and more. Rich in lycopene, antioxidants, and vitamins, they offer a wide range of health benefits, including promoting heart health and reducing the risk of certain cancers. Perfect for daily cooking and food preparation.",
//     reviewsCount: 4,
//   },
//   {
//     id: 6,
//     name: "Rice",
//     image: Rice,
//     price: 159.99,
//     stock: 50,
//     description:
//       "Premium Jasmine rice, known for its long grains and fragrant aroma. Jasmine rice is soft, fluffy, and slightly sticky when cooked, making it ideal for dishes like fried rice, pilaf, and stir-fries. It’s also commonly served with curries and grilled meats. This rice variety is a favorite for its pleasant aroma and delicate flavor.",
//     reviewsCount: 4,
//   },
//   {
//     id: 7,
//     name: "Pepper (Black Cobra)",
//     image: Pepper,
//     price: 59.99,
//     stock: 40,
//     description:
//       "Spicy and flavorful Black Cobra pepper, known for its heat and pungent taste. This pepper variety is perfect for spicing up dishes like soups, stews, sauces, and marinades. It can be used fresh or dried, and its bold flavor enhances both local and international cuisines. A must-have for heat lovers in the kitchen.",
//     reviewsCount: 4,
//   },
//   {
//     id: 8,
//     name: "Pepper (Anaheim)",
//     image: Pepper2,
//     price: 59.99,
//     stock: 10,
//     description:
//       "Mild and sweet Anaheim pepper, great for grilling, roasting, or adding to salsas and salads. Its mild heat makes it a popular choice for people who prefer a little spice without the intense burn. Anaheim peppers can also be stuffed or sautéed for various recipes. They're packed with vitamins A and C, adding a nutritional boost to your meals.",
//     reviewsCount: 4,
//   },
//   {
//     id: 9,
//     name: "Pepper (Aleppo)",
//     image: Pepper3,
//     price: 59.99,
//     stock: 10,
//     description:
//       "Aleppo pepper, a mildly spicy and fruity pepper that's popular in Middle Eastern and Mediterranean cuisine. Its complex flavor profile, with a balance of heat and sweetness, makes it perfect for seasoning meats, vegetables, and sauces. This pepper is often used as a finishing spice or mixed into rubs for grilling and roasting.",
//     reviewsCount: 4,
//   },
//   {
//     id: 10,
//     name: "Onion (Purple/Red)",
//     image: Onion,
//     price: 109.99,
//     stock: 30,
//     description:
//       "Fresh purple/red onions known for their mild and slightly sweet flavor. These onions are perfect for raw use in salads, sandwiches, and burgers, but can also be cooked in stews, soups, and stir-fries. Rich in antioxidants and vitamins, red onions provide both flavor and health benefits. They add color and zest to any dish.",
//     reviewsCount: 4,
//   },
//   {
//     id: 11,
//     name: "Onion (White)",
//     image: Onion2,
//     price: 119.99,
//     stock: 10,
//     description:
//       "Crisp and slightly tangy white onions, great for adding sharpness to your dishes. These onions are ideal for salsas, guacamole, pickling, and other dishes where a strong onion flavor is needed. White onions are also popular in Mexican cuisine and are perfect for grilling or caramelizing to enhance their natural sweetness.",
//     reviewsCount: 4,
//   },
//   {
//     id: 12,
//     name: "Onion (Yellow)",
//     image: Onion3,
//     price: 110.99,
//     stock: 0,
//     description:
//       "Yellow onions with a balance of sweet and pungent flavors, perfect for a variety of dishes. These onions are commonly used in soups, stews, roasts, and sautés. Yellow onions are known for their versatility and are a kitchen staple. They also caramelize beautifully, adding a rich, deep flavor to many dishe",
//     reviewsCount: 3,
//   },
//   {
//     id: 13,
//     name: "Poultry - Broiler Chicken (Dressed)",
//     image: DressedChicken,
//     price: 150.99,
//     stock: 10,
//     description:
//       "Dressed broiler chicken meat, ready for cooking. This chicken has been processed and cleaned, making it ideal for roasting, grilling, frying, or stewing. Packed with high-quality protein, it is a staple in many households. It is perfect for family meals, gatherings, or any occasion where premium chicken is needed.",
//     reviewsCount: 4,
//   },
//   {
//     id: 14,
//     name: "Poultry - Broiler Chicken (Live)",
//     image: LiveChicken,
//     price: 150.99,
//     stock: 10,
//     description:
//       "Fresh, live broiler chicken for those who prefer to handle the butchering process themselves. These chickens are raised in healthy conditions and are ready for slaughter. Live chickens provide the freshest meat possible and are often chosen for special occasions or traditional meals.",
//     reviewsCount: 4,
//   },
//   {
//     id: 15,
//     name: "Beans",
//     image: Beans,
//     price: 399.99,
//     stock: 10,
//     description:
//       "Premium quality beans, rich in fiber, protein, and essential minerals. These beans are perfect for making a wide range of dishes such as soups, stews, and salads. They're a staple in many cuisines worldwide and are a healthy addition to vegetarian and non-vegetarian diets alike.",
//     reviewsCount: 4,
//   },
//   {
//     id: 16,
//     name: "Plantain",
//     image: Plantain,
//     price: 199.99,
//     stock: 125,
//     description:
//       "Fresh Apem plantain, a versatile and nutritious fruit. Apem plantains are starchy and slightly sweet when ripe, making them perfect for frying, boiling, baking, or roasting. They are a rich source of potassium, fiber, and vitamins, and are a staple in many West African and Caribbean dishes.",
//     reviewsCount: 5,
//   },
//   {
//     id: 17,
//     name: "Cassava",
//     image: Cassava,
//     price: 299.99,
//     stock: 10,
//     description:
//       "Fresh Esi Abaaya cassava, a root vegetable known for its high starch content. Cassava is a staple in many tropical regions and is used to make dishes such as fufu, gari, and tapioca. It can be boiled, fried, or processed into flour. Cassava is gluten-free and provides a great source of carbohydrates.",
//     reviewsCount: 4,
//   },
//   {
//     id: 18,
//     name: "Sorghum",
//     image: Sorghum,
//     price: 399.99,
//     stock: 100,
//     description:
//       "Premium Kapala sorghum, a versatile grain used in making porridge, flatbreads, and even beer. Sorghum is gluten-free and rich in antioxidants, fiber, and protein. It is a great alternative to wheat and rice, making it suitable for those with gluten sensitivities. It's commonly used in both food and beverage production across various cultures.",
//     reviewsCount: 5,
//   },
// ];

// function App() {
//   const router = createBrowserRouter([
//     {
//       path: "/",
//       element: <RootLayout />,
//       children: [
//         { index: true, element: <Home /> },
//         { path: "forecast", element: <Forecast /> },
//         { path: "about", element: <About /> },
//         { path: "weather", element: <Weather /> },
//         { path: "crop-calendar", element: <CropCalendar /> },
//         { path: "news", element: <NewsUpdates /> },
//         { path: "7-days-forecast", element: <SevenDaysForecast /> },
//         { path: "agro-bulletins", element: <AgroBulletins /> },
//         { path: "flood-drought", element: <FloodDrought /> },
//         { path: "subseasonal-forecast", element: <SubseasonalForecast /> },

//         { path: "poultry-calendar", element: <PoultryCalendar /> },
//         { path: "seasonal-forecast", element: <SeasonalForecast /> },
//         { path: "blog/gmet-visit", element: <BlogGmetVisit /> },
//         {
//           path: "blog/national-assembly-visit",
//           element: <BlogNationalAssemblyVisit />,
//         },
//         { path: "blog/son-forecast", element: <BlogSonForecast /> },

//         { path: "poultry-advisory", element: <PoultryAdvisory /> },
//         { path: "crop-advisory", element: <CropAdvisory /> },
//         { path: "services", element: <OurServices /> },
//         { path: "contact", element: <Contact /> },
//         { path: "careers", element: <Careers /> },
//         { path: "privacy", element: <PrivacyPolicy /> },
//         { path: "terms", element: <TermsOfService /> },
//         { path: "market-page", element: <MarketPage /> },
//         // Modal route removed - Modal should only be used as a component with proper props
//         { path: "crop-diagnose", element: <CropDiagnosticTool /> },
//         { path: "product/:id", element: <ProductDetail products={products} /> },

//         { path: "agro-advisory", element: <AgrometAdvisory /> },
//         { path: "media-page", element: <MediaPage /> },
//         { path: "admin-login", element: <AdminLogin /> },
//         { path: "admin-signup", element: <AdminSignUp /> },
//         { path: "*", element: <NotFound /> },
//       ],
//     },
//     {
//       path: "/dashboard",
//       element: <AdminLayout />,
//       children: [{ index: true, element: <DashboardPage /> }],
//     },
//     { path: "/production/provisional", element: <CreateCropCalendar /> },

//     { path: "/production/2024-minor", element: <CreateCropCalendar /> },
//     { path: "/production/2025-major", element: <CreateCropCalendar /> },
//   ]);

//   return <RouterProvider router={router} />;
// }

// export default App;

import { createBrowserRouter } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import Home from "./pages/Home";
import Forecast from "./pages/Forecast";

import About from "./pages/About";
import CropCalendar from "./pages/CropCalendar";
import Weather from "./pages/Weather";
import NewsUpdates from "./pages/NewsUpdates";
import SeasonalForecast from "./pages/SeasonalForecast";

import SevenDaysForecast from "./pages/SevenDaysForecast";
import AgroBulletins from "./pages/AgroBulletins";
import FloodDrought from "./pages/FloodDrought";
import SubseasonalForecast from "./pages/SubseasonalForecast";

import PoultryCalendar from "./pages/PoultryCalendar";
import BlogGmetVisit from "./blog/BlogGmetVisit";
import BlogNationalAssemblyVisit from "./blog/BlogNationalAssemblyVisit";
import BlogSonForecast from "./blog/BlogSonForecast";
import PoultryAdvisory from "./pages/PoultryAdvisory";
import CropAdvisory from "./pages/CropAdvisory";
import CalendarPreviewPage from "./pages/CalendarPreviewPage";
import PoultryCalendarPreviewPage from "./pages/PoultryCalendarPreviewPage";
import NotFound from "./components/NotFound";

import OurServices from "./pages/OurServices";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ProductDetail from "./components/ProductDetail";
import MarketPage from "./components/MarketPage";
import YellowMaizeImage from "./assets/images/yellow maize.png";
import WhiteMaizeImage from "./assets/images/white maize.png";
import YellowSoyaImage from "./assets/images/yellow soya.png";
import Yam from "./assets/images/yam.png";
import Tomato from "./assets/images/tomatoes.png";
import Rice from "./assets/images/rice.png";
import Pepper from "./assets/images/pepper.png";
import Pepper2 from "./assets/images/pepper2.png";
import Pepper3 from "./assets/images/pepper3.png";
import Onion from "./assets/images/onion.png";
import Onion2 from "./assets/images/onion2.png";
import Onion3 from "./assets/images/onion3.png";
import LiveChicken from "./assets/images/live chicken.png";
import DressedChicken from "./assets/images/dressed chicken.png";
import Beans from "./assets/images/beans.png";
import Plantain from "./assets/images/plantain.png";
import Cassava from "./assets/images/cassava.png";
import Sorghum from "./assets/images/sorghum.png";
import AgrometAdvisory from "./pages/AgroMetAdvisory ";
import { RouterProvider } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import CreateCropCalendar from "./components/Dashboard/CreateCalendar.jsx";
import CreatePoultryCalendarPage from "./pages/CreatePoultryCalendarPage.jsx";
import MediaPage from "./pages/MediaPage.jsx";
import AdminSignUp from "./pages/AdminSignUp.jsx";
import CropDiagnosticTool from "./components/CropDiagnosticTool.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const products = [
  {
    id: 1,
    name: "Yellow Maize",
    price: 299.99,
    stock: 10,
    image: YellowMaizeImage,
    description:
      "Premium quality yellow maize, sourced from organic farms. Yellow maize is rich in dietary fiber and essential vitamins, making it ideal for human consumption as well as livestock feed. It's perfect for making cornmeal, popcorn, and even as a base for various corn-based dishes. This versatile grain is a staple in many households and provides a healthy, gluten-free option for meals.",
    reviewsCount: 3,
  },
  {
    id: 2,
    name: "White Maize",
    price: 289.99,
    stock: 100,
    image: WhiteMaizeImage,
    description:
      "High-grade white maize that is perfect for making white cornmeal, grits, tortillas, and a variety of other dishes. White maize is also an excellent source of nutrients such as carbohydrates, fiber, and protein, making it a popular food source in many regions. Grown under ideal conditions, this white maize is suitable for both human consumption and livestock feed.",
    reviewsCount: 5,
  },
  {
    id: 3,
    name: "Yellow Soybeans",
    price: 399.99,
    stock: 100,
    image: YellowSoyaImage,
    description:
      "Fresh yellow soybeans, ideal for processing into a variety of soy-based products like tofu, soy milk, and soy protein. These soybeans are rich in protein and healthy fats, making them an excellent addition to vegetarian and vegan diets. They are also widely used in animal feed and biodiesel production. Perfect for both commercial and domestic use.",
    reviewsCount: 5,
  },
  {
    id: 4,
    name: "Yam",
    image: Yam,
    price: 389.99,
    stock: 200,
    description:
      "Premium Puna yam, known for its rich, starchy texture and delicious taste. This yam variety is widely enjoyed in African, Caribbean, and South American cuisines. It can be boiled, pounded, fried, or roasted to create flavorful meals. It's a great source of energy and nutrients such as fiber, potassium, and vitamin C, making it a healthy choice for meal preparation.",
    reviewsCount: 5,
  },
  {
    id: 5,
    name: "Tomato",
    image: Tomato,
    price: 149.99,
    stock: 80,
    description:
      "Fresh, farm-grown tomatoes known for their juicy and tangy flavor. These tomatoes are perfect for making sauces, salads, stews, and more. Rich in lycopene, antioxidants, and vitamins, they offer a wide range of health benefits, including promoting heart health and reducing the risk of certain cancers. Perfect for daily cooking and food preparation.",
    reviewsCount: 4,
  },
  {
    id: 6,
    name: "Rice",
    image: Rice,
    price: 159.99,
    stock: 50,
    description:
      "Premium Jasmine rice, known for its long grains and fragrant aroma. Jasmine rice is soft, fluffy, and slightly sticky when cooked, making it ideal for dishes like fried rice, pilaf, and stir-fries. It’s also commonly served with curries and grilled meats. This rice variety is a favorite for its pleasant aroma and delicate flavor.",
    reviewsCount: 4,
  },
  {
    id: 7,
    name: "Pepper (Black Cobra)",
    image: Pepper,
    price: 59.99,
    stock: 40,
    description:
      "Spicy and flavorful Black Cobra pepper, known for its heat and pungent taste. This pepper variety is perfect for spicing up dishes like soups, stews, sauces, and marinades. It can be used fresh or dried, and its bold flavor enhances both local and international cuisines. A must-have for heat lovers in the kitchen.",
    reviewsCount: 4,
  },
  {
    id: 8,
    name: "Pepper (Anaheim)",
    image: Pepper2,
    price: 59.99,
    stock: 10,
    description:
      "Mild and sweet Anaheim pepper, great for grilling, roasting, or adding to salsas and salads. Its mild heat makes it a popular choice for people who prefer a little spice without the intense burn. Anaheim peppers can also be stuffed or sautéed for various recipes. They're packed with vitamins A and C, adding a nutritional boost to your meals.",
    reviewsCount: 4,
  },
  {
    id: 9,
    name: "Pepper (Aleppo)",
    image: Pepper3,
    price: 59.99,
    stock: 10,
    description:
      "Aleppo pepper, a mildly spicy and fruity pepper that's popular in Middle Eastern and Mediterranean cuisine. Its complex flavor profile, with a balance of heat and sweetness, makes it perfect for seasoning meats, vegetables, and sauces. This pepper is often used as a finishing spice or mixed into rubs for grilling and roasting.",
    reviewsCount: 4,
  },
  {
    id: 10,
    name: "Onion (Purple/Red)",
    image: Onion,
    price: 109.99,
    stock: 30,
    description:
      "Fresh purple/red onions known for their mild and slightly sweet flavor. These onions are perfect for raw use in salads, sandwiches, and burgers, but can also be cooked in stews, soups, and stir-fries. Rich in antioxidants and vitamins, red onions provide both flavor and health benefits. They add color and zest to any dish.",
    reviewsCount: 4,
  },
  {
    id: 11,
    name: "Onion (White)",
    image: Onion2,
    price: 119.99,
    stock: 10,
    description:
      "Crisp and slightly tangy white onions, great for adding sharpness to your dishes. These onions are ideal for salsas, guacamole, pickling, and other dishes where a strong onion flavor is needed. White onions are also popular in Mexican cuisine and are perfect for grilling or caramelizing to enhance their natural sweetness.",
    reviewsCount: 4,
  },
  {
    id: 12,
    name: "Onion (Yellow)",
    image: Onion3,
    price: 110.99,
    stock: 0,
    description:
      "Yellow onions with a balance of sweet and pungent flavors, perfect for a variety of dishes. These onions are commonly used in soups, stews, roasts, and sautés. Yellow onions are known for their versatility and are a kitchen staple. They also caramelize beautifully, adding a rich, deep flavor to many dishe",
    reviewsCount: 3,
  },
  {
    id: 13,
    name: "Poultry - Broiler Chicken (Dressed)",
    image: DressedChicken,
    price: 150.99,
    stock: 10,
    description:
      "Dressed broiler chicken meat, ready for cooking. This chicken has been processed and cleaned, making it ideal for roasting, grilling, frying, or stewing. Packed with high-quality protein, it is a staple in many households. It is perfect for family meals, gatherings, or any occasion where premium chicken is needed.",
    reviewsCount: 4,
  },
  {
    id: 14,
    name: "Poultry - Broiler Chicken (Live)",
    image: LiveChicken,
    price: 150.99,
    stock: 10,
    description:
      "Fresh, live broiler chicken for those who prefer to handle the butchering process themselves. These chickens are raised in healthy conditions and are ready for slaughter. Live chickens provide the freshest meat possible and are often chosen for special occasions or traditional meals.",
    reviewsCount: 4,
  },
  {
    id: 15,
    name: "Beans",
    image: Beans,
    price: 399.99,
    stock: 10,
    description:
      "Premium quality beans, rich in fiber, protein, and essential minerals. These beans are perfect for making a wide range of dishes such as soups, stews, and salads. They're a staple in many cuisines worldwide and are a healthy addition to vegetarian and non-vegetarian diets alike.",
    reviewsCount: 4,
  },
  {
    id: 16,
    name: "Plantain",
    image: Plantain,
    price: 189.99,
    stock: 125,
    description:
      "Fresh Apem plantain, a versatile and nutritious fruit. Apem plantains are starchy and slightly sweet when ripe, making them perfect for frying, boiling, baking, or roasting. They are a rich source of potassium, fiber, and vitamins, and are a staple in many West African and Caribbean dishes.",
    reviewsCount: 5,
  },
  {
    id: 17,
    name: "Cassava",
    image: Cassava,
    price: 299.99,
    stock: 10,
    description:
      "Fresh Esi Abaaya cassava, a root vegetable known for its high starch content. Cassava is a staple in many tropical regions and is used to make dishes such as fufu, gari, and tapioca. It can be boiled, fried, or processed into flour. Cassava is gluten-free and provides a great source of carbohydrates.",
    reviewsCount: 4,
  },
  {
    id: 18,
    name: "Sorghum",
    image: Sorghum,
    price: 399.99,
    stock: 100,
    description:
      "Premium Kapala sorghum, a versatile grain used in making porridge, flatbreads, and even beer. Sorghum is gluten-free and rich in antioxidants, fiber, and protein. It is a great alternative to wheat and rice, making it suitable for those with gluten sensitivities. It's commonly used in both food and beverage production across various cultures.",
    reviewsCount: 5,
  },
];

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: "forecast", element: <Forecast /> },
        { path: "about", element: <About /> },
        { path: "weather", element: <Weather /> },
        { path: "crop-calendar", element: <CropCalendar /> },
        { path: "calendar-preview", element: <CalendarPreviewPage /> },
        { path: "news", element: <NewsUpdates /> },
        { path: "7-days-forecast", element: <SevenDaysForecast /> },
        { path: "agro-bulletins", element: <AgroBulletins /> },
        { path: "flood-drought", element: <FloodDrought /> },
        { path: "subseasonal-forecast", element: <SubseasonalForecast /> },

        { path: "poultry-calendar", element: <PoultryCalendar /> },
        { path: "seasonal-forecast", element: <SeasonalForecast /> },
        { path: "blog/gmet-visit", element: <BlogGmetVisit /> },
        {
          path: "blog/national-assembly-visit",
          element: <BlogNationalAssemblyVisit />,
        },
        { path: "blog/son-forecast", element: <BlogSonForecast /> },

        { path: "poultry-advisory", element: <PoultryAdvisory /> },
        { path: "crop-advisory", element: <CropAdvisory /> },
        { path: "services", element: <OurServices /> },
        { path: "contact", element: <Contact /> },
        { path: "careers", element: <Careers /> },
        { path: "privacy", element: <PrivacyPolicy /> },
        { path: "terms", element: <TermsOfService /> },
        { path: "market-page", element: <MarketPage /> },
        { path: "crop-diagnose", element: <CropDiagnosticTool /> },
        { path: "product/:id", element: <ProductDetail products={products} /> },

        { path: "agro-advisory", element: <AgrometAdvisory /> },
        { path: "media-page", element: <MediaPage /> },
        { path: "admin-login", element: <AdminLogin /> },
        { path: "admin-signup", element: <AdminSignUp /> },
        { path: "*", element: <NotFound /> },
      ],
    },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      ),
      children: [{ index: true, element: <DashboardPage /> }],
    },
    { path: "/production/provisional", element: <CreateCropCalendar /> },
    { path: "/production/calendar-preview", element: <CalendarPreviewPage /> },
    { path: "/production/poultry-calendar-preview", element: <PoultryCalendarPreviewPage /> },

    { path: "/production/2024-minor", element: <CreateCropCalendar /> },
    { path: "/production/2025-major", element: <CreateCropCalendar /> },
    
    // Poultry Production Routes
    { path: "/production/poultry/provisional", element: <CreatePoultryCalendarPage /> },
    { path: "/production/poultry/current", element: <CreatePoultryCalendarPage /> },
    { path: "/production/poultry/2025", element: <CreatePoultryCalendarPage /> },
  ], {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  });

  return <RouterProvider router={router} />;
}

export default App;
