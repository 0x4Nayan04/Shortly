import { useState } from "react";
import { registerUser } from "../api/user.api";
import { validators } from "../utils/validation";
import { showToast, useOnlineStatus } from "./UxEnhancements";

const RegisterForm = ({ onRegisterSuccess, switchToLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isOnline } = useOnlineStatus();

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({
    name: null,
    email: null,
    password: null,
    confirmPassword: null,
  });
  // Track which fields have been touched
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  // Validate a single field
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        return validators.name(value);
      case "email":
        return validators.email(value);
      case "password":
        return validators.password(value);
      case "confirmPassword":
        return validators.confirmPassword(value, password);
      default:
        return null;
    }
  };

  // Handle field blur - validate and mark as touched
  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  // Handle field change
  const handleChange = (field, value, setter) => {
    setter(value);
    // Clear server error when user starts typing
    if (error) setError("");

    // If field was touched, validate on change for immediate feedback
    if (touched[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }

    // Special case: if password changes and confirmPassword is touched, revalidate confirmPassword
    if (field === "password" && touched.confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: validators.confirmPassword(confirmPassword, value),
      }));
    }
  };

  // Validate all fields before submit
  const validateAllFields = () => {
    const errors = {
      name: validators.name(name),
      email: validators.email(email),
      password: validators.password(password),
      confirmPassword: validators.confirmPassword(confirmPassword, password),
    };
    setFieldErrors(errors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    return !errors.name && !errors.email && !errors.password && !errors.confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check online status
    if (!isOnline) {
      showToast.error("You're offline. Cannot create account.");
      return;
    }

    // Validate all fields
    if (!validateAllFields()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await registerUser(name, email, password);

      if (response.success) {
        showToast.success("Account created successfully!");
        // Call the success callback if provided
        if (onRegisterSuccess) {
          onRegisterSuccess(response);
        }

        // Clear form
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFieldErrors({ name: null, email: null, password: null, confirmPassword: null });
        setTouched({ name: false, email: false, password: false, confirmPassword: false });

      } else {
        setError(response.message || "Registration failed");
        showToast.error(response.message || "Registration failed");
      }
    } catch (err) {
      const data = err?.response ? err.response.data : err;
      if (data && typeof data === "object" && Array.isArray(data.errors)) {
        const backendErrors = {};
        data.errors.forEach((e) => {
          backendErrors[e.field] = e.message;
        });
        setFieldErrors((prev) => ({ ...prev, ...backendErrors }));
        showToast.error("Please check the form for errors.");
      } else {
        const errorMsg = typeof data === "string" ? data : (data?.message || "Registration failed");
        setError(errorMsg);
        showToast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to get input class based on validation state
  const getInputClass = (field) => {
    const baseClass = "w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus-visible:ring-2 transition-colors";
    const hasError = touched[field] && fieldErrors[field];

    if (hasError) {
      return `${baseClass} border-red-300 focus-visible:ring-red-500 focus:border-red-500`;
    }
    return `${baseClass} border-gray-300 focus-visible:ring-blue-500 focus:border-blue-500`;
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
        <p className="text-gray-600 mt-2">Sign up to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => handleChange("name", e.target.value, setName)}
            onBlur={(e) => handleBlur("name", e.target.value)}
            placeholder="Enter your full name"
            className={getInputClass("name")}
            aria-invalid={touched.name && fieldErrors.name ? "true" : "false"}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
          />
          {touched.name && fieldErrors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => handleChange("email", e.target.value, setEmail)}
            onBlur={(e) => handleBlur("email", e.target.value)}
            placeholder="Enter your email"
            className={getInputClass("email")}
            aria-invalid={touched.email && fieldErrors.email ? "true" : "false"}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
          {touched.email && fieldErrors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handleChange("password", e.target.value, setPassword)}
              onBlur={(e) => handleBlur("password", e.target.value)}
              placeholder="Enter your password"
              className={`${getInputClass("password")} pr-12`}
              aria-invalid={touched.password && fieldErrors.password ? "true" : "false"}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none">
              {showPassword ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          {touched.password && fieldErrors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.password}
            </p>
          )}
          {/* Password requirements hint */}
          {!fieldErrors.password && password.length > 0 && password.length < 6 && (
            <p className="mt-1 text-sm text-gray-500">
              Password must be at least 6 characters
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value, setConfirmPassword)}
              onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
              placeholder="Confirm your password"
              className={`${getInputClass("confirmPassword")} pr-12`}
              aria-invalid={touched.confirmPassword && fieldErrors.confirmPassword ? "true" : "false"}
              aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none">
              {showConfirmPassword ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          {touched.confirmPassword && fieldErrors.confirmPassword && (
            <p id="confirmPassword-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg text-base transition-colors">
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={switchToLogin}
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
