import React, { useState } from 'react';
import { useMeditationConfig, OpenAIVoice } from '../contexts/MeditationConfigContext';
import { useInstructions } from '../contexts/InstructionsContext';
import { useElevenLabsVoices } from '../contexts/ElevenLabsVoicesContext';
import { usePresets } from '../contexts/PresetContext';
import SavePresetModal from './SavePresetModal';
import PresetList from './PresetList';
import { format } from 'date-fns';

const ConfigurationView: React.FC = () => {
  const { config, updateConfig } = useMeditationConfig();
  const { instructions, isLoading } = useInstructions();
  const { voices: elevenLabsVoices, isLoading: isLoadingVoices } = useElevenLabsVoices();
  const { presets, loadPresets, currentPreset, updatePreset, clearCurrentPreset, loadPreset } = usePresets();
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isPresetListOpen, setIsPresetListOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');

  // Function to handle successful preset save
  const handlePresetSaved = () => {
    loadPresets(); // Refresh the presets list
  };

  // Handle preset selection change
  const handlePresetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    if (presetId === 'custom') {
      clearCurrentPreset();
    } else {
      await loadPreset(presetId);
    }
    setSelectedPresetId(presetId);
  };

  // Function to handle updating the current preset with new settings
  const handleUpdatePreset = async () => {
    if (!currentPreset) return;
    
    setIsUpdating(true);
    try {
      await updatePreset(currentPreset.id, {
        config,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating preset:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Update selected preset based on current configuration and currentPreset
  React.useEffect(() => {
    if (currentPreset) {
      setSelectedPresetId(currentPreset.id);
    } else {
      setSelectedPresetId('custom');
    }
  }, [currentPreset]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (err) {
      return 'Unknown date';
    }
  };

  // OpenAI voice descriptions
  const openAIVoiceDescriptions: Record<OpenAIVoice, string> = {
    alloy: 'Alloy - Versatile, balanced voice',
    echo: 'Echo - Clear, confident voice',
    fable: 'Fable - Warm, soft-spoken voice',
    onyx: 'Onyx - Deep, authoritative voice',
    nova: 'Nova - Bright, friendly voice',
    shimmer: 'Shimmer - Gentle, soothing voice'
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    updateConfig({ [name]: checked });
  };

  // Handle duration change
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ duration: parseInt(e.target.value, 10) });
  };

  // Handle instruction file change
  const handleInstructionFileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateConfig({
      selectedInstructionId: value === "none" ? null : value
    });
  };

  // Handle voice type change
  const handleVoiceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateConfig({ voiceType: e.target.value as 'browser' | 'openai' | 'elevenlabs' });
  };

  // Handle OpenAI voice change
  const handleOpenAIVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateConfig({ openaiVoice: e.target.value as OpenAIVoice });
  };

  // Handle ElevenLabs voice change
  const handleElevenLabsVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateConfig({
      elevenlabsVoiceId: e.target.value
    });
  };

  return (
    <div className="configuration-view">
      <h2>Configure Your Meditation Session</h2>
      
      <div className="config-section preset-controls">
        <div className="preset-selector">
          <label htmlFor="presetSelect">Meditation Preset:</label>
          <select
            id="presetSelect"
            value={selectedPresetId}
            onChange={handlePresetChange}
            className="preset-dropdown"
          >
            <option value="custom">Custom configuration</option>
            {presets.map(preset => (
              <option 
                key={preset.id} 
                value={preset.id}
                className={preset.isDefault ? 'system-item' : ''}
              >
                {preset.isDefault ? `(System) ${preset.name}` : preset.name}
              </option>
            ))}
          </select>
        </div>

        <div className="preset-buttons">
          <button 
            className="btn btn-primary" 
            onClick={() => setIsPresetModalOpen(true)}
          >
            Save as New Preset
          </button>
          {currentPreset && (
            <>
              <button 
                className="btn btn-primary"
                onClick={handleUpdatePreset}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update Preset'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  clearCurrentPreset();
                  setSelectedPresetId('custom');
                }}
                disabled={isUpdating}
              >
                Clear
              </button>
            </>
          )}
        </div>

        {currentPreset && currentPreset.description && (
          <div className="preset-description">
            <p>{currentPreset.description}</p>
            <span className="last-updated">Last updated: {formatDate(currentPreset.updatedAt)}</span>
          </div>
        )}
      </div>

      <div className="config-section">
        <label htmlFor="duration">
          <strong>Duration:</strong> {config.duration} minutes
        </label>
        <input
          type="range"
          id="duration"
          name="duration"
          min="1"
          max="60"
          value={config.duration}
          onChange={handleDurationChange}
        />
      </div>

      <div className="config-section">
        <h3>Instruction File</h3>
        <div className="select-group">
          <label htmlFor="instructionFile">Select instruction file:</label>
          {isLoading ? (
            <p>Loading instruction files...</p>
          ) : (
            <select
              id="instructionFile"
              value={config.selectedInstructionId || "none"}
              onChange={handleInstructionFileChange}
            >
              <option value="none">None (Silent meditation)</option>
              {instructions.map(instruction => (
                <option 
                  key={instruction.id} 
                  value={instruction.id}
                  className={instruction.isDefault ? 'system-item' : ''}
                >
                  {instruction.isDefault ? `(System) ${instruction.name}` : instruction.name} ({instruction.content.split('\n').filter(l => l.trim()).length} instructions)
                </option>
              ))}
            </select>
          )}
          {!instructions.length && !isLoading && (
            <p className="config-note">No instruction files available. Create one in the Instructions tab.</p>
          )}
        </div>
      </div>
      
      <div className="config-section">
        <h3>Sound Settings</h3>
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              name="bellAtStart"
              checked={config.bellAtStart}
              onChange={handleCheckboxChange}
            />
            Play bell at start
          </label>
        </div>
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              name="bellAtEnd"
              checked={config.bellAtEnd}
              onChange={handleCheckboxChange}
            />
            Play bell at end
          </label>
        </div>
      </div>
      
      <div className="config-section">
        <h3>Guidance Settings</h3>
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              name="useVoiceGuidance"
              checked={config.useVoiceGuidance}
              onChange={handleCheckboxChange}
            />
            Enable voice guidance
          </label>
        </div>
        
        {config.useVoiceGuidance && (
          <>
            <div className="select-group">
              <label htmlFor="voiceType">Voice Provider:</label>
              <select
                id="voiceType"
                value={config.voiceType}
                onChange={handleVoiceTypeChange}
              >
                <option value="browser">Browser TTS</option>
                <option value="openai">OpenAI TTS</option>
                <option value="elevenlabs">ElevenLabs TTS</option>
              </select>
            </div>
            
            {config.voiceType === 'openai' && (
              <div className="select-group">
                <label htmlFor="openaiVoice">OpenAI Voice:</label>
                <select
                  id="openaiVoice"
                  value={config.openaiVoice}
                  onChange={handleOpenAIVoiceChange}
                >
                  {Object.entries(openAIVoiceDescriptions).map(([value, description]) => (
                    <option key={value} value={value}>
                      {description}
                    </option>
                  ))}
                </select>
                <p className="voice-note">
                  Listen to voice samples on <a href="https://platform.openai.com/docs/guides/text-to-speech" 
                     target="_blank" rel="noopener noreferrer">OpenAI's website</a>
                </p>
              </div>
            )}
          </>
        )}
        
        {config.voiceType === 'elevenlabs' && (
          <div className="select-group">
            <label htmlFor="elevenlabsVoice">ElevenLabs Voice:</label>
            {isLoadingVoices ? (
              <p>Loading ElevenLabs voices...</p>
            ) : (
              <>
                <select
                  id="elevenlabsVoice"
                  value={config.elevenlabsVoiceId || (elevenLabsVoices.length > 0 ? elevenLabsVoices[0].voice_id : '')}
                  onChange={handleElevenLabsVoiceChange}
                >
                  {elevenLabsVoices.map(voice => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
                <p className="voice-note">
                  Listen to voice samples on <a href="https://elevenlabs.io/text-to-speech" 
                     target="_blank" rel="noopener noreferrer">ElevenLabs website</a>
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add modals for preset functionality */}
      <SavePresetModal 
        isOpen={isPresetModalOpen} 
        onClose={() => setIsPresetModalOpen(false)} 
        onPresetSaved={handlePresetSaved}
      />
      
      <PresetList 
        isOpen={isPresetListOpen}
        onClose={() => setIsPresetListOpen(false)}
      />
    </div>
  );
};

export default ConfigurationView;
