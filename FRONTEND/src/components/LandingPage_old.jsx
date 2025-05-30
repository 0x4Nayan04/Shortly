import UrlForm from "../components/UrlForm";
import { useNavigate } from "react-router-dom";

const LandingPage = ({ onShowAuth, user }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-20 text-center">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 mb-6 leading-tight">
            Shorten URLs.
            <br />
            <span className="text-indigo-600">Share effortlessly.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Transform long, complex URLs into clean, shareable links in seconds.
          </p>
        </div>

        {/* URL Shortener Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <UrlForm user={user} onShowAuth={() => navigate("/login")} />

            {/* Call to Action - Only show if user is not logged in */}
            {!user && (
              <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ready to get started?
                </h3>
                <p className="text-gray-600 mb-4 font-light">
                  Create an account to save your URLs and create custom short links.
                </p>
                <button
                  onClick={onShowAuth}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md">
                  Get Started Free
                </button>
              </div>
            )}

            {/* Logged in user message */}
            {user && (
              <div className="mt-8 p-6 bg-emerald-50 rounded-xl border border-emerald-100">
                <h3 className="text-lg font-medium text-emerald-900 mb-2">
                  Welcome back, {user.name}! 👋
                </h3>
                <p className="text-emerald-700 mb-4 font-light">
                  You're ready to create short URLs. Visit your dashboard to manage all your links.
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md">
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600 font-light">Generate short URLs instantly with our optimized platform.</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Secure & Reliable</h3>
            <p className="text-gray-600 font-light">Your links are protected with enterprise-grade security.</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 011 1v1z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Custom Aliases</h3>
            <p className="text-gray-600 font-light">Create branded short links with custom aliases.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
