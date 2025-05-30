import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import AccountSettings from "./components/AccountSettings";
import UserProfileModal from "./components/UserProfileModal";
import { logoutUser, getCurrentUser } from "./api/user.api";
import { getMyUrls } from "./api/shortUrl.api";

// Helper components for proper routing
const LoginPage = ({ user, navigate, onLoginSuccess }) => {
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate("/")}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to home
        </button>
        <LoginForm
          onLoginSuccess={onLoginSuccess}
          switchToRegister={() => navigate("/register")}
        />
      </div>
    </div>
  );
};

const RegisterPage = ({ user, navigate, onRegisterSuccess }) => {
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate("/")}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to home
        </button>
        <RegisterForm
          onRegisterSuccess={onRegisterSuccess}
          switchToLogin={() => navigate("/login")}
        />
      </div>
    </div>
  );
};

const ProtectedRoute = ({ user, component, navigate }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return component;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userStats, setUserStats] = useState({
    totalUrls: 0,
    totalClicks: 0,
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user stats for profile modal
  const fetchUserStats = async () => {
    try {
      const response = await getMyUrls();
      if (response && response.data && response.data.urls) {
        const urls = response.data.urls;
        const totalClicks = urls.reduce(
          (sum, url) => sum + (url.click || 0),
          0
        );
        setUserStats({
          totalUrls: urls.length,
          totalClicks: totalClicks,
        });
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  // Check for existing user session on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await getCurrentUser();
        if (response && response.user) {
          setUser(response.user);
          // If user is logged in and on auth pages, redirect to dashboard
          if (
            location.pathname === "/login" ||
            location.pathname === "/register"
          ) {
            navigate("/dashboard");
          }
        }
      } catch (error) {
        // User is not authenticated or session expired
        console.log("No active session");
        // If user is not authenticated and trying to access protected route, redirect to home
        if (location.pathname === "/dashboard") {
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [location.pathname, navigate]);

  const handleAuthSuccess = (response) => {
    setUser(response.user || { email: "User" });
    navigate("/dashboard");
    console.log("User authenticated:", response);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      navigate("/");
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      navigate("/");
      console.log("Forced local logout due to API error");
    }
  };

  const showAuth = () => navigate("/login");

  const handleShowProfile = () => {
    fetchUserStats();
    setShowProfileModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onShowAuth={showAuth}
        onShowProfile={handleShowProfile}
      />
      <Routes>
        <Route
          path="/"
          element={<LandingPage onShowAuth={showAuth} user={user} />}
        />
        <Route
          path="/login"
          element={
            <LoginPage
              user={user}
              navigate={navigate}
              onLoginSuccess={handleAuthSuccess}
            />
          }
        />
        <Route
          path="/register"
          element={
            <RegisterPage
              user={user}
              navigate={navigate}
              onRegisterSuccess={handleAuthSuccess}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              user={user}
              component={<Dashboard user={user} />}
              navigate={navigate}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute
              user={user}
              component={<AccountSettings user={user} />}
              navigate={navigate}
            />
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute
              user={user}
              component={<AnalyticsDashboard user={user} />}
              navigate={navigate}
            />
          }
        />
      </Routes>

      {/* Profile Modal */}
      {user && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
          userStats={userStats}
        />
      )}
    </div>
  );
};

export default App;
