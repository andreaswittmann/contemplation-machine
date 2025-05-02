import React from 'react';

interface ErrorBannerProps {
  message: string;
  onClose: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onClose }) => {
  return (
    <div className="error-banner">
      <div className="error-banner-content">
        <span className="error-message">{message}</span>
        <button className="error-close-button" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};