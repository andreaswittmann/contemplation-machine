import React, { useState } from 'react';
import { useApiKeys } from '../contexts/ApiKeyContext';

// Service information for display
interface ServiceInfo {
  name: string;
  description: string;
  icon: string;
  helpUrl: string;
}

interface ServiceStatus {
  available: boolean;
  lastChecked: string | null;
  features: string[];
  envKeyPresent: boolean;
}

const serviceInfo: Record<string, ServiceInfo> = {
  openai: {
    name: 'OpenAI',
    description: 'Provides high-quality text-to-speech voices',
    icon: '🤖',
    helpUrl: 'https://platform.openai.com/api-keys'
  },
  elevenlabs: {
    name: 'ElevenLabs',
    description: 'Offers realistic and expressive voice synthesis',
    icon: '🔊',
    helpUrl: 'https://elevenlabs.io/speech-synthesis'
  }
};

const ApiKeyManagement: React.FC = () => {
  const { serviceStatus, setApiKey, deleteApiKey, validateApiKey, isLoading, isSubmitting, error, refreshStatus } = useApiKeys();
  
  // Local state for form inputs
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: '',
    elevenlabs: ''
  });
  
  // Validation state for input fields
  const [validationStatus, setValidationStatus] = useState<Record<string, boolean | null>>({
    openai: null,
    elevenlabs: null
  });

  // Local state for showing/hiding API key input
  const [showKey, setShowKey] = useState<Record<string, boolean>>({
    openai: false,
    elevenlabs: false
  });

  // Handle input change
  const handleInputChange = (service: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [service]: value
    }));
    
    // Reset validation status when input changes
    setValidationStatus(prev => ({
      ...prev,
      [service]: null
    }));
  };

  // Toggle API key visibility
  const toggleKeyVisibility = (service: string) => {
    setShowKey(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  // Validate API key
  const handleValidate = async (service: string) => {
    if (!apiKeys[service].trim()) return;
    
    const isValid = await validateApiKey(service, apiKeys[service].trim());
    
    setValidationStatus(prev => ({
      ...prev,
      [service]: isValid
    }));
  };

  // Save API key
  const handleSave = async (service: string) => {
    if (!apiKeys[service].trim()) return;
    
    await setApiKey(service, apiKeys[service].trim());
    
    // Clear input after saving
    setApiKeys(prev => ({
      ...prev,
      [service]: ''
    }));
    
    // Refresh status after saving
    await refreshStatus();
  };

  // Delete API key
  const handleDelete = async (service: string) => {
    if (window.confirm(`Are you sure you want to remove your ${serviceInfo[service].name} API key?`)) {
      await deleteApiKey(service);
    }
  };

  // Render status indicator
  const renderStatusIndicator = (service: string) => {
    const status = serviceStatus[service as keyof typeof serviceStatus] as ServiceStatus | undefined;
    
    if (!status) {
      return <span className="status-indicator not-configured">Not configured</span>;
    }
    
    if (status.available) {
      return (
        <div className="status-wrapper">
          <span className="status-indicator available">Available</span>
          {status.envKeyPresent && <span className="status-indicator env-present">ENV Key Present</span>}
        </div>
      );
    }
    
    return (
      <div className="status-wrapper">
        <span className="status-indicator unavailable">Unavailable</span>
        {status.envKeyPresent && <span className="status-indicator env-present">ENV Key Present</span>}
      </div>
    );
  };

  if (isLoading) {
    return <div className="api-key-loading">Loading API key status...</div>;
  }

  return (
    <div className="api-key-management">
      <h2>API Key Management</h2>
      
      {error && (
        <div className="api-key-error">
          <p>Error: {error}</p>
          <button onClick={() => refreshStatus()}>Retry</button>
        </div>
      )}
      
      {/* OpenAI section */}
      <div className="api-key-section">
        <div className="service-header">
          <h3>
            <span className="service-icon">{serviceInfo.openai.icon}</span> 
            {serviceInfo.openai.name}
          </h3>
          {renderStatusIndicator('openai')}
        </div>
        
        <p className="service-description">{serviceInfo.openai.description}</p>
        
        <div className="key-input-container">
          <div className="key-input-group">
            <input
              type={showKey.openai ? 'text' : 'password'}
              value={apiKeys.openai}
              onChange={(e) => handleInputChange('openai', e.target.value)}
              placeholder="Enter OpenAI API Key"
              disabled={isSubmitting}
              className={validationStatus.openai === false ? 'invalid' : ''}
            />
            <button 
              className="toggle-visibility" 
              onClick={() => toggleKeyVisibility('openai')}
              title={showKey.openai ? 'Hide API key' : 'Show API key'}
            >
              {showKey.openai ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          
          <div className="key-action-buttons">
            <button
              onClick={() => handleValidate('openai')}
              disabled={!apiKeys.openai || isSubmitting}
              className="validate-button"
            >
              Test Key
            </button>
            <button
              onClick={() => handleSave('openai')}
              disabled={!apiKeys.openai || isSubmitting}
              className="save-button"
            >
              Save Key
            </button>
            {serviceStatus.openai?.available && (
              <button
                onClick={() => handleDelete('openai')}
                disabled={isSubmitting}
                className="delete-button"
              >
                Remove Key
              </button>
            )}
          </div>
        </div>
        
        {validationStatus.openai !== null && (
          <div className={`validation-result ${validationStatus.openai ? 'success' : 'error'}`}>
            {validationStatus.openai 
              ? 'API key is valid!' 
              : 'API key validation failed. Please check your key and try again.'}
          </div>
        )}
        
        <div className="api-key-help">
          <a href={serviceInfo.openai.helpUrl} target="_blank" rel="noopener noreferrer">
            Get an OpenAI API key
          </a>
        </div>
      </div>
      
      {/* ElevenLabs section */}
      <div className="api-key-section">
        <div className="service-header">
          <h3>
            <span className="service-icon">{serviceInfo.elevenlabs.icon}</span> 
            {serviceInfo.elevenlabs.name}
          </h3>
          {renderStatusIndicator('elevenlabs')}
        </div>
        
        <p className="service-description">{serviceInfo.elevenlabs.description}</p>
        
        <div className="key-input-container">
          <div className="key-input-group">
            <input
              type={showKey.elevenlabs ? 'text' : 'password'}
              value={apiKeys.elevenlabs}
              onChange={(e) => handleInputChange('elevenlabs', e.target.value)}
              placeholder="Enter ElevenLabs API Key"
              disabled={isSubmitting}
              className={validationStatus.elevenlabs === false ? 'invalid' : ''}
            />
            <button 
              className="toggle-visibility" 
              onClick={() => toggleKeyVisibility('elevenlabs')}
              title={showKey.elevenlabs ? 'Hide API key' : 'Show API key'}
            >
              {showKey.elevenlabs ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          
          <div className="key-action-buttons">
            <button
              onClick={() => handleValidate('elevenlabs')}
              disabled={!apiKeys.elevenlabs || isSubmitting}
              className="validate-button"
            >
              Test Key
            </button>
            <button
              onClick={() => handleSave('elevenlabs')}
              disabled={!apiKeys.elevenlabs || isSubmitting}
              className="save-button"
            >
              Save Key
            </button>
            {serviceStatus.elevenlabs?.available && (
              <button
                onClick={() => handleDelete('elevenlabs')}
                disabled={isSubmitting}
                className="delete-button"
              >
                Remove Key
              </button>
            )}
          </div>
        </div>
        
        {validationStatus.elevenlabs !== null && (
          <div className={`validation-result ${validationStatus.elevenlabs ? 'success' : 'error'}`}>
            {validationStatus.elevenlabs 
              ? 'API key is valid!' 
              : 'API key validation failed. Please check your key and try again.'}
          </div>
        )}
        
        <div className="api-key-help">
          <a href={serviceInfo.elevenlabs.helpUrl} target="_blank" rel="noopener noreferrer">
            Get an ElevenLabs API key
          </a>
        </div>
      </div>
      
      <div className="api-key-info">
        <h4>Important Information</h4>
        <ul>
          <li>Your API keys are encrypted before being stored on the server</li>
          <li>Each API key provider may have usage limits and associated costs</li>
          <li>Voice guidance features require at least one valid API key</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiKeyManagement;