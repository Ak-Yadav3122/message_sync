import React from "react";
import "./LoadingPage.css";

const LoadingPage = () => {
  return (
    <div className="loading-page">
      <div className="loading-content">
        <div className="logo flex items-center gap-3">
          <span className="text-xl font-bold">MessageSync</span>
        </div>

        <div className="loading-message">
          Just a moment &mdash; we&apos;re getting things ready
        </div>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
