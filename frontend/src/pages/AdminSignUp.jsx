import { useState } from "react";
import PageTitle from '../components/PageTitle';
import { Link, useNavigate } from "react-router-dom";
import hero from "../assets/images/register.jpg";
import googlelogo from "../assets/images/googlelogo.svg";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import userService from "../services/userService";

const AdminSignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });

    if (errors[id]) {
      setErrors({
        ...errors,
        [id]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError("");
    setErrors({});

    try {
      const result = await userService.signUp({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        navigate("/admin-login", {
          state: { message: "Account created successfully! Please sign in." },
        });
      } else {
        // Handle field-specific errors from server
        if (result.details?.errors) {
          const fieldErrors = {};
          result.details.errors.forEach((err) => {
            if (err.path && err.message) {
              fieldErrors[err.path] = err.message;
            }
          });
          
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          } else {
            setApiError(result.error || "Registration failed. Please try again.");
          }
        } else {
          setApiError(result.error || "Registration failed. Please try again.");
        }
      }
    } catch {
      setApiError("Network error occurred. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageTitle title="Admin Sign Up" />
      <div className="neo-page min-h-screen flex flex-col lg:grid lg:grid-cols-5">
      {/* Left Section (Hero) */}
      <div
        className="lg:col-span-2 flex flex-col justify-center items-center bg-cover bg-center p-6 sm:p-8 lg:p-10 text-white relative"
        style={{ backgroundImage: `url(${hero})` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <h2 className="relative text-3xl sm:text-4xl font-bold mb-4 text-center pt-10">
          Hello, Friend!
        </h2>
        <p className="relative text-sm sm:text-base mb-6 text-center max-w-xs">
          To keep connected with us, provide us with your information
        </p>
        <Link
          to="/admin-login"
          className="neo-button relative bg-white/90 text-neo-accent-strong"
        >
          Sign In
        </Link>
      </div>

      {/* Right Section (Form) */}
      <div className="lg:col-span-3 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-10">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 text-neo-text">
          AgroMet <span className="text-neo-accent-strong">AI</span>
        </h1>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 text-neo-text">
          Sign Up to AgroMet AI
        </h2>

        {apiError && (
          <div className="w-full max-w-md bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 shadow-sm">
            {apiError}
          </div>
        )}

        <form
          className="neo-surface w-full max-w-md flex flex-col gap-5 p-6 sm:p-8"
          onSubmit={handleSubmit}
        >
          <div className="mb-2">
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="name"
            >
              Full Name
            </label>
            <input
              className={`neo-input ${
                errors.name ? "border-red-400" : ""
              }`}
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>
            )}
          </div>

          <div className="mb-2">
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className={`neo-input ${
                errors.email ? "border-red-400" : ""
              }`}
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>
            )}
          </div>

          <div className="mb-2 relative">
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className={`neo-input pr-12 ${
                errors.password ? "border-red-400" : ""
              }`}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute right-3 top-11 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>
            )}
          </div>

          <div className="mb-2 relative">
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <input
              className={`neo-input pr-12 ${
                errors.confirmPassword ? "border-red-400" : ""
              }`}
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute right-3 top-11 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <FaEyeSlash size={20} />
              ) : (
                <FaEye size={20} />
              )}
            </button>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1.5">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center mb-4 w-1/2 mx-auto">
            <button
              className="neo-button-primary w-full"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Signing up..." : "Sign Up"}
            </button>
          </div>

          <div className="text-center text-gray-500 my-4">OR</div>

          <button
            className="neo-button w-full"
            type="button"
            onClick={() =>
              (window.location.href =
                "https://agropulse.onrender.com/api/v1/auth/google")
            }
          >
            <img src={googlelogo} alt="Google logo" className="w-5 h-5" />
            Sign Up with Google
          </button>

          <div className="text-center text-sm mt-4 text-gray-600">
            Already have an account?{" "}
            <Link
              to="/admin-login"
              className="text-neo-accent-strong font-semibold hover:underline"
            >
              Sign In
            </Link>
          </div>
        </form>
      </div>
      </div>
    </>
  );
};

export default AdminSignUp;
