import UrlForm from "../components/UrlForm";
import { useNavigate } from "react-router-dom";

const LandingPage = ({ onShowAuth, user }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-white to-gray-50/50">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-[1.1] tracking-tight">
            Shorten URLs.
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Share effortlessly.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed font-light tracking-tight">
            Transform long, complex URLs into clean, shareable links in seconds.
            Simple, fast, and reliable.
          </p>
        </div>

        {/* URL Shortener Card */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100/50 p-10 md:p-12 backdrop-blur-sm">
            <UrlForm user={user} onShowAuth={() => navigate("/login")} />

            {/* Call to Action - Only show if user is not logged in */}
            {!user && (
              <div className="mt-10 p-8 bg-gray-50/80 rounded-2xl border border-gray-100/50">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 tracking-tight">
                  Ready to get started?
                </h3>
                <p className="text-gray-600 mb-6 font-light text-lg leading-relaxed">
                  Create an account to save your URLs and create custom short
                  links.
                </p>
                <button
                  onClick={onShowAuth}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl text-base font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
                  Get Started Free
                </button>
              </div>
            )}

            {/* Logged in user message */}
            {user && (
              <div className="mt-10 p-8 bg-emerald-50/80 rounded-2xl border border-emerald-100/50">
                <h3 className="text-xl font-semibold text-emerald-900 mb-3 tracking-tight">
                  Welcome back, {user.name}! 👋
                </h3>
                <p className="text-emerald-700 mb-6 font-light text-lg leading-relaxed">
                  You're ready to create short URLs. Visit your dashboard to
                  manage all your links.
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl text-base font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3 tracking-tight">
              Lightning Fast
            </h3>
            <p className="text-gray-600 font-light text-base leading-relaxed">
              Generate short URLs instantly with our optimized platform built
              for speed.
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3 tracking-tight">
              Secure & Reliable
            </h3>
            <p className="text-gray-600 font-light text-base leading-relaxed">
              Your links are protected with enterprise-grade security and 99.9%
              uptime.
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 011 1v1z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3 tracking-tight">
              Custom Aliases
            </h3>
            <p className="text-gray-600 font-light text-base leading-relaxed">
              Create branded short links with custom aliases that match your
              brand.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
