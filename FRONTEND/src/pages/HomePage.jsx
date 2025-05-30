import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import LandingPage from "../components/LandingPage";
import Dashboard from "../components/Dashboard";
import AuthPage from "../components/AuthPage";
import { logoutUser, getCurrentUser } from "../api/user.api";

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState("home"); // "home", "auth", "dashboard"
  const [loading, setLoading] = useState(true); // Add loading state

  // Check for existing user session on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await getCurrentUser();
        if (response && response.user) {
          setUser(response.user);
          setCurrentView("dashboard");
        }
      } catch (error) {
        // User is not authenticated or session expired
        console.log("No active session");
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleAuthSuccess = (response) => {
    setUser(response.user || { email: "User" });
    setCurrentView("dashboard");
    console.log("User authenticated:", response);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setCurrentView("home");
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      // Clear any local storage or session storage if you're using it
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setCurrentView("home");
      console.log("Forced local logout due to API error");
    }
  };

  const showAuth = () => setCurrentView("auth");
  const showHome = () => setCurrentView("home");

  const renderCurrentView = () => {
    if (loading) {
      return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (user) {
      return <Dashboard user={user} />;
    }

    switch (currentView) {
      case "auth":
        return <AuthPage onAuthSuccess={handleAuthSuccess} onBack={showHome} />;
      case "home":
      default:
        return <LandingPage onShowAuth={showAuth} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} onShowAuth={showAuth} />
      {renderCurrentView()}
    </div>
  );
};

export default HomePage;
