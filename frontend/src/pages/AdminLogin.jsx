import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import hero from "../assets/images/signin.jpg";
import googlelogo from "../assets/images/googlelogo.svg";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import userService from "../services/userService";
import PageTitle from "../components/PageTitle";

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    userService.clearAuthData();
  }, []);

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

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
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

    try {
      const result = await userService.signIn({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        const redirectTo = location.state?.from?.pathname || "/dashboard";
        navigate(redirectTo, { replace: true });
      } else {
        setApiError(
          result.error || "Failed to login. Please check your credentials."
        );
      }
    } catch {
      setApiError(
        "Authentication service is currently unavailable. Please try again after the backend is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageTitle title="Admin Login" />
      <div className="neo-page min-h-screen flex flex-col lg:grid lg:grid-cols-5">
        <div
          className="lg:col-span-2 flex flex-col justify-center items-center bg-cover bg-center p-6 sm:p-8 lg:p-10 text-white relative"
          style={{ backgroundImage: `url(${hero})` }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
          <h2 className="relative text-3xl sm:text-4xl font-bold mb-4 text-center pt-12">
            Welcome Back
          </h2>
          <p className="relative text-sm sm:text-base mb-6 text-center max-w-xs">
            Enter your details to continue your journey with us
          </p>
          <Link
            to="/admin-signup"
            className="neo-button relative bg-white/90 text-neo-accent-strong"
          >
            Sign Up
          </Link>
        </div>

        <div className="lg:col-span-3 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-10">
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-neo-text">
            AgroMet <span className="text-neo-accent-strong">AI</span>
          </h1>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 text-neo-text">
            Sign In to AgroMet AI
          </h2>

          {location.state?.message && (
            <div className="w-full max-w-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 shadow-sm">
              {location.state.message}
            </div>
          )}

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

            <div className="flex items-center justify-between mb-4 text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-200"
                />
                <label htmlFor="remember-me" className="ml-2 text-gray-600">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-neo-accent-strong hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="flex items-center justify-center mb-4 w-1/2 mx-auto">
              <button
                className="neo-button-primary w-full"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
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
              Sign In with Google
            </button>

            <div className="text-center text-sm mt-4 text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/admin-signup"
                className="text-neo-accent-strong font-semibold hover:underline"
              >
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
