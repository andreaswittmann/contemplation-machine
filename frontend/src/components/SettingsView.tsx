import React from 'react';
import ApiKeyManagement from './ApiKeyManagement';

const SettingsView: React.FC = () => {
  return (
    <div className="settings-view">
      <h1>Settings</h1>
      
      <div className="settings-section">
        <ApiKeyManagement />
      </div>
    </div>
  );
};

export default SettingsView;