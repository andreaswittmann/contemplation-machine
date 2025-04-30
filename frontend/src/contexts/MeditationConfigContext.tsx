import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useInstructions } from './InstructionsContext';

// Define available OpenAI voice options
export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

// Define available ElevenLabs voice options
export type ElevenLabsVoiceId = string;

// Define the shape of our meditation configuration
export interface MeditationConfig {
  duration: number; // Duration in minutes
  bellAtStart: boolean;
  bellAtEnd: boolean;
  useVoiceGuidance: boolean;
  voiceType: 'browser' | 'openai' | 'elevenlabs';
  openaiVoice: OpenAIVoice; // The specific OpenAI voice to use
  elevenlabsVoiceId: ElevenLabsVoiceId; // The specific ElevenLabs voice ID to use
  selectedInstructionId: string | null; // ID of selected instruction file
}

// Default configuration values
const defaultConfig: MeditationConfig = {
  duration: 10,
  bellAtStart: true,
  bellAtEnd: true,
  useVoiceGuidance: true,
  voiceType: 'browser',
  openaiVoice: 'alloy',
  elevenlabsVoiceId: '21m00Tcm4TlvDq8ikWAM', // Default to Rachel voice
  selectedInstructionId: null
};

// Context interface with state and updater function
interface MeditationConfigContextType {
  config: MeditationConfig;
  updateConfig: (newConfig: Partial<MeditationConfig>) => void;
  resetConfig: () => void;
}

// Create the context with default values
const MeditationConfigContext = createContext<MeditationConfigContextType>({
  config: defaultConfig,
  updateConfig: () => {},
  resetConfig: () => {},
});

// Custom hook for accessing the meditation config
export const useMeditationConfig = () => useContext(MeditationConfigContext);

// Provider component
export const MeditationConfigProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { instructions } = useInstructions();
  
  // Initialize state with localStorage values or defaults
  const [config, setConfig] = useState<MeditationConfig>(() => {
    const savedConfig = localStorage.getItem('meditationConfig');
    return savedConfig ? JSON.parse(savedConfig) : defaultConfig;
  });

  // Save to localStorage whenever config changes
  useEffect(() => {
    localStorage.setItem('meditationConfig', JSON.stringify(config));
  }, [config]);
  
  // Validate the selected instruction ID when instructions are loaded
  useEffect(() => {
    if (!instructions.length || !config.selectedInstructionId) {
      return;
    }

    const selectedInstructionExists = instructions.some(
      instruction => instruction.id === config.selectedInstructionId
    );
    
    if (!selectedInstructionExists) {
      console.warn(
        `Selected instruction ID ${config.selectedInstructionId} no longer exists. ` +
        `Resetting to ${instructions.length > 0 ? 'first available instruction' : 'null'}.`
      );
      
      // Reset to first available instruction or null if none available
      setConfig(prevConfig => ({
        ...prevConfig,
        selectedInstructionId: instructions.length > 0 ? instructions[0].id : null
      }));
    }
  }, [config.selectedInstructionId, instructions]);

  // Update configuration (partial updates)
  const updateConfig = (newConfig: Partial<MeditationConfig>) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig
    }));
  };

  // Reset to defaults
  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  return (
    <MeditationConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </MeditationConfigContext.Provider>
  );
};
