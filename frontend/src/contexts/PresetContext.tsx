import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useMeditationConfig, MeditationConfig } from './MeditationConfigContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/ApiService';

// Define the shape of a preset
export interface Preset {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  config: MeditationConfig;
  voiceDisplayName?: string;
  isDefault?: boolean;
}

// Context interface
interface PresetContextType {
  presets: Preset[];
  isLoading: boolean;
  error: string | null;
  currentPreset: Preset | null; // Add currentPreset to track loaded preset
  loadPresets: () => Promise<Preset[]>;
  savePreset: (name: string, description: string) => Promise<Preset | null>;
  loadPreset: (presetId: string) => Promise<boolean>;
  updatePreset: (presetId: string, updates: Partial<Preset>) => Promise<Preset | null>;
  deletePreset: (presetId: string) => Promise<boolean>;
  clearCurrentPreset: () => void; // Add method to clear current preset
}

// Create the context with default values
const PresetContext = createContext<PresetContextType>({
  presets: [],
  isLoading: false,
  error: null,
  currentPreset: null,
  loadPresets: async () => [],
  savePreset: async () => null,
  loadPreset: async () => false,
  updatePreset: async () => null,
  deletePreset: async () => false,
  clearCurrentPreset: () => {}
});

// Custom hook for accessing preset context
export const usePresets = () => useContext(PresetContext);

// Provider component
export const PresetProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { config, updateConfig } = useMeditationConfig();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null);

  // Load all presets from the API
  const loadPresets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiGet<Preset[]>('presets');
      setPresets(data);
      console.log(`Loaded ${data.length} presets successfully`);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load presets';
      console.error('Error loading presets:', err);
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Save current configuration as a new preset
  const savePreset = async (name: string, description: string): Promise<Preset | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const newPreset = await apiPost<Preset>('presets', {
        name,
        description,
        config // Current configuration from MeditationConfigContext
      });
      
      // Update local state
      setPresets(prev => [...prev, newPreset]);
      console.log('Preset saved successfully:', newPreset);
      return newPreset;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preset';
      console.error('Error saving preset:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Load a preset and apply it to the current configuration
  const loadPreset = async (presetId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const preset = await apiGet<Preset>(`presets/${presetId}`);
      
      // Apply preset configuration to current configuration
      updateConfig(preset.config);
      // Set as current preset
      setCurrentPreset(preset);
      console.log('Preset loaded successfully:', preset);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preset';
      console.error('Error loading preset:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing preset
  const updatePreset = async (presetId: string, updates: Partial<Preset>): Promise<Preset | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedPreset = await apiPut<Preset>(`presets/${presetId}`, updates);
      
      // Update local state
      setPresets(prev => 
        prev.map(preset => preset.id === presetId ? updatedPreset : preset)
      );
      console.log('Preset updated successfully:', updatedPreset);
      return updatedPreset;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preset';
      console.error('Error updating preset:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a preset
  const deletePreset = async (presetId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await apiDelete(`presets/${presetId}`);
      
      // Update local state
      setPresets(prev => prev.filter(preset => preset.id !== presetId));
      console.log(`Preset ${presetId} deleted successfully`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete preset';
      console.error('Error deleting preset:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear the current preset
  const clearCurrentPreset = () => {
    setCurrentPreset(null);
  };

  // Load presets on initial render
  useEffect(() => {
    loadPresets();
  }, []);

  return (
    <PresetContext.Provider value={{ 
      presets, 
      isLoading, 
      error,
      currentPreset,
      loadPresets, 
      savePreset, 
      loadPreset, 
      updatePreset, 
      deletePreset,
      clearCurrentPreset 
    }}>
      {children}
    </PresetContext.Provider>
  );
};