import { useState } from "react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";

const AuthPage = ({ onAuthSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);

  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={onBack}
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

        {/* Auth Forms */}
        {isLogin ? (
          <LoginForm
            onLoginSuccess={onAuthSuccess}
            switchToRegister={switchToRegister}
          />
        ) : (
          <RegisterForm
            onRegisterSuccess={onAuthSuccess}
            switchToLogin={switchToLogin}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
