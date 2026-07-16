import React, { Suspense } from "react";

export default function withSuspense(Component, fallback = null) {
  return function SuspenseWrapper(props) {
    const defaultFallback = (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/60">Loading...</p>
        </div>
      </div>
    );

    return (
      <Suspense fallback={fallback || defaultFallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}