import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { fetchElevenLabsVoices } from '../services/AudioService';

// Define the ElevenLabs voice interface
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url?: string;
}

// Context interface with state
interface ElevenLabsVoicesContextType {
  voices: ElevenLabsVoice[];
  isLoading: boolean;
  error: string | null;
  refreshVoices: (limit?: number) => Promise<void>;
  setVoiceLimit: (limit: number | undefined) => void;
}

// Create the context with default values
const ElevenLabsVoicesContext = createContext<ElevenLabsVoicesContextType>({
  voices: [],
  isLoading: false,
  error: null,
  refreshVoices: async () => {},
  setVoiceLimit: () => {}
});

// Custom hook for accessing the ElevenLabs voices
export const useElevenLabsVoices = () => useContext(ElevenLabsVoicesContext);

// Provider component
export const ElevenLabsVoicesProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceLimit, setVoiceLimit] = useState<number | undefined>(undefined);

  // Function to fetch the voices from the API
  const fetchVoices = async (limit?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the provided limit, or fall back to the state limit
      const effectiveLimit = limit !== undefined ? limit : voiceLimit;
      
      const response = await fetchElevenLabsVoices(effectiveLimit);
      if (response && response.voices) {
        setVoices(response.voices);
      } else {
        setVoices([]);
      }
    } catch (err) {
      console.error('Error fetching ElevenLabs voices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch voices');
      // Set some default voices when API call fails
      setVoices([
        { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
        { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' },
        { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
        { voice_id: 'VR6AewLTigWG4xSOukaG', name: 'Adam' },
        { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Elli' },
        { voice_id: 'jBpfuIE2acCO8z3wKNLl', name: 'Grace' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch voices on mount or when voice limit changes
  useEffect(() => {
    fetchVoices();
  }, [voiceLimit]);

  return (
    <ElevenLabsVoicesContext.Provider value={{ 
      voices, 
      isLoading, 
      error, 
      refreshVoices: fetchVoices,
      setVoiceLimit 
    }}>
      {children}
    </ElevenLabsVoicesContext.Provider>
  );
};