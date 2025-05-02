import React, { useState, useEffect } from 'react';
import { useMeditationConfig, OpenAIVoice, defaultConfig } from '../contexts/MeditationConfigContext';
import { useSession } from '../contexts/SessionContext';
import { useInstructions } from '../contexts/InstructionsContext';
import { useElevenLabsVoices } from '../contexts/ElevenLabsVoicesContext';
import { usePresets } from '../contexts/PresetContext';
import { useNavigation } from '../App';
import PresetList from './PresetList';
import SavePresetModal from './SavePresetModal';
import EditPresetModal from './EditPresetModal';
import { ErrorBanner } from './ErrorBanner';

const ConfigurationView: React.FC = () => {
  const { config, updateConfig, resetConfig } = useMeditationConfig();
  const { startSession } = useSession();
  const { instructions, fetchInstructions } = useInstructions();
  const { voices: elevenLabsVoices } = useElevenLabsVoices();
  const { presets, savePreset, loadPreset, updatePreset, currentPreset, clearCurrentPreset } = usePresets();
  const { setActiveTab } = useNavigation();
  
  // Component state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isSavePresetFormOpen, setIsSavePresetFormOpen] = useState(false);
  const [isEditPresetModalOpen, setIsEditPresetModalOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [currentPresetDescription, setCurrentPresetDescription] = useState<string>('');

  // Load instructions on mount - removed fetchInstructions from dependency array to prevent infinite loop
  useEffect(() => {
    fetchInstructions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update description when preset changes
  useEffect(() => {
    if (selectedPresetId) {
      const preset = presets.find(p => p.id === selectedPresetId);
      if (preset) {
        setCurrentPresetDescription(preset.description);
      }
    } else {
      setCurrentPresetDescription('');
    }
  }, [selectedPresetId, presets]);

  // Handle preset selection
  const handlePresetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    setSelectedPresetId(presetId);
    if (presetId) {
      await loadPreset(presetId);
    }
  };

  // Check if the currently selected preset is a system preset
  const isSystemPreset = selectedPresetId && presets.find(p => p.id === selectedPresetId)?.isDefault === true;

  // Handle configuration changes
  const handleDurationChange = (value: string) => {
    const duration = parseInt(value);
    if (!isNaN(duration) && duration > 0) {
      updateConfig({ duration });
    }
  };

  const handleDurationPreset = (minutes: number) => {
    updateConfig({ duration: minutes });
  };

  const handleUseVoiceGuidance = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ useVoiceGuidance: e.target.checked });
  };

  const handleVoiceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceType = e.target.value as 'browser' | 'openai' | 'elevenlabs';
    updateConfig({ voiceType });
  };

  const handleOpenAIVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateConfig({ openaiVoice: e.target.value as OpenAIVoice });
  };

  const handleElevenLabsVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateConfig({ elevenlabsVoiceId: e.target.value });
  };

  const handleInstructionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateConfig({ selectedInstructionId: e.target.value });
  };

  // Separate handlers for bell sounds at start and end
  const handleBellAtStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ bellAtStart: e.target.checked });
  };

  const handleBellAtEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ bellAtEnd: e.target.checked });
  };

  // Function to handle starting a contemplation session
  const handleStartSession = () => {
    if (!config.selectedInstructionId) {
      setErrorMessage("Please select an instruction file before starting your session.");
      return;
    }
    
    if (config.useVoiceGuidance && config.voiceType === 'elevenlabs' && !config.elevenlabsVoiceId) {
      setErrorMessage("Please select an ElevenLabs voice or choose a different voice provider.");
      return;
    }
    
    setErrorMessage(null);
    startSession();
    // Switch to the contemplate tab
    setActiveTab('contemplate');
  };

  // Render the voice selection based on the selected voice type
  const renderVoiceSelection = () => {
    switch (config.voiceType) {
      case 'browser':
        return (
          <div className="form-group">
            <p>Using browser's default text-to-speech voice</p>
          </div>
        );
      case 'openai':
        return (
          <div className="form-group">
            <label htmlFor="openaiVoiceSelect">OpenAI Voice:</label>
            <select
              id="openaiVoiceSelect"
              value={config.openaiVoice}
              onChange={handleOpenAIVoiceChange}
              className="form-control"
            >
              <option value="alloy">Alloy - Versatile, balanced voice</option>
              <option value="echo">Echo - Clear, confident voice</option>
              <option value="fable">Fable - Warm, soft-spoken voice</option>
              <option value="onyx">Onyx - Deep, authoritative voice</option>
              <option value="nova">Nova - Bright, friendly voice</option>
              <option value="shimmer">Shimmer - Gentle, soothing voice</option>
            </select>
          </div>
        );
      case 'elevenlabs':
        return (
          <div className="form-group">
            <label htmlFor="elevenLabsVoiceSelect">ElevenLabs Voice:</label>
            <select
              id="elevenLabsVoiceSelect"
              value={config.elevenlabsVoiceId || ""}
              onChange={handleElevenLabsVoiceChange}
              className="form-control"
            >
              <option value="" disabled>Select an ElevenLabs voice</option>
              {elevenLabsVoices.length > 0 ? (
                elevenLabsVoices.map(voice => (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading voices...</option>
              )}
            </select>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="configuration-view">
      <h2>Configure Your Contemplation Session</h2>
      
      <div className="config-section">
        <h3>Preset</h3>
        <div className="select-group">
          <label htmlFor="presetSelect">Contemplation Preset:</label>
          <select
            id="presetSelect"
            onChange={handlePresetChange}
            className="form-control"
            value={selectedPresetId}
          >
            <option value="" disabled>Select a preset</option>
            {presets.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.isDefault ? `(System) ${preset.name}` : preset.name}
              </option>
            ))}
          </select>
        </div>

        {currentPresetDescription && (
          <div className="preset-description">
            <p>{currentPresetDescription}</p>
          </div>
        )}
        
        <div className="preset-controls-row">
          <button 
            onClick={() => setIsPresetModalOpen(true)}
            className="btn-manage"
            title="Access advanced preset management including System Default Settings"
          >
            Advanced
          </button>
          <button 
            onClick={() => {
              if (currentPreset && selectedPresetId) {
                updatePreset(selectedPresetId, { config });
              } else {
                setErrorMessage("No preset selected to update");
              }
            }}
            className="btn-update"
            disabled={!currentPreset || !selectedPresetId || !!isSystemPreset}
            title={isSystemPreset ? "System presets cannot be modified" : "Update the selected preset with current settings"}
          >
            Update
          </button>
          <button 
            onClick={() => {
              if (currentPreset && selectedPresetId && !isSystemPreset) {
                setIsEditPresetModalOpen(true);
              } else {
                setErrorMessage("No preset selected to edit or the preset is a system preset");
              }
            }}
            className="btn-edit"
            disabled={!currentPreset || !selectedPresetId || !!isSystemPreset}
            title={isSystemPreset ? "System presets cannot be modified" : "Edit preset name and description"}
          >
            Edit
          </button>
          <button 
            onClick={() => setIsSavePresetFormOpen(true)}
            className="btn-save"
            title="Save current settings as a new preset"
          >
            Save New
          </button>
          <button 
            onClick={() => {
              resetConfig();
              clearCurrentPreset();
              setSelectedPresetId('');
            }}
            className="btn-clear"
            title="Reset all settings to default values"
          >
            Clear
          </button>
        </div>
      </div>
      
      {errorMessage && <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} />}
      
      <div className="config-section">
        <h3>Duration</h3>
        <div className="duration-control">
          <div className="duration-slider-input">
            <input
              type="range"
              min="1"
              max="120"
              value={config.duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="duration-slider"
              aria-label="Contemplation duration in minutes"
            />
            <input
              type="number"
              min="1"
              max="120"
              value={config.duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="duration-number"
            />
            <span className="duration-unit">min</span>
          </div>
          
          <div className="duration-presets">
            <button className="btn-small" onClick={() => handleDurationPreset(5)}>5 min</button>
            <button className="btn-small" onClick={() => handleDurationPreset(10)}>10 min</button>
            <button className="btn-small" onClick={() => handleDurationPreset(15)}>15 min</button>
            <button className="btn-small" onClick={() => handleDurationPreset(20)}>20 min</button>
            <button className="btn-small" onClick={() => handleDurationPreset(30)}>30 min</button>
            <button className="btn-small" onClick={() => handleDurationPreset(45)}>45 min</button>
            <button className="btn-small" onClick={() => handleDurationPreset(60)}>1 hour</button>
          </div>
        </div>
      </div>
      
      <div className="config-section">
        <h3>Guidance</h3>
        <div className="select-group">
          <label htmlFor="instructionSelect">Instruction File:</label>
          <select
            id="instructionSelect"
            value={config.selectedInstructionId || ""}
            onChange={handleInstructionChange}
            className="form-control"
          >
            <option value="" disabled>Select an instruction file</option>
            {instructions.map(instruction => (
              <option key={instruction.id} value={instruction.id}>
                {instruction.isDefault ? `(System) ${instruction.name}` : instruction.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="voiceGuidanceCheck"
            checked={config.useVoiceGuidance}
            onChange={handleUseVoiceGuidance}
          />
          <label htmlFor="voiceGuidanceCheck">Use voice guidance</label>
        </div>
        
        {config.useVoiceGuidance && (
          <>
            <div className="select-group">
              <label htmlFor="voiceTypeSelect">Voice Provider:</label>
              <select
                id="voiceTypeSelect"
                value={config.voiceType}
                onChange={handleVoiceTypeChange}
                className="form-control"
              >
                <option value="browser">Browser (Free)</option>
                <option value="openai">OpenAI (Requires API key)</option>
                <option value="elevenlabs">ElevenLabs (Requires API key)</option>
              </select>
            </div>
            
            {renderVoiceSelection()}
          </>
        )}
        
        <div className="bell-sounds-section">
          <h4>Bell Sounds</h4>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="bellAtStartCheck"
              checked={config.bellAtStart}
              onChange={handleBellAtStartChange}
            />
            <label htmlFor="bellAtStartCheck">Play bell sound at start</label>
          </div>
          
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="bellAtEndCheck"
              checked={config.bellAtEnd}
              onChange={handleBellAtEndChange}
            />
            <label htmlFor="bellAtEndCheck">Play bell sound at end</label>
          </div>
        </div>
      </div>
      
      <button
        className="start-button primary-button"
        onClick={handleStartSession}
        disabled={!config.selectedInstructionId}
      >
        Begin Contemplation
      </button>
      
      {isPresetModalOpen && (
        <PresetList 
          isOpen={isPresetModalOpen} 
          onClose={() => setIsPresetModalOpen(false)}
        />
      )}
      
      {isSavePresetFormOpen && (
        <SavePresetModal
          isOpen={isSavePresetFormOpen}
          onClose={() => setIsSavePresetFormOpen(false)}
          onSave={savePreset}
          currentConfig={config}
        />
      )}

      {isEditPresetModalOpen && currentPreset && (
        <EditPresetModal
          isOpen={isEditPresetModalOpen}
          onClose={() => setIsEditPresetModalOpen(false)}
          preset={currentPreset}
          onSave={updatePreset}
        />
      )}
    </div>
  );
};

export default ConfigurationView;
