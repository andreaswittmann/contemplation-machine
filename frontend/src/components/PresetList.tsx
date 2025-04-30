import React, { useState } from 'react';
import { usePresets } from '../contexts/PresetContext';
import { format } from 'date-fns';

interface PresetListProps {
  isOpen: boolean;
  onClose: () => void;
}

const PresetList: React.FC<PresetListProps> = ({ isOpen, onClose }) => {
  const { presets, isLoading, error, loadPreset, deletePreset, loadPresets } = usePresets();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [promotionId, setPromotionId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRefresh = () => {
    loadPresets();
  };

  const handleLoadPreset = async (presetId: string) => {
    setActionInProgress(presetId);
    setLocalError(null);
    
    try {
      const success = await loadPreset(presetId);
      if (success) {
        onClose(); // Close the modal on successful load
      } else {
        setLocalError('Failed to load preset. Please try again.');
      }
    } catch (err) {
      console.error('Error loading preset:', err);
      setLocalError('An unexpected error occurred. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };
  
  const handleDeletePreset = async (presetId: string) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this preset? This action cannot be undone.')) {
      return;
    }
    
    setActionInProgress(presetId);
    setLocalError(null);
    
    try {
      const success = await deletePreset(presetId);
      if (!success) {
        setLocalError('Failed to delete preset. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting preset:', err);
      setLocalError('An unexpected error occurred. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };
  
  const handlePromoteToDefault = async (presetId: string) => {
    // Confirm promotion
    if (!window.confirm('Promote this preset to a default preset? This will make it available to all users of the application.')) {
      return;
    }
    
    setPromotionId(presetId);
    setLocalError(null);
    
    try {
      const response = await fetch(`/api/presets/${presetId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to promote preset');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the presets list to show updated status
        await loadPresets();
      } else {
        setLocalError('Failed to promote preset. Please try again.');
      }
    } catch (err) {
      console.error('Error promoting preset:', err);
      setLocalError('An unexpected error occurred. Please try again.');
    } finally {
      setPromotionId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (err) {
      return 'Unknown date';
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content preset-list-modal">
        <div className="modal-header">
          <h2>Meditation Presets</h2>
          <div className="modal-actions">
            <button className="btn-icon" onClick={handleRefresh} title="Refresh presets">
              🔄
            </button>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>
        
        <div className="modal-body">
          {(error || localError) && (
            <div className="error-message">{error || localError}</div>
          )}
          
          {isLoading ? (
            <div className="loading">Loading presets...</div>
          ) : presets.length === 0 ? (
            <div className="no-presets-message">
              <p>No presets saved yet.</p>
              <p>Configure your meditation settings and click "Save as Preset" to create one.</p>
            </div>
          ) : (
            <div className="preset-list">
              {presets.map((preset) => (
                <div 
                  key={preset.id} 
                  className={`preset-item staggered-item ${preset.isDefault ? 'system-item' : ''}`}
                >
                  <div className="preset-details">
                    <h3 className="preset-name">
                      {preset.isDefault ? `(System) ${preset.name}` : preset.name}
                    </h3>
                    {preset.description && (
                      <p className="preset-description">{preset.description}</p>
                    )}
                    <div className="preset-meta">
                      <span>{preset.config.duration} min</span>
                      <span>•</span>
                      <span>
                        {preset.config.useVoiceGuidance 
                          ? preset.voiceDisplayName 
                            ? `Voice: ${preset.voiceDisplayName}`
                            : `Voice: ${preset.config.voiceType === 'openai' 
                                ? preset.config.openaiVoice 
                                : preset.config.voiceType === 'elevenlabs' 
                                  ? 'ElevenLabs'
                                  : 'Browser'}`
                          : 'No voice guidance'}
                      </span>
                      <span>•</span>
                      <span>Created: {formatDate(preset.createdAt)}</span>
                    </div>
                  </div>
                  <div className="preset-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleLoadPreset(preset.id)}
                      disabled={actionInProgress === preset.id}
                    >
                      {actionInProgress === preset.id ? 'Loading...' : 'Load'}
                    </button>
                    {/* Always show the Promote button for testing */}
                    <button
                      className="btn btn-secondary"
                      onClick={() => handlePromoteToDefault(preset.id)}
                      disabled={promotionId === preset.id}
                    >
                      {promotionId === preset.id ? 'Promoting...' : 'Promote to Default'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeletePreset(preset.id)}
                      disabled={actionInProgress === preset.id}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default PresetList;