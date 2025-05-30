import { useState, useEffect } from "react";

const UserProfileModal = ({ isOpen, onClose, user, userStats }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full shadow-lg"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center shadow-lg hidden">
                <span className="text-2xl font-bold text-blue-600">
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {user.name}
            </h3>
            <p className="text-gray-600 text-sm">{user.email}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
              Active Account
            </span>
          </div>

          {/* Account Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {userStats?.totalUrls || 0}
              </div>
              <div className="text-sm text-gray-600">URLs Created</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {userStats?.totalClicks || 0}
              </div>
              <div className="text-sm text-gray-600">Total Clicks</div>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Full Name
              </label>
              <div className="bg-gray-50 rounded-lg p-3 text-gray-900">
                {user.name}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Email Address
              </label>
              <div className="bg-gray-50 rounded-lg p-3 text-gray-900">
                {user.email}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Member Since
              </label>
              <div className="bg-gray-50 rounded-lg p-3 text-gray-900">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Recently joined"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
