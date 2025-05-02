import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useMeditationConfig } from '../contexts/MeditationConfigContext';
import { useInstructions } from '../contexts/InstructionsContext';
import { usePresets } from '../contexts/PresetContext';
import './SessionView.css';

// Browser fullscreen API helpers - using type assertions instead of interface extensions
// This avoids TypeScript interface conflicts
const requestFullscreen = (element: HTMLElement): Promise<void> => {
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  } else if ((element as any).mozRequestFullScreen) {
    return (element as any).mozRequestFullScreen();
  } else if ((element as any).webkitRequestFullscreen) {
    return (element as any).webkitRequestFullscreen();
  } else if ((element as any).msRequestFullscreen) {
    return (element as any).msRequestFullscreen();
  }
  return Promise.reject('Fullscreen API not supported');
};

const exitFullscreen = (): Promise<void> => {
  if (document.exitFullscreen) {
    return document.exitFullscreen();
  } else if ((document as any).mozCancelFullScreen) {
    return (document as any).mozCancelFullScreen();
  } else if ((document as any).webkitExitFullscreen) {
    return (document as any).webkitExitFullscreen();
  } else if ((document as any).msExitFullscreen) {
    return (document as any).msExitFullscreen();
  }
  return Promise.reject('Fullscreen API not supported');
};

const isFullscreenActive = (): boolean => {
  return !!(
    document.fullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).msFullscreenElement
  );
};

