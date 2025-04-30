import React, { useState } from 'react';
import { useInstructions } from '../contexts/InstructionsContext';
import InstructionForm from './InstructionForm';
import './InstructionsManager.css';

interface Instruction {
  id: string;
  name: string;
  description: string;
  content: string; // Multi-line text with one instruction per line
  createdAt: string;
  updatedAt?: string;
}

const InstructionsManagerView: React.FC = () => {
  const { instructions, isLoading, error, deleteInstruction } = useInstructions();
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Handle edit button click
  const handleEdit = (instruction: Instruction) => {
    setEditingInstruction(instruction);
    // Scroll to the form
    setTimeout(() => {
      const formElement = document.getElementById('instruction-form');
      formElement?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle delete button click with confirmation
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this instruction file?')) {
      try {
        await deleteInstruction(id);
      } catch (err) {
        console.error('Error deleting instruction file:', err);
      }
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingInstruction(null);
  };

  // Toggle expanded view of instruction content
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Count lines in content
  const countInstructions = (content: string): number => {
    if (!content) return 0;
    return content.split('\n').filter(line => line.trim().length > 0).length;
  };

  return (
    <div className="instructions-manager">
      <h2>Meditation Instructions Manager</h2>
      
      <div id="instruction-form" className="form-section">
        <InstructionForm 
          editingInstruction={editingInstruction}
          onCancelEdit={handleCancelEdit}
        />
      </div>

      <div className="instructions-list-section">
        <h3>Instruction Files</h3>

        {isLoading ? (
          <p>Loading instruction files...</p>
        ) : error ? (
          <p className="error-message">Error: {error}</p>
        ) : instructions.length === 0 ? (
          <p>No instruction files found. Add one below!</p>
        ) : (
          <ul className="instructions-list">
            {instructions.map(instruction => (
              <li key={instruction.id} className="instruction-item">
                <div className="instruction-content">
                  <h4 className="instruction-name">{instruction.name}</h4>
                  {instruction.description && (
                    <p className="instruction-description">{instruction.description}</p>
                  )}

                  <div className="instruction-meta">
                    <span className="instruction-count">
                      {countInstructions(instruction.content)} instructions
                    </span>
                    <span className="date-info">
                      {instruction.updatedAt 
                        ? `Updated: ${formatDate(instruction.updatedAt)}` 
                        : `Created: ${formatDate(instruction.createdAt)}`}
                    </span>
                  </div>

                  <div className="instruction-preview">
                    <button 
                      onClick={() => toggleExpand(instruction.id)}
                      className="toggle-preview-button"
                    >
                      {expandedId === instruction.id ? 'Hide Instructions' : 'Show Instructions'}
                    </button>
                    
                    {expandedId === instruction.id && (
                      <div className="instruction-lines">
                        {instruction.content.split('\n').filter(line => line.trim().length > 0).map((line, index) => (
                          <p key={index} className="instruction-line">
                            {index + 1}. {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="instruction-actions">
                  <button 
                    onClick={() => handleEdit(instruction)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(instruction.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InstructionsManagerView;