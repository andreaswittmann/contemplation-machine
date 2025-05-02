import React, { useState, useEffect } from 'react';
import { Preset } from '../contexts/PresetContext';

interface EditPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: Preset | null;
  onSave: (presetId: string, updates: { name: string, description: string }) => Promise<any>;
}

const EditPresetModal: React.FC<EditPresetModalProps> = ({ isOpen, onClose, preset, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preset) {
      setName(preset.name);
      setDescription(preset.description);
    }
  }, [preset]);

  if (!isOpen || !preset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a preset name');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const result = await onSave(preset.id, { 
        name: name.trim(), 
        description: description.trim() 
      });
      
      if (result) {
        onClose();
      } else {
        setError('Failed to update preset. Please try again.');
      }
    } catch (err) {
      console.error('Error updating preset:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setError(null);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Preset</h2>
          <button className="close-button" onClick={handleClose} disabled={isSaving}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
              {isSaving ? 'Saving...' : 'Update Preset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPresetModal;