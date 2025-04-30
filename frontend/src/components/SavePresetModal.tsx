import React, { useState } from 'react';
import { usePresets } from '../contexts/PresetContext';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  onPresetSaved?: () => void;
}

const SavePresetModal: React.FC<SavePresetModalProps> = ({ isOpen, onClose, onSave, onPresetSaved }) => {
  const { savePreset, isLoading, error } = usePresets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setSaveError('Please enter a preset name');
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const result = await savePreset(name.trim(), description.trim());
      
      if (result) {
        // Reset form and close modal on success
        setName('');
        setDescription('');
        onSave && onSave();
        onPresetSaved && onPresetSaved();
        onClose();
      } else {
        setSaveError('Failed to save preset. Please try again.');
      }
    } catch (err) {
      console.error('Error saving preset:', err);
      setSaveError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setName('');
      setDescription('');
      setSaveError(null);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Save as Preset</h2>
          <button className="close-button" onClick={handleClose} disabled={isSaving}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {saveError && <div className="error-message">{saveError}</div>}
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="preset-name">Preset Name *</label>
              <input 
                id="preset-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Morning Meditation"
                required
                disabled={isSaving}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="preset-description">Description</label>
              <textarea 
                id="preset-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A gentle 15-minute morning meditation with calm voice guidance"
                disabled={isSaving}
                className="form-control"
                rows={3}
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              onClick={handleClose} 
              disabled={isSaving}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving || !name.trim()}
              className="btn btn-primary"
            >
              {isSaving ? 'Saving...' : 'Save Preset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SavePresetModal;