const SessionView: React.FC = () => {
  const { session, startSession, pauseSession, resumeSession, stopSession, instructionLines } = useSession();
  const { config, updateConfig } = useMeditationConfig();
  const { instructions } = useInstructions();
  const { presets, loadPreset, currentPreset } = usePresets();
  const [currentInstruction, setCurrentInstruction] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const instructionDisplayRef = useRef<HTMLDivElement>(null);
  const sessionContainerRef = useRef<HTMLDivElement>(null);

  // Function to check if the current configuration matches the loaded preset
  const isConfigMatchingPreset = () => {
    if (!currentPreset) return false;

    return (
      config.duration === currentPreset.config.duration &&
      config.bellAtStart === currentPreset.config.bellAtStart &&
      config.bellAtEnd === currentPreset.config.bellAtEnd &&
      config.useVoiceGuidance === currentPreset.config.useVoiceGuidance &&
      config.voiceType === currentPreset.config.voiceType &&
      config.openaiVoice === currentPreset.config.openaiVoice &&
      config.elevenlabsVoiceId === currentPreset.config.elevenlabsVoiceId &&
      config.selectedInstructionId === currentPreset.config.selectedInstructionId
    );
  };

  // Update selected preset based on current configuration and currentPreset
  useEffect(() => {
    if (currentPreset && isConfigMatchingPreset()) {
      setSelectedPresetId(currentPreset.id);
    } else {
      setSelectedPresetId('custom');
    }
  }, [config, currentPreset]);

  // Handle preset selection change
  const handlePresetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    if (presetId && presetId !== 'custom') {
      await loadPreset(presetId);
    }
  };

  // Calculate the actual instruction count directly from the selected file
  const getInstructionCount = (): number => {
    if (!config.selectedInstructionId) return 0;

    const selectedInstruction = instructions.find(i => i.id === config.selectedInstructionId);
    if (!selectedInstruction) return 0;

    return selectedInstruction.content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .length;
  };

  // Format time remaining as MM:SS
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get the name of the currently selected instruction file
  const getSelectedInstructionName = () => {
    if (!config.selectedInstructionId) return "None";

    const selectedInstruction = instructions.find(
      instruction => instruction.id === config.selectedInstructionId
    );

    return selectedInstruction ?
      (selectedInstruction.isDefault ? `(System) ${selectedInstruction.name}` : selectedInstruction.name)
      : "Unknown";
  };

  // Detect fullscreen changes and update state accordingly
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenState = isFullscreenActive();

      setIsFullscreen(fullscreenState);

      // Add class to body when in fullscreen mode
      if (fullscreenState) {
        document.body.classList.add('body-fullscreen');
      } else {
        document.body.classList.remove('body-fullscreen');
      }
    };

    // Add event listeners for fullscreen change
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Add keyboard event listener for Escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        handleExitFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Clean up event listeners on component unmount
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('body-fullscreen');
    };
  }, [isFullscreen]);

  // Enter fullscreen mode
  const handleEnterFullscreen = useCallback(() => {
    if (sessionContainerRef.current) {
      requestFullscreen(sessionContainerRef.current)
        .catch(error => console.error('Failed to enter fullscreen mode:', error));
    }
  }, []);

  // Exit fullscreen mode
  const handleExitFullscreen = useCallback(() => {
    exitFullscreen()
      .catch(error => console.error('Failed to exit fullscreen mode:', error));
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      handleExitFullscreen();
    } else {
      handleEnterFullscreen();
    }
  }, [isFullscreen, handleEnterFullscreen, handleExitFullscreen]);

  // Update current instruction based on session progress
  useEffect(() => {
    if (!session.isActive) {
      console.log('[VIEW] Session not active, clearing current instruction');
      setCurrentInstruction('');
      return;
    }

    if (instructionLines.length === 0) {
      console.log('[VIEW] No instruction lines available, using default text');
      setCurrentInstruction('Focus on your breath...');
      return;
    }

    // Get the instruction for the current index
    const index = session.currentInstructionIndex;
    if (index >= 0 && index < instructionLines.length) {
      const instruction = instructionLines[index];
      console.log(`[VIEW] Setting current instruction to "${instruction}" (index: ${index})`);
      setCurrentInstruction(instruction);

      // Ensure text is properly displayed by adjusting container if needed
      if (instructionDisplayRef.current) {
        const container = instructionDisplayRef.current;
        const textLength = instruction.length;

        // Dynamically adjust styles based on text length
        if (textLength > 200) {
          container.classList.add('long-text');
        } else if (textLength > 100) {
          container.classList.add('medium-text');
        } else {
          container.classList.remove('long-text', 'medium-text');
        }
      }
    } else {
      console.log(`[VIEW] Invalid instruction index ${index}, using default text`);
      setCurrentInstruction('Focus on your breath...');
    }
  }, [session.isActive, session.currentInstructionIndex, instructionLines]);

  // Get the actual instruction count
  const actualInstructionCount = getInstructionCount();

  // If instructionLines.length and actualInstructionCount differ, log it for debugging
  useEffect(() => {
    if (instructionLines.length !== actualInstructionCount && config.selectedInstructionId) {
      console.log('[VIEW] Instruction count mismatch:', {
        'instructionLines.length': instructionLines.length,
        'actualInstructionCount': actualInstructionCount,
        'selectedInstructionId': config.selectedInstructionId
      });
    }
  }, [instructionLines.length, actualInstructionCount, config.selectedInstructionId]);

  // Log the current state for debugging
  useEffect(() => {
    console.log('[VIEW] Current state:', {
      isActive: session.isActive,
      isPaused: session.isPaused,
      currentInstructionIndex: session.currentInstructionIndex,
      progress: session.progress,
      instructionLinesCount: instructionLines.length,
      currentInstruction,
      isFullscreen
    });
  }, [session.isActive, session.isPaused, session.currentInstructionIndex, session.progress, instructionLines.length, currentInstruction, isFullscreen]);

  // Calculate container class based on session state
  const getContainerClasses = () => {
    const classes = ['session-view', 'harmonized'];

    if (session.isActive) {
      classes.push('active-contemplation');
    }

    if (isFullscreen) {
      classes.push('fullscreen');
    }

    return classes.join(' ');
  };

  return (
    <div className={getContainerClasses()} ref={sessionContainerRef}>
      {session.isPreparingAudio ? (
        <div className="preparing-session harmonized-card">
          <h2>Preparing Your Session</h2>
          <div className="loading-spinner"></div>
          <p>Loading audio resources...</p>
        </div>
      ) : session.isBellPlaying ? (
        <div className="bell-playing-screen harmonized-card">
          <h2>Contemplation is starting...</h2>
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${session.bellProgress}%` }}
              ></div>
            </div>
            <div className="breath-text">Take a deep breath...</div>
          </div>
        </div>
      ) : !session.isActive ? (
        <div className="session-start harmonized-card">
          <h2 className="section-title">Ready to Contemplate</h2>

          <div className="preset-selector">
            <label htmlFor="presetSelect" className="form-label">Contemplation Preset:</label>
            <select
              id="presetSelect"
              value={selectedPresetId}
              onChange={handlePresetChange}
              className="preset-dropdown form-select"
              aria-label="Select contemplation preset"
            >
              <option value="custom">Custom configuration</option>
              {presets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.isDefault ? `(System) ${preset.name}` : preset.name}
                </option>
              ))}
            </select>
          </div>

          <p className="duration-display">Duration: {config.duration} minutes</p>

          {config.selectedInstructionId && (
            <div className="selected-instruction-info info-card">
              <p>
                Selected instruction file: <strong>
                  {getSelectedInstructionName()}
                </strong>
              </p>
              <p className="instruction-count">
                {actualInstructionCount} instructions will be presented during your session
              </p>
            </div>
          )}

          <div className="audio-settings-summary info-card">
            <p className="settings-title"><strong>Audio Settings:</strong></p>
            <ul className="settings-list">
              <li>Start Bell: <span className="setting-value">{config.bellAtStart ? 'Enabled' : 'Disabled'}</span></li>
              <li>End Bell: <span className="setting-value">{config.bellAtEnd ? 'Enabled' : 'Disabled'}</span></li>
              <li>
                Voice Guidance: <span className="setting-value">{config.useVoiceGuidance ? (
                  <>
                    Enabled ({config.voiceType === 'browser' ? 'Browser TTS' :
                      config.voiceType === 'openai' ? `OpenAI (${config.openaiVoice})` :
                      `ElevenLabs`})
                  </>
                ) : 'Disabled'}</span>
              </li>
            </ul>
          </div>

          <button
            className="start-button primary-button"
            onClick={() => {
              console.log('[VIEW] Start button clicked');
              startSession();
            }}
            aria-label="Begin contemplation session"
          >
            Begin Session
          </button>
        </div>
      ) : (
        <div className="active-session harmonized-card">
          {isFullscreen && (
            <button
              className="exit-fullscreen-btn"
              onClick={handleExitFullscreen}
              aria-label="Exit fullscreen mode"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}

          <div className="timer-display">
            <h2 className="section-title">Time Remaining</h2>
            <div className="time">{formatTimeRemaining(session.timeRemaining)}</div>

            <div className="progress-container" role="progressbar"
              aria-valuenow={Math.round(session.progress)}
              aria-valuemin={0}
              aria-valuemax={100}>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${session.progress}%` }}
                ></div>
              </div>
              <div className="progress-percentage">{Math.round(session.progress)}%</div>
            </div>
          </div>

          <div className="instruction-display" ref={instructionDisplayRef}>
            <div className="current-instruction">
              <p className="instruction-text">{currentInstruction || "Focus on your breath..."}</p>
            </div>

            {instructionLines.length > 0 && (
              <div className="instruction-progress">
                <div className="instruction-counter">
                  Instruction {session.currentInstructionIndex + 1} of {instructionLines.length}
                </div>

                <div className="instruction-dots" role="navigation" aria-label="Instruction progress">
                  {instructionLines.map((_, index) => (
                    <span
                      key={index}
                      className={`instruction-dot ${index === session.currentInstructionIndex ? 'active' :
                        index < session.currentInstructionIndex ? 'completed' : ''}`}
                      aria-label={`Instruction ${index + 1} ${index === session.currentInstructionIndex ? '(current)' :
                        index < session.currentInstructionIndex ? '(completed)' : '(upcoming)'}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="session-controls">
            {session.isPaused ? (
              <button
                className="resume-button control-button"
                onClick={resumeSession}
                aria-label="Resume contemplation session"
              >
                Resume
              </button>
            ) : (
              <button
                className="pause-button control-button"
                onClick={pauseSession}
                aria-label="Pause contemplation session"
              >
                Pause
              </button>
            )}
            <button
              className="stop-button control-button"
              onClick={stopSession}
              aria-label="End contemplation session"
            >
              End Session
            </button>

            <button
              className="fullscreen-button control-button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionView;
