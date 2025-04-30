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
  refreshVoices: () => Promise<void>;
}

// Create the context with default values
const ElevenLabsVoicesContext = createContext<ElevenLabsVoicesContextType>({
  voices: [],
  isLoading: false,
  error: null,
  refreshVoices: async () => {}
});

// Custom hook for accessing the ElevenLabs voices
export const useElevenLabsVoices = () => useContext(ElevenLabsVoicesContext);

// Provider component
export const ElevenLabsVoicesProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch the voices from the API
  const fetchVoices = async () => {
    console.log('[ELEVENLABS] Starting voice fetch...');
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchElevenLabsVoices();
      console.log('[ELEVENLABS] API Response:', response);
      
      if (response && response.voices) {
        console.log(`[ELEVENLABS] Successfully loaded ${response.voices.length} voices:`, 
          response.voices.map((v: ElevenLabsVoice) => `${v.name} (${v.voice_id})`));
        setVoices(response.voices);
      } else {
        console.warn('[ELEVENLABS] No voices found in response');
        setVoices([]);
      }
    } catch (err) {
      console.error('[ELEVENLABS] Error fetching voices:', err);
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

  // Fetch voices on mount
  useEffect(() => {
    console.log('[ELEVENLABS] Component mounted, initiating voice fetch');
    fetchVoices();
  }, []);

  // Debug log when voices state changes
  useEffect(() => {
    console.log('[ELEVENLABS] Voices state updated:', voices.length, 'voices available');
  }, [voices]);

  return (
    <ElevenLabsVoicesContext.Provider value={{ 
      voices, 
      isLoading, 
      error, 
      refreshVoices: fetchVoices
    }}>
      {children}
    </ElevenLabsVoicesContext.Provider>
  );
};