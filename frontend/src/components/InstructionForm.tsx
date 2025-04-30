import React, { useState, useEffect } from 'react';
import { useInstructions } from '../contexts/InstructionsContext';

interface Instruction {
  id: string;
  name: string;
  description: string;
  content: string; // Multi-line text with one instruction per line
  createdAt: string;
  updatedAt?: string;
}

interface InstructionFormProps {
  editingInstruction: Instruction | null;
  onCancelEdit?: () => void;
}

const InstructionForm: React.FC<InstructionFormProps> = ({ 
  editingInstruction = null,
  onCancelEdit
}) => {
  const { addInstruction, updateInstruction, isLoading } = useInstructions();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Update form when editingInstruction changes
  useEffect(() => {
    if (editingInstruction) {
      setName(editingInstruction.name);
      setDescription(editingInstruction.description);
      setContent(editingInstruction.content);
    } else {
      // Reset form when not editing
      setName('');
      setDescription('');
      setContent('');
    }
  }, [editingInstruction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setMessage({ text: 'Please enter a name for the instruction file', type: 'error' });
      return;
    }

    if (!content.trim()) {
      setMessage({ text: 'Please enter instruction content', type: 'error' });
      return;
    }

    try {
      if (editingInstruction) {
        // Update existing instruction file
        await updateInstruction(editingInstruction.id, {
          name: name.trim(),
          description: description.trim(),
          content: content.trim()
        });
        
        setMessage({ text: 'Instruction file updated successfully!', type: 'success' });
        
        // Clear editing state after update
        if (onCancelEdit) {
          onCancelEdit();
        }
      } else {
        // Add new instruction file
        await addInstruction({
          name: name.trim(),
          description: description.trim(),
          content: content.trim()
        });
        
        // Reset form after adding
        setName('');
        setDescription('');
        setContent('');
        setMessage({ text: 'Instruction file added successfully!', type: 'success' });
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        text: `Failed to ${editingInstruction ? 'update' : 'add'} instruction file. Please try again.`,
        type: 'error'
      });
    }
  };

  const handleCancel = () => {
    if (onCancelEdit) {
      onCancelEdit();
    }
    setName('');
    setDescription('');
    setContent('');
  };

  return (
    <div className="instruction-form">
      <h3>{editingInstruction ? 'Edit Meditation Instruction File' : 'Add New Meditation Instruction File'}</h3>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="instruction-name">Name:</label>
          <input
            type="text"
            id="instruction-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name for this instruction set"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="instruction-description">Description (optional):</label>
          <input
            type="text"
            id="instruction-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a brief description"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="instruction-content">
            Instructions (one per line):
            <div className="form-help">Each line will be presented as a separate instruction during meditation</div>
          </label>
          <textarea
            id="instruction-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Focus on your breath...
Notice any sensations in your body...
Let thoughts come and go without judgment..."
            rows={8}
            required
          />
        </div>
        
        <div className="form-buttons">
          <button 
            type="submit" 
            className="primary-button"
            disabled={isLoading || !name.trim() || !content.trim()}
          >
            {isLoading 
              ? (editingInstruction ? 'Updating...' : 'Adding...') 
              : (editingInstruction ? 'Update Instruction File' : 'Add Instruction File')}
          </button>
          
          {editingInstruction && (
            <button 
              type="button" 
              className="cancel-button" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default InstructionForm;
