import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/user.api";
import { validators } from "../utils/validation";
import { showToast } from "./UxEnhancements";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordError = validators.password(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPassword(token, password);
      setDone(true);
      showToast.success("Password reset successfully!");
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid or expired reset link.";
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto mt-6 sm:mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-md border border-gray-200 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Password reset!</h2>
        <p className="text-gray-600 mb-6">Your password has been updated successfully.</p>
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Sign in with new password
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-6 sm:mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Set new password</h2>
        <p className="text-gray-600 mt-2">Choose a new password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="At least 6 characters"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-500"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="reset-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            placeholder="Re-enter your password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-500"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
