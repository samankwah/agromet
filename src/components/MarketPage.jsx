import { useState } from "react";
import { Search, ShoppingCart, Check } from "lucide-react";
import PropTypes from "prop-types";
import PageTitle from "./PageTitle";
import YellowMaizeImage from "../assets/images/yellow maize.png";
import WhiteMaizeImage from "../assets/images/white maize.png";
import YellowSoyaImage from "../assets/images/yellow soya.png";
import Yam from "../assets/images/yam.png";
import Tomato from "../assets/images/tomatoes.png";
import Rice from "../assets/images/rice.png";
import Pepper from "../assets/images/pepper.png";
import Pepper2 from "../assets/images/pepper2.png";
import Pepper3 from "../assets/images/pepper3.png";
import Onion from "../assets/images/onion.png";
import Onion2 from "../assets/images/onion2.png";
import Onion3 from "../assets/images/onion3.png";
import LiveChicken from "../assets/images/live chicken.png";
import DressedChicken from "../assets/images/dressed chicken.png";
import Beans from "../assets/images/beans.png";
import Plantain from "../assets/images/plantain.png";
import Cassava from "../assets/images/cassava.png";
import Sorghum from "../assets/images/sorghum.png";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../assets/images/prisma.png";

const commodities = [
  {
    id: 1,
    name: "Yellow Maize",
    image: YellowMaizeImage,
    price: 299.99,
    quantity: 0,
    status: "PRE",
    description: "Premium quality yellow maize",
  },
  {
    id: 2,
    name: "White Maize",
    image: WhiteMaizeImage,
    price: 289.99,
    quantity: 0,
    status: "PRE",
    description: "High-grade white maize",
  },
  {
    id: 3,
    name: "Yellow Soybeans",
    image: YellowSoyaImage,
    price: 399.99,
    quantity: 0,
    status: "PRE",
    description: "Fresh yellow soybeans",
  },
  {
    id: 4,
    name: "Yam",
    image: Yam,
    price: 389.99,
    quantity: 0,
    status: "PRE",
    description: "Puna yam",
  },
  {
    id: 5,
    name: "Tomatoes",
    image: Tomato,
    price: 149.99,
    quantity: 0,
    status: "PRE",
    description: "Fresh tomatoes",
  },
  {
    id: 6,
    name: "Rice",
    image: Rice,
    price: 159.99,
    quantity: 0,
    status: "PRE",
    description: "Jasmine rice",
  },
  {
    id: 7,
    name: "Pepper",
    image: Pepper,
    price: 59.99,
    quantity: 0,
    status: "PRE",
    description: "Black Cobra pepper",
  },
  {
    id: 8,
    name: "Pepper",
    image: Pepper2,
    price: 59.99,
    quantity: 0,
    status: "PRE",
    description: "Anaheim pepper",
  },
  {
    id: 9,
    name: "Pepper",
    image: Pepper3,
    price: 59.99,
    quantity: 0,
    status: "PRE",
    description: "Aleppo pepper",
  },
  {
    id: 10,
    name: "Onion",
    image: Onion,
    price: 109.99,
    quantity: 0,
    status: "PRE",
    description: "Purple/Red onion",
  },
  {
    id: 11,
    name: "Onion",
    image: Onion2,
    price: 119.99,
    quantity: 0,
    status: "PRE",
    description: "White onion",
  },
  {
    id: 12,
    name: "Onion",
    image: Onion3,
    price: 110.99,
    quantity: 0,
    status: "PRE",
    description: "Yellow onions",
  },
  {
    id: 13,
    name: "Poultry-Broiler Chicken",
    image: DressedChicken,
    price: 150.99,
    quantity: 0,
    status: "PRE",
    description: "Dressed Chicken Meat",
  },
  {
    id: 14,
    name: "Poultry-Broiler Chicken",
    image: LiveChicken,
    price: 150.99,
    quantity: 0,
    status: "PRE",
    description: "Life Chicken",
  },
  {
    id: 15,
    name: "Beans",
    image: Beans,
    price: 399.99,
    quantity: 0,
    status: "PRE",
    description: "Beans",
  },
  {
    id: 16,
    name: "Plantain",
    image: Plantain,
    price: 109.99,
    quantity: 0,
    status: "PRE",
    description: "Fresh Apem Plantain",
  },
  {
    id: 17,
    name: "Cassava",
    image: Cassava,
    price: 299.99,
    quantity: 0,
    status: "PRE",
    description: "Esi Abaaya",
  },
  {
    id: 18,
    name: "Sorghum",
    image: Sorghum,
    price: 399.99,
    quantity: 0,
    status: "PRE",
    description: "Premium Kapala",
  },
];

const categories = [
  "ALL",
  "Maize",
  "Soybeans",
  "Onion",
  "Pepper",
  "Poultry-Broiler Chicken",
  "Tomato",
  "Yam",
  "Rice",
  "Beans",
  "Cassava",
  "Plantain",
  "Sorghum",
];

