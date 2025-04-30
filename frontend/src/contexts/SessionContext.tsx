import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useMeditationConfig } from './MeditationConfigContext';
import { useInstructions } from './InstructionsContext';
import * as AudioService from '../services/AudioService';
import { apiGet, getApiUrl } from '../services/ApiService';

// Interface for session state
interface SessionState {
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number; // in seconds
  progress: number; // percentage 0-100
  startTime: number | null;
  pausedAt: number | null;
  currentInstructionIndex: number;
  isPreparingAudio: boolean;
  isBellPlaying: boolean; // Added to track when the bell is playing
  bellProgress: number; // Progress percentage of the bell sound (0-100)
}

// Default session state
const defaultSessionState: SessionState = {
  isActive: false,
  isPaused: false,
  timeRemaining: 0,
  progress: 0,
  startTime: null,
  pausedAt: null,
  currentInstructionIndex: 0,
  isPreparingAudio: false,
  isBellPlaying: false,
  bellProgress: 0
};

// Context interface
interface SessionContextType {
  session: SessionState;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
  instructionLines: string[];
  loadInstructionDirectly: (id: string) => void;
}

// Create context with default values
const SessionContext = createContext<SessionContextType>({
  session: defaultSessionState,
  startSession: () => {},
  pauseSession: () => {},
  resumeSession: () => {},
  stopSession: () => {},
  instructionLines: [],
  loadInstructionDirectly: () => {},
});

// Custom hook for accessing the session
export const useSession = () => useContext(SessionContext);

// Provider component
export const SessionProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [session, setSession] = useState<SessionState>(defaultSessionState);
  const { config } = useMeditationConfig();
  const { instructions, fetchInstructions, isLoading: instructionsLoading } = useInstructions();
  const [timerId, setTimerId] = useState<number | null>(null);
  const [instructionLines, setInstructionLines] = useState<string[]>([]);
  
  // This function allows direct loading of an instruction file by ID
  // Useful when the instructions array is not yet populated but we know the ID
  const loadInstructionDirectly = (id: string) => {
    console.log('[DIRECT-LOAD] Attempting to load instruction directly with ID:', id);
    
    // First check if it's already in our instructions array
    const instructionFile = instructions.find(i => i.id === id);
    
    if (instructionFile) {
      console.log('[DIRECT-LOAD] Found instruction in memory:', instructionFile.name);
      parseInstructionContent(instructionFile.content);
    } else {
      // If not found, try to fetch it directly from the backend
      console.log('[DIRECT-LOAD] Instruction not found in memory, fetching from backend');
      apiGet<any>(`instructions/${id}`)
        .then(data => {
          console.log('[DIRECT-LOAD] Successfully loaded instruction:', data);
          parseInstructionContent(data.content);
        })
        .catch(err => {
          console.error('[DIRECT-LOAD] Error loading instruction:', err);
        });
    }
  };
  
  // Helper function to parse and set instruction content
  const parseInstructionContent = (content: string) => {
    if (!content) {
      console.log('[PARSE] Empty content provided, setting empty lines');
      setInstructionLines([]);
      return;
    }
    
    const lines = content
      .split('\n')
      .filter(line => line.trim().length > 0);
    
    console.log('[PARSE] Parsed instruction lines:', lines);
    setInstructionLines(lines);
  };
  
  // Load instruction lines from the selected file
  useEffect(() => {
    console.log('[INSTRUCTIONS] Loading instructions with selectedId:', config.selectedInstructionId);
    console.log('[INSTRUCTIONS] Available instructions:', instructions.map(i => ({ id: i.id, name: i.name })));
    
    // Set the current instruction ID in the AudioService
    AudioService.setCurrentInstructionId(config.selectedInstructionId);
    
    if (!config.selectedInstructionId) {
      console.log('[INSTRUCTIONS] No instruction file selected, clearing instruction lines');
      setInstructionLines([]);
      return;
    }

    const selectedFile = instructions.find(i => i.id === config.selectedInstructionId);
    console.log('[INSTRUCTIONS] Selected file:', selectedFile ? { id: selectedFile.id, name: selectedFile.name } : 'NOT FOUND');
    
    if (selectedFile) {
      parseInstructionContent(selectedFile.content);
    } else {
      console.log('[INSTRUCTIONS] Selected file not found, attempting direct load');
      // Try to fetch this specific instruction
      loadInstructionDirectly(config.selectedInstructionId);
    }
  }, [config.selectedInstructionId, instructions]);

  // Clean up timer and audio resources on unmount
  useEffect(() => {
    return () => {
      if (timerId !== null) {
        window.clearInterval(timerId);
      }
      AudioService.cleanup();
    };
  }, [timerId]);

  // Debug effect to monitor instruction lines changes
  useEffect(() => {
    console.log('[INSTRUCTIONS] Current instruction lines in state:', instructionLines);
  }, [instructionLines]);

  // Speak the current instruction if voice guidance is enabled
  const speakInstruction = async (instructionIndex: number) => {
    console.log(`[SPEAK] Attempting to speak instruction at index ${instructionIndex}`, 
      instructionIndex < instructionLines.length ? instructionLines[instructionIndex] : 'OUT OF BOUNDS'
    );
    
    if (!config.useVoiceGuidance || instructionIndex >= instructionLines.length) {
      console.log('[SPEAK] Skipping speech - voice guidance disabled or index out of bounds');
      return;
    }
    
    try {
      const text = instructionLines[instructionIndex];
      console.log(`[SPEAK] Speaking instruction: "${text}" using ${config.voiceType}${config.voiceType === 'openai' ? ` (${config.openaiVoice})` : ''}${config.voiceType === 'elevenlabs' ? ` (${config.elevenlabsVoiceId})` : ''}`);
      
      // Determine which voice provider to use
      const useApi = config.voiceType === 'openai' || config.voiceType === 'elevenlabs';
      const voice = config.voiceType === 'openai' ? config.openaiVoice : 
                    config.voiceType === 'elevenlabs' ? config.elevenlabsVoiceId : 'alloy';
      const provider = config.voiceType === 'elevenlabs' ? 'elevenlabs' : 'openai';
      
      // Use pre-generated audio if available, or generate new audio
      await AudioService.playPreGeneratedAudio(text, useApi, voice, provider)
        .catch(error => {
          console.error('[SPEAK-ERROR] Failed to play audio:', error);
          // Attempt fallback to browser speech if API-based TTS fails
          if (useApi) {
            console.log('[SPEAK-RECOVERY] Attempting fallback to browser speech');
            return AudioService.speak(text, false);
          }
        });
    } catch (error) {
      console.error('[SPEAK] Error speaking instruction:', error);
    }
  };

  // Start a new meditation session
  const startSession = async () => {
    try {
      console.log('[SESSION] Starting session with instruction lines:', instructionLines);
      
      // If we have a selectedInstructionId but no instruction lines, try to fetch them directly
      if (config.selectedInstructionId && instructionLines.length === 0) {
        console.log('[SESSION] No instruction lines loaded yet, attempting to load before starting session');
        
        // Start preparing audio indication
        setSession(prev => ({
          ...prev,
          isPreparingAudio: true
        }));
        
        // Try to fetch the instructions first
        try {
          await fetchInstructions();
          // Give a moment for the instructions to be processed
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try direct loading as a backup
          if (instructions.length === 0) {
            loadInstructionDirectly(config.selectedInstructionId);
            // Give time for direct loading
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Check if we have instructions after all attempts
          if (instructionLines.length === 0) {
            throw new Error('Could not load meditation instructions');
          }
        } catch (e) {
          console.error('[SESSION] Error fetching instructions before session start:', e);
          // Display user-friendly error message
          setSession(prev => ({
            ...prev,
            isPreparingAudio: false,
            error: 'Failed to load meditation instructions. Please try again or select a different instruction file.'
          }));
          return; // Prevent session from starting
        }
      }
      
      // Check if we need to prepare audio at all - this is the new optimization
      let needsAudioPreparation = false;
      
      // Only prepare audio if using voice guidance and we have instructions
      if (config.useVoiceGuidance && 
          (config.voiceType === 'openai' || config.voiceType === 'elevenlabs') && 
          instructionLines.length > 0) {
            
        // Check with the AudioService if the first instruction is already cached
        const firstInstruction = instructionLines[0];
        const voice = config.voiceType === 'openai' ? config.openaiVoice : config.elevenlabsVoiceId;
        const provider = config.voiceType === 'elevenlabs' ? 'elevenlabs' : 'openai';
        
        // First instruction is the most critical for quick start
        const isFirstInstructionCached = AudioService.isAudioCached(firstInstruction, voice, provider);
        
        needsAudioPreparation = !isFirstInstructionCached;
        console.log(`[SESSION] First instruction cached: ${isFirstInstructionCached}, needs preparation: ${needsAudioPreparation}`);
      }
      
      // Set preparing state to show loading indicator only if needed
      if (needsAudioPreparation) {
        setSession(prev => ({
          ...prev,
          isPreparingAudio: true,
          error: null // Clear any previous errors
        }));
        
        // Progressive pre-generation: only first instruction before session start
        if (config.useVoiceGuidance && (config.voiceType === 'openai' || config.voiceType === 'elevenlabs') && instructionLines.length > 0) {
          console.log(`[SESSION] Progressive pre-generation for ${config.voiceType} TTS`);
          const useApi = true;
          const voice = config.voiceType === 'openai' ? config.openaiVoice : config.elevenlabsVoiceId;
          const provider = config.voiceType === 'elevenlabs' ? 'elevenlabs' : 'openai';
          await AudioService.preGenerateSessionAudioProgressive(
            instructionLines,
            1, // Preload only the first instruction
            useApi,
            voice,
            provider
          );
        }
      } else {
        console.log('[SESSION] Skipping audio preparation - using cached audio');
      }
      
      // Play start bell if configured
      if (config.bellAtStart) {
        console.log('[SESSION] Playing start bell');
        
        // Set bell playing state to show the bell progress screen
        setSession(prev => ({
          ...prev,
          isBellPlaying: true,
          bellProgress: 0,
          isPreparingAudio: false  // Ensure preparation screen is hidden
        }));
        
        // Play the bell and track its progress
        await AudioService.playBell('start', (progress) => {
          // Update the bell progress in the session state
          setSession(prev => ({
            ...prev,
            bellProgress: progress
          }));
        });
        
        // Bell finished playing, reset bell playing state
        setSession(prev => ({
          ...prev,
          isBellPlaying: false
        }));
      }
      
      const durationInSeconds = config.duration * 60;
      setSession({
        isActive: true,
        isPaused: false,
        timeRemaining: durationInSeconds,
        progress: 0,
        startTime: Date.now(),
        pausedAt: null,
        currentInstructionIndex: 0,
        isPreparingAudio: false,
        isBellPlaying: false,  // Add missing property
        bellProgress: 0        // Add missing property
      });

      // Important: Store the instruction lines in a closure-local variable to ensure
      // we use the current value in setInterval, not a stale value
      const currentInstructionLines = [...instructionLines];
      console.log('[SESSION] Starting with instruction lines (closure copy):', currentInstructionLines);

      // Determine if this is the first run or a subsequent run (using cached audio)
      const isFirstRun = needsAudioPreparation;
      
      // Speak the first instruction after an appropriate delay
      // Use a shorter delay for subsequent runs when audio is already cached
      if (currentInstructionLines.length > 0) {
        // Adjust the delay based on whether this is the first run or subsequent run
        const speakDelay = isFirstRun ? 2000 : 500; // 2 seconds for first run, 0.5 seconds for subsequent runs
        console.log(`[SESSION] Will speak first instruction after ${speakDelay}ms delay`);
        
        setTimeout(() => {
          console.log('[SESSION] Speaking first instruction now');
          speakInstruction(0);
        }, speakDelay); 
      } else {
        console.log('[SESSION] No instructions to speak');
      }

      // Set up interval to update time remaining
      const id = window.setInterval(() => {
        setSession(prevSession => {
          if (!prevSession.isActive || prevSession.isPaused) return prevSession;
          
          const newTimeRemaining = Math.max(0, prevSession.timeRemaining - 1);
          const totalDuration = config.duration * 60;
          const elapsedSeconds = totalDuration - newTimeRemaining;
          const newProgress = Math.min(100, (elapsedSeconds / totalDuration) * 100);
          
          // Calculate which instruction to display based on elapsed time
          // This ensures instructions are evenly distributed throughout the session
          let newInstructionIndex = 0;
          
          if (currentInstructionLines.length > 0) {
            // Calculate how many seconds each instruction should be displayed
            const secondsPerInstruction = totalDuration / currentInstructionLines.length;
            
            // Calculate current instruction based on elapsed time
            newInstructionIndex = Math.min(
              Math.floor(elapsedSeconds / secondsPerInstruction), 
              currentInstructionLines.length - 1
            );
            
            // Only log when instruction changes
            if (newInstructionIndex !== prevSession.currentInstructionIndex) {
              console.log('[INSTRUCTION-UPDATE] Updating instruction index', {
                previousIndex: prevSession.currentInstructionIndex,
                newIndex: newInstructionIndex,
                elapsedSeconds,
                totalDuration,
                secondsPerInstruction,
                instructionCount: currentInstructionLines.length,
                newInstruction: currentInstructionLines[newInstructionIndex]
              });
            }
          }
          
          // Speak the instruction if it changed
          if (newInstructionIndex > prevSession.currentInstructionIndex && config.useVoiceGuidance) {
            console.log(`[INSTRUCTION-UPDATE] Instruction changed from ${prevSession.currentInstructionIndex} to ${newInstructionIndex}`);
            speakInstruction(newInstructionIndex);
          }
          
          // Check if session is complete
          if (newTimeRemaining === 0) {
            console.log('[SESSION] Session complete');
            window.clearInterval(id);
            // Play end bell if configured
            if (config.bellAtEnd) {
              AudioService.playBell('end');
            }
          }
          
          return {
            ...prevSession,
            timeRemaining: newTimeRemaining,
            progress: newProgress,
            currentInstructionIndex: newInstructionIndex
          };
        });
      }, 1000);

      setTimerId(id);
    } catch (error) {
      console.error('[SESSION] Error starting session:', error);
      // Reset session state if there was an error
      setSession({
        ...defaultSessionState,
        isPreparingAudio: false
      });
    }
  };

  // Pause the current session
  const pauseSession = () => {
    setSession(prev => ({
      ...prev,
      isPaused: true,
      pausedAt: Date.now(),
    }));
  };

  // Resume the current session
  const resumeSession = () => {
    setSession(prev => ({
      ...prev,
      isPaused: false,
      pausedAt: null,
    }));
  };

  // Stop the session completely
  const stopSession = () => {
    if (timerId !== null) {
      window.clearInterval(timerId);
      setTimerId(null);
    }
    setSession(defaultSessionState);
  };

  return (
    <SessionContext.Provider value={{ 
      session, 
      startSession, 
      pauseSession, 
      resumeSession, 
      stopSession,
      instructionLines,
      loadInstructionDirectly
    }}>
      {children}
    </SessionContext.Provider>
  );
};
