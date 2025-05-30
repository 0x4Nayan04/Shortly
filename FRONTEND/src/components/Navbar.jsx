import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ user, onLogout, onShowAuth }) => {
  const navigate = useNavigate();
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center hover:cursor-pointer"
            onClick={() => navigate("/")}>
            <h1 className="text-xl font-bold text-gray-900 ">
              Short<span className="text-blue-600">ly</span>
            </h1>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {(user.name || user.email || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">
                    {user.name || user.email}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors hover:cursor-pointer">
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:cursor-pointer">
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
