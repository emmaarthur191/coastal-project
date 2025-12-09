import React from 'react';

const PageLoading = ({ message = "Loading page..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-mauve-50 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      {/* Loading Content */}
      <div className="relative text-center animate-scale-in">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-6 shadow-elevated animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>

        {/* Loading Text */}
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {message}
        </h3>
        <p className="text-neutral-600 text-sm">
          Please wait...
        </p>

        {/* Loading Dots */}
        <div className="flex justify-center gap-1 mt-4">
          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div>
          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default PageLoading;