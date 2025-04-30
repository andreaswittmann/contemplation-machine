import React from 'react';
import ApiKeyManagement from './ApiKeyManagement';
import './SettingsView.css';

const SettingsView: React.FC = () => {
  const handleClearCache = () => {
    // Clear application cache using the Cache API
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Reload the page to ensure fresh state
    window.location.reload();
  };

  return (
    <div className="settings-view">
      <h1>Settings</h1>
      
      <div className="settings-section">
        <ApiKeyManagement />
      </div>

      <div className="settings-section">
        <h2>Cache Management</h2>
        <p>Clear the application cache and reload with fresh data.</p>
        <button 
          className="btn btn-danger"
          onClick={handleClearCache}
        >
          Clear Cache and Reload
        </button>
      </div>
    </div>
  );
};

export default SettingsView;