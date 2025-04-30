import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ApiKeyStatus {
  exists: boolean;
  validated: boolean;
  lastValidated: string | null;
  lastUpdated: string | null;
}

interface ServiceStatus {
  available: boolean;
  lastChecked: string | null;
  features: string[];
  error?: string;
}

interface ApiKeyContextType {
  // Key statuses
  keyStatuses: {
    openai?: ApiKeyStatus;
    elevenlabs?: ApiKeyStatus;
  };
  // Service availability
  serviceStatus: {
    openai?: ServiceStatus;
    elevenlabs?: ServiceStatus;
  };
  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  // Actions
  setApiKey: (service: string, key: string) => Promise<void>;
  deleteApiKey: (service: string) => Promise<void>;
  validateApiKey: (service: string, key: string) => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for key statuses
  const [keyStatuses, setKeyStatuses] = useState<{
    openai?: ApiKeyStatus;
    elevenlabs?: ApiKeyStatus;
  }>({});
  
  // State for service availability
  const [serviceStatus, setServiceStatus] = useState<{
    openai?: ServiceStatus;
    elevenlabs?: ServiceStatus;
  }>({});
  
  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Load API key status on component mount
  useEffect(() => {
    refreshStatus();
  }, []);

  // Function to get API key statuses from backend
  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/keys/status');
      if (!response.ok) throw new Error('Failed to fetch API key status');
      
      const data = await response.json();
      setServiceStatus(data.services || {});
      
      // Reset error on successful load
      setError(null);
    } catch (err) {
      console.error('Error fetching API key status:', err);
      setError('Failed to load API key statuses. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to set an API key
  const setApiKey = async (service: string, key: string) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service, key }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save API key');
      }
      
      // Update status after saving key
      await refreshStatus();
      
      if (data.error) {
        setError(`API key saved but validation failed: ${data.error}`);
      }
    } catch (err: any) {
      console.error('Error setting API key:', err);
      setError(err.message || 'Failed to set API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to delete an API key
  const deleteApiKey = async (service: string) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/keys/${service}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to delete ${service} API key`);
      }
      
      // Update status after deleting key
      await refreshStatus();
    } catch (err: any) {
      console.error('Error deleting API key:', err);
      setError(err.message || 'Failed to delete API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to validate an API key without saving it
  const validateApiKey = async (service: string, key: string) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/keys/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service, key }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API key validation failed');
      }
      
      return data.valid;
    } catch (err: any) {
      console.error('Error validating API key:', err);
      setError(err.message || 'Failed to validate API key');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const value = {
    keyStatuses,
    serviceStatus,
    isLoading,
    isSubmitting,
    setApiKey,
    deleteApiKey,
    validateApiKey,
    refreshStatus,
    error,
    setError,
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKeys = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKeys must be used within an ApiKeyProvider');
  }
  return context;
};