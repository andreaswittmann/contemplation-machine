import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/ApiService';

// Define the instruction file interface
interface Instruction {
  id: string;
  name: string;
  description: string;
  content: string; // Multi-line text with one instruction per line
  createdAt: string;
  updatedAt?: string;
}

interface InstructionsContextType {
  instructions: Instruction[];
  isLoading: boolean;
  error: string | null;
  fetchInstructions: () => Promise<void>;
  addInstruction: (instruction: Omit<Instruction, 'id' | 'createdAt'>) => Promise<void>;
  updateInstruction: (id: string, instruction: Partial<Omit<Instruction, 'id' | 'createdAt'>>) => Promise<void>;
  deleteInstruction: (id: string) => Promise<void>;
}

// Create context with default values
const InstructionsContext = createContext<InstructionsContextType>({
  instructions: [],
  isLoading: false,
  error: null,
  fetchInstructions: async () => {},
  addInstruction: async () => {},
  updateInstruction: async () => {},
  deleteInstruction: async () => {},
});

// Custom hook for accessing instructions
export const useInstructions = () => useContext(InstructionsContext);

// Provider component
export const InstructionsProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Function to fetch instructions from API
  const fetchInstructions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching instructions from backend...');
      const data = await apiGet<Instruction[]>('instructions');
      
      console.log('Successfully fetched instructions:', data);
      setInstructions(data);

      // If we had empty data but expected some, log a warning
      if (data.length === 0) {
        console.warn('Backend returned empty instructions array. This might cause issues if you expect instructions.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching instructions');
      console.error('Error fetching instructions:', err);
      
      // Increment retry count to trigger a retry
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  // If we have no instructions and had an error, retry loading a few times
  useEffect(() => {
    if (retryCount > 0 && retryCount < 3 && instructions.length === 0) {
      console.log(`Retrying instruction fetch (attempt ${retryCount})...`);
      const timer = setTimeout(() => {
        fetchInstructions();
      }, 1000 * retryCount); // Increasing backoff time
      
      return () => clearTimeout(timer);
    }
  }, [retryCount, instructions.length]);

  // Load instructions on initial render
  useEffect(() => {
    fetchInstructions();
  }, []);

  // For debugging - log when instructions change
  useEffect(() => {
    console.log('Instructions updated in context:', instructions);
  }, [instructions]);

  // Function to add a new instruction file
  const addInstruction = async (instruction: Omit<Instruction, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newInstruction = await apiPost<Instruction>('instructions', instruction);
      setInstructions(prev => [...prev, newInstruction]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while adding instruction file');
      console.error('Error adding instruction:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update an existing instruction file
  const updateInstruction = async (id: string, instructionUpdate: Partial<Omit<Instruction, 'id' | 'createdAt'>>) => {
    setIsLoading(true);
    setError(null);
    
    // Optimistic update
    const originalInstructions = [...instructions];
    const instructionIndex = instructions.findIndex(i => i.id === id);
    
    if (instructionIndex !== -1) {
      const updatedInstructions = [...instructions];
      updatedInstructions[instructionIndex] = {
        ...updatedInstructions[instructionIndex],
        ...instructionUpdate
      };
      setInstructions(updatedInstructions);
    }
    
    try {
      const updatedInstruction = await apiPut<Instruction>(`instructions/${id}`, instructionUpdate);
      
      // Ensure UI is consistent with server response
      setInstructions(prev => 
        prev.map(instruction => 
          instruction.id === id ? updatedInstruction : instruction
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating instruction file');
      console.error('Error updating instruction:', err);
      // Revert to original state if there was an error
      setInstructions(originalInstructions);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete an instruction file
  const deleteInstruction = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    // Optimistic update
    const originalInstructions = [...instructions];
    setInstructions(prev => prev.filter(instruction => instruction.id !== id));
    
    try {
      await apiDelete(`instructions/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting instruction file');
      console.error('Error deleting instruction:', err);
      // Revert to original state if there was an error
      setInstructions(originalInstructions);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <InstructionsContext.Provider 
      value={{ 
        instructions, 
        isLoading, 
        error, 
        fetchInstructions, 
        addInstruction,
        updateInstruction,
        deleteInstruction
      }}
    >
      {children}
    </InstructionsContext.Provider>
  );
};