const ProductCard = ({ product, onQuantityChange }) => {
  const [quantity, setQuantity] = useState(0);
  const navigate = useNavigate();
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 0) {
      setQuantity(newQuantity);
      onQuantityChange(product.id, newQuantity);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="relative group">
        {/* Apply zoom effect on hover */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-60 object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
        />
        <div className="absolute top-2 right-2">
          <span className="bg-green-700 text-white text-xs px-2 py-1 rounded">
            {product.status}
          </span>
        </div>

        <button
          className="absolute bottom-4 right-4 bg-yellow-400 p-2 rounded-full hover:bg-yellow-500 transition-colors"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          <ShoppingCart className="w-5 h-5 text-gray-800" />
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
            >
              -
            </button>
            <span className="text-gray-800">QTY: {quantity}</span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
            >
              +
            </button>
          </div>
          <span className="text-green-600 font-semibold">
            GH₵{product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Prop Types for ProductCard
ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  onQuantityChange: PropTypes.func.isRequired,
};

const CartSummary = ({ cart, commodities }) => {
  const totalItems = Object.values(cart).reduce((acc, qty) => acc + qty, 0);
  const totalPrice = Object.entries(cart).reduce((acc, [id, qty]) => {
    const product = commodities.find(
      (commodity) => commodity.id === parseInt(id)
    );
    return acc + qty * product.price;
  }, 0);

  return (
    <div className="bg-white rounded-lg p-4 shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Cart Summary</h2>
      <p className="text-gray-700">Total Items: {totalItems}</p>
      <p className="text-gray-700">Total Price: GH₵{totalPrice.toFixed(2)}</p>
      <button className="bg-teal-600 text-white px-4 py-2 rounded-lg mt-4 hover:bg-teal-700 transition">
        Checkout
      </button>
    </div>
  );
};

// Prop Types for CartSummary
CartSummary.propTypes = {
  cart: PropTypes.object.isRequired,
  commodities: PropTypes.array.isRequired,
};

const CategoryCheckbox = ({ category, isSelected, onToggle }) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onToggle}
        className={`w-4 h-4 border rounded flex items-center justify-center ${
          isSelected
            ? "bg-yellow-400 border-yellow-500"
            : "bg-white border-gray-300"
        }`}
      >
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </button>
      <span
        className={`${
          isSelected ? "text-yellow-600 font-semibold" : "text-gray-600"
        }`}
      >
        {category}
      </span>
    </div>
  );
};

CategoryCheckbox.propTypes = {
  category: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["ALL"]);
  const [cart, setCart] = useState({});
  const navigate = useNavigate();

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) => {
      if (category === "ALL") {
        return ["ALL"];
      }

      const newCategories = prev.filter((c) => c !== "ALL");
      if (prev.includes(category)) {
        return newCategories.filter((c) => c !== category);
      } else {
        return [...newCategories, category];
      }
    });
  };

  const handleQuantityChange = (productId, quantity) => {
    setCart((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const filteredProducts = commodities.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategories.includes("ALL") ||
      selectedCategories.some((category) => product.name.includes(category));
    return matchesSearch && matchesCategory;
  });

  const Sidebar = ({ products }) => {
    return (
      <div className="sidebar w-64 bg-gray-100 h-full p-4">
        <h2 className="text-2xl font-bold mb-4">Commodities</h2>
        <ul>
          {products.map((product) => (
            <li key={product.id} className="mb-2">
              <Link
                to={`/product/${product.id}`}
                className="text-blue-500 hover:underline"
              >
                {product.name} (ID: {product.id})
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // PropTypes validation
  Sidebar.propTypes = {
    products: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      })
    ).isRequired,
  };
  return (
    <>
      <PageTitle title="Agricultural Market" />
      <div
        className="min-h-screen bg-gray-950 mx-auto px-4 py-1 md:px-8 lg:px-12"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "1400px 1200px",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          WebkitBackgroundSize: "1200px 800px", // For Safari compatibility
          MozBackgroundSize: "1200px 800px", // For Firefox compatibility
        }}
      >
      <div className="max-w-[1440px] mx-auto px-0 sm:px-6 lg:px-8 pt-20">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="text-teal-500 hover:text-teal-600 flex items-center gap-2 transition-colors mb-6"
        >
          <span>←</span>
          <span className="text-sm font-medium">GO BACK</span>
        </button>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <div className="w-full md:w-1/4">
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full bg-yellow-400 text-gray-800 placeholder-gray-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute right-3 top-2.5 text-gray-600 w-5 h-5" />
                </div>

                <h2 className="text-xl font-semibold mb-4">Commodities</h2>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <CategoryCheckbox
                      key={category}
                      category={category}
                      isSelected={selectedCategories.includes(category)}
                      onToggle={() => handleCategoryToggle(category)}
                    />
                  ))}
                </div>
              </div>

              {/* Cart Summary */}
              <CartSummary cart={cart} commodities={commodities} />
            </div>

            {/* Product Grid */}
            <div className="w-full md:w-3/4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Marketplace;
