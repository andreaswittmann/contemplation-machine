// AudioService.ts
// Handles all audio functionality for the meditation app

import { getApiUrl } from './ApiService';

// Store the current instruction ID to use for TTS caching
let currentInstructionId: string | null = null;

// Maximum number of retry attempts for audio operations
const MAX_RETRIES = 2;

// Track currently playing audio elements to prevent duplicates
const activeAudio = new Map<string, HTMLAudioElement>();

// Set the current instruction ID (used for caching audio)
export const setCurrentInstructionId = (id: string | null) => {
  console.log(`[AUDIO] Setting current instruction ID to ${id}`);
  currentInstructionId = id;
};

// Function to prevent duplicate playback of the same text
const isAudioPlaying = (id: string): boolean => {
  return activeAudio.has(id);
};

// Function to convert text to speech using backend API
export const textToSpeech = async (
  text: string, 
  voice: string = 'alloy', 
  instructionId?: string, 
  provider: 'openai' | 'elevenlabs' = 'openai',
  retryCount = 0,
  isStartingInstruction = false // Flag for first few instructions
): Promise<Blob> => {
  try {
    // Use the stored instruction ID if not explicitly provided
    const effectiveInstructionId = instructionId || currentInstructionId;
    
    const url = getApiUrl('tts');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text, 
        voice, 
        instructionId: effectiveInstructionId,
        provider,
        isStartingInstruction // Send to the server for analytics tracking
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Server responded with status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error(`[AUDIO] TTS Error (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
    
    // Implement retry logic with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const backoffTime = Math.pow(2, retryCount) * 500; // 500ms, 1000ms, 2000ms
      console.log(`[AUDIO] Retrying TTS in ${backoffTime}ms...`);
      
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          textToSpeech(text, voice, instructionId, provider, retryCount + 1, isStartingInstruction)
            .then(resolve)
            .catch(reject);
        }, backoffTime);
      });
    }
    
    throw error;
  }
};

// Local cache for audio blobs
const audioCache = new Map<string, Blob>();

// Cache for bell sounds - to avoid repeated network requests
const bellSoundsCache = new Map<string, Blob>();

// Function to create an audio player for a blob
export const createAudioFromBlob = (audioBlob: Blob): HTMLAudioElement => {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  return audio;
};

// Helper function to clean up audio URLs
export const revokeAudioUrl = (audio: HTMLAudioElement): void => {
  URL.revokeObjectURL(audio.src);
};

// Function to play bell sounds (start/end)
export const playBell = async (
  type: 'start' | 'end',
  onProgress?: (progress: number) => void
): Promise<void> => {
  // Use a specific ID for bell sounds
  const bellId = `bell-${type}`;
  
  // Prevent duplicate bell sounds
  if (isAudioPlaying(bellId)) {
    console.log(`[AUDIO] Already playing ${type} bell sound. Skipping duplicate.`);
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    try {
      // Check if bell sound is already cached
      const bellCacheKey = `bell-${type}`;
      let bellBlob = bellSoundsCache.get(bellCacheKey);
      
      const setupProgressTracking = (audio: HTMLAudioElement) => {
        // Set up progress tracking
        let lastReportedProgress = 0;
        
        // Set up timeupdate event to track playback progress
        audio.ontimeupdate = () => {
          if (audio.duration > 0) {
            const currentProgress = Math.round((audio.currentTime / audio.duration) * 100);
            
            // Only report progress if it's changed significantly (avoids excessive updates)
            if (currentProgress !== lastReportedProgress && onProgress) {
              lastReportedProgress = currentProgress;
              onProgress(currentProgress);
            }
          }
        };
      };
      
      if (bellBlob) {
        console.log(`[AUDIO] Using cached bell-${type} sound`);
        const audio = createAudioFromBlob(bellBlob);
        
        // Add to active audio map
        activeAudio.set(bellId, audio);
        
        // Set up progress tracking
        setupProgressTracking(audio);
        
        audio.onended = () => {
          activeAudio.delete(bellId);
          // Ensure we report 100% progress when done
          if (onProgress) onProgress(100);
          resolve();
        };
        
        audio.onerror = () => {
          console.error(`Error playing cached ${type} bell sound`);
          activeAudio.delete(bellId);
          if (onProgress) onProgress(100); // End with 100%
          resolve();
        };
        
        audio.play().catch(err => {
          console.error(`Error playing cached ${type} bell:`, err);
          activeAudio.delete(bellId);
          if (onProgress) onProgress(100); // End with 100%
          resolve();
        });
      } else {
        // Fetch the bell sound if not cached
        console.log(`[AUDIO] Fetching bell-${type} sound from server`);
        fetch(`${process.env.PUBLIC_URL}/sounds/bell-${type}.mp3`)
          .then(response => response.blob())
          .then(blob => {
            // Cache the bell sound for future use
            bellSoundsCache.set(bellCacheKey, blob);
            console.log(`[AUDIO] Cached bell-${type} sound for future use`);
            
            // Create and play audio element
            const audio = createAudioFromBlob(blob);
            
            // Add to active audio map
            activeAudio.set(bellId, audio);
            
            // Set up progress tracking
            setupProgressTracking(audio);
            
            audio.onended = () => {
              activeAudio.delete(bellId);
              if (onProgress) onProgress(100); // Ensure we report 100% when done
              resolve();
            };
            
            audio.onerror = () => {
              console.error(`Error playing downloaded ${type} bell sound`);
              activeAudio.delete(bellId);
              if (onProgress) onProgress(100); // End with 100%
              resolve();
            };
            
            audio.play().catch(err => {
              console.error(`Error playing downloaded ${type} bell:`, err);
              activeAudio.delete(bellId);
              if (onProgress) onProgress(100); // End with 100%
              resolve();
            });
          })
          .catch(error => {
            console.error(`Error fetching bell-${type} sound:`, error);
            
            // Fall back to original method if fetch fails
            const audio = new Audio(`${process.env.PUBLIC_URL}/sounds/bell-${type}.mp3`);
            activeAudio.set(bellId, audio);
            
            // Set up progress tracking
            setupProgressTracking(audio);
            
            audio.onended = () => {
              activeAudio.delete(bellId);
              if (onProgress) onProgress(100); // End with 100%
              resolve();
            };
            
            audio.onerror = () => {
              console.error(`Error playing fallback ${type} bell sound`);
              activeAudio.delete(bellId);
              if (onProgress) onProgress(100); // End with 100%
              resolve();
            };
            
            audio.play().catch(err => {
              console.error(`Error playing fallback ${type} bell:`, err);
              activeAudio.delete(bellId);
              if (onProgress) onProgress(100); // End with 100%
              resolve();
            });
          });
      }
    } catch (error) {
      console.error(`Error setting up ${type} bell sound:`, error);
      activeAudio.delete(bellId);
      if (onProgress) onProgress(100); // End with 100% if there's an error
      resolve();
    }
  });
};

// Speak the provided text using TTS
export const speak = async (
  text: string, 
  useOpenAI = true, 
  voice = 'alloy',
  provider: 'openai' | 'elevenlabs' = 'openai'
): Promise<void> => {
  try {
    // Generate a cache key that includes provider
    const cacheKey = `${text}-${useOpenAI ? (provider + '_' + voice) : 'browser'}`;
    
    // Prevent duplicate playback - if this text is already being played, don't play it again
    if (isAudioPlaying(cacheKey)) {
      console.log(`[AUDIO] Already playing: "${text.substring(0, 30)}...". Skipping duplicate.`);
      return Promise.resolve();
    }
    
    // Check if we have this cached already
    let audioBlob = audioCache.get(cacheKey);
    
    // If not cached, generate it
    if (!audioBlob) {
      if (useOpenAI) {
        audioBlob = await textToSpeech(text, voice, undefined, provider);
        
        // Cache the result
        audioCache.set(cacheKey, audioBlob);
      } else {
        // Use browser's built-in speech synthesis
        return new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          window.speechSynthesis.speak(utterance);
        });
      }
    }
    
    // Play the audio blob
    if (audioBlob) {
      const audio = createAudioFromBlob(audioBlob);
      
      // Add to active audio map to prevent duplicates
      activeAudio.set(cacheKey, audio);
      
      return new Promise((resolve) => {
        audio.onended = () => {
          revokeAudioUrl(audio);
          // Remove from active audio when finished
          activeAudio.delete(cacheKey);
          resolve();
        };
        
        audio.onerror = () => {
          revokeAudioUrl(audio);
          activeAudio.delete(cacheKey);
          resolve();
        };
        
        audio.play().catch(err => {
          console.error('Error playing TTS audio:', err);
          revokeAudioUrl(audio);
          activeAudio.delete(cacheKey);
          resolve();
        });
      });
    }
  } catch (error) {
    console.error('Error in speak function:', error);
  }
};

// Pre-generate audio for all instructions to avoid delays during meditation
export const preGenerateSessionAudio = async (
  instructionLines: string[],
  useOpenAI = true,
  voice = 'alloy',
  provider: 'openai' | 'elevenlabs' = 'openai'
): Promise<void> => {
  console.log(`Pre-generating audio for ${instructionLines.length} instructions`);
  try {
    // Generate all TTS in parallel for efficiency
    const promises = instructionLines.map(text => {
      // Generate a cache key that includes provider
      const cacheKey = `${text}-${useOpenAI ? (provider + '_' + voice) : 'browser'}`;
      
      // Skip if already cached
      if (audioCache.has(cacheKey)) {
        console.log(`Audio already cached for: "${text.substring(0, 30)}..."`);
        return Promise.resolve();
      }
      
      if (useOpenAI) {
        return textToSpeech(text, voice, undefined, provider)
          .then(blob => {
            console.log(`Cached audio for: "${text.substring(0, 30)}..."`);
            audioCache.set(cacheKey, blob);
          })
          .catch(error => {
            console.error(`Failed to pre-generate audio for: "${text.substring(0, 30)}..."`, error);
          });
      } else {
        // For browser TTS, we don't need to pre-generate
        return Promise.resolve();
      }
    });
    
    await Promise.all(promises);
    console.log('Audio pre-generation complete');
  } catch (error) {
    console.error('Error pre-generating audio:', error);
  }
};

// Play audio that was pre-generated without re-generating it
export const playPreGeneratedAudio = async (
  text: string, 
  useOpenAI = true, 
  voice = 'alloy',
  provider: 'openai' | 'elevenlabs' = 'openai'
): Promise<void> => {
  try {
    // Generate a cache key that includes provider
    const cacheKey = `${text}-${useOpenAI ? (provider + '_' + voice) : 'browser'}`;
    
    // Prevent duplicate playback - if this text is already being played, don't play it again
    if (isAudioPlaying(cacheKey)) {
      console.log(`[AUDIO] Already playing: "${text.substring(0, 30)}...". Skipping duplicate.`);
      return Promise.resolve();
    }
    
    // Check if we have this cached already
    const audioBlob = audioCache.get(cacheKey);
    
    if (audioBlob) {
      console.log(`Playing cached audio for: "${text.substring(0, 30)}..."`);
      const audio = createAudioFromBlob(audioBlob);
      
      // Add to active audio map to prevent duplicates
      activeAudio.set(cacheKey, audio);
      
      return new Promise((resolve) => {
        audio.onended = () => {
          revokeAudioUrl(audio);
          // Remove from active audio when finished
          activeAudio.delete(cacheKey);
          resolve();
        };
        
        audio.onerror = () => {
          revokeAudioUrl(audio);
          activeAudio.delete(cacheKey);
          resolve();
        };
        
        audio.play().catch(err => {
          console.error('Error playing cached TTS audio:', err);
          revokeAudioUrl(audio);
          activeAudio.delete(cacheKey);
          resolve();
        });
      });
    } else {
      // If not cached (should not happen), fall back to speak method
      console.warn(`Cache miss for: "${text.substring(0, 30)}...". Using speak method as fallback.`);
      return speak(text, useOpenAI, voice, provider);
    }
  } catch (error) {
    console.error('Error in playPreGeneratedAudio function:', error);
    return Promise.resolve();
  }
};

// Check if audio for text is already cached
export const isAudioCached = (
  text: string,
  voice: string = 'alloy',
  provider: 'openai' | 'elevenlabs' = 'openai'
): boolean => {
  // Generate a cache key that includes provider
  const cacheKey = `${text}-${provider}_${voice}`;
  
  // Check if we have this cached already
  const isCached = audioCache.has(cacheKey);
  console.log(`[AUDIO] Cache check for "${text.substring(0, 30)}...": ${isCached ? 'HIT' : 'MISS'}`);
  return isCached;
};

// Fetch available ElevenLabs voices
export const fetchElevenLabsVoices = async (limit?: number): Promise<any> => {
  try {
    // Build URL with optional limit parameter
    let url = getApiUrl('elevenlabs/voices');
    if (limit !== undefined) {
      url += `?limit=${limit}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    throw error;
  }
};

// Cleanup function to revoke any outstanding audio URLs
export const cleanup = (): void => {
  console.log('Cleaning up audio resources');
  // We don't need to do anything specific here
  // as the audio elements handle cleanup in their onended callbacks
};

// Progressive audio pre-generation and background queue
const backgroundAudioQueue: Array<() => Promise<void>> = [];
let isBackgroundQueueRunning = false;

/**
 * Pre-generate audio for the first N instructions, then queue the rest for background generation.
 * @param instructionLines All instruction texts
 * @param preloadCount How many to pre-generate before session starts
 * @param useOpenAI Use OpenAI/ElevenLabs or browser TTS
 * @param voice Voice name or ID
 * @param provider TTS provider
 */
export const preGenerateSessionAudioProgressive = async (
  instructionLines: string[],
  preloadCount: number = 3,
  useOpenAI = true,
  voice = 'alloy',
  provider: 'openai' | 'elevenlabs' = 'openai'
): Promise<void> => {
  if (instructionLines.length === 0) {
    console.log('[AUDIO] No instructions to pre-generate');
    return;
  }

  // Ensure preloadCount doesn't exceed available instructions
  preloadCount = Math.min(preloadCount, instructionLines.length);
  
  console.log(`[AUDIO] Progressive pre-generation strategy: loading ${preloadCount} instruction(s) now, queueing ${instructionLines.length - preloadCount} for background`);
  
  // Pre-generate first N instructions one by one to ensure exact count
  const preload = instructionLines.slice(0, preloadCount);
  const background = instructionLines.slice(preloadCount);

  // Generate exactly preloadCount instructions - not in parallel for better control
  for (const text of preload) {
    const cacheKey = `${text}-${useOpenAI ? (provider + '_' + voice) : 'browser'}`;
    
    // Skip if already cached
    if (audioCache.has(cacheKey)) {
      console.log(`[AUDIO] Already cached: "${text.substring(0, 30)}..."`);
      continue;
    }
    
    if (useOpenAI) {
      try {
        console.log(`[AUDIO] Pre-generating initial instruction: "${text.substring(0, 30)}..."`);
        const blob = await textToSpeech(text, voice, undefined, provider);
        console.log(`[AUDIO] Cached initial instruction: "${text.substring(0, 30)}..."`);
        audioCache.set(cacheKey, blob);
      } catch (error) {
        console.error(`[AUDIO] Failed to pre-generate initial instruction: "${text.substring(0, 30)}..."`, error);
      }
    }
  }

  // Queue the rest for background generation
  background.forEach(text => {
    backgroundAudioQueue.push(() => {
      // Since we're generating one at a time in the background, use a simpler approach
      return new Promise<void>(async (resolve) => {
        const cacheKey = `${text}-${useOpenAI ? (provider + '_' + voice) : 'browser'}`;
        
        // Skip if already cached
        if (audioCache.has(cacheKey)) {
          console.log(`[AUDIO-BG] Already cached: "${text.substring(0, 30)}..."`);
          resolve();
          return;
        }
        
        if (useOpenAI) {
          try {
            console.log(`[AUDIO-BG] Generating background instruction: "${text.substring(0, 30)}..."`);
            const blob = await textToSpeech(text, voice, undefined, provider);
            console.log(`[AUDIO-BG] Cached background instruction: "${text.substring(0, 30)}..."`);
            audioCache.set(cacheKey, blob);
          } catch (error) {
            console.error(`[AUDIO-BG] Failed to pre-generate background instruction: "${text.substring(0, 30)}..."`, error);
          }
        }
        resolve();
      });
    });
  });
  
  // Start background queue processing
  runBackgroundAudioQueue();
};

function runBackgroundAudioQueue() {
  if (isBackgroundQueueRunning) return;
  
  console.log(`[AUDIO-BG] Starting background queue processing for ${backgroundAudioQueue.length} instruction(s)`);
  isBackgroundQueueRunning = true;
  
  const processNext = () => {
    if (backgroundAudioQueue.length === 0) {
      console.log('[AUDIO-BG] Background queue processing complete');
      isBackgroundQueueRunning = false;
      return;
    }
    
    const nextTask = backgroundAudioQueue.shift();
    if (nextTask) {
      nextTask().finally(() => {
        setTimeout(processNext, 300); // Increased delay between tasks to reduce API load
      });
    } else {
      isBackgroundQueueRunning = false;
    }
  };
  
  processNext();
}

// Smart cache management functions

/**
 * Get cache analytics information from the server
 * Shows statistics about cache usage and high priority files
 */
export const getCacheAnalytics = async (): Promise<any> => {
  try {
    const url = getApiUrl('tts/cache/analytics');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting cache analytics:', error);
    throw error;
  }
};

/**
 * Optimize the cache based on priority and age
 * @param maxSizeMB Maximum size in MB to keep the cache under
 * @param maxAgeDays Remove files older than this many days
 * @param keepHighPriority Whether to keep high priority files even if they're old
 */
export const optimizeCache = async (maxSizeMB?: number, maxAgeDays?: number, keepHighPriority: boolean = true): Promise<any> => {
  try {
    const url = getApiUrl('tts/cache/optimize');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxSize: maxSizeMB,
        maxAge: maxAgeDays,
        keepHighPriority
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error optimizing cache:', error);
    throw error;
  }
};

/**
 * Enhance the preGenerateSessionAudioProgressive function to track starting instructions
 */
export const preGenerateSessionAudioProgressiveWithAnalytics = async (
  instructionLines: string[],
  preloadCount: number = 3,
  useOpenAI = true,
  voice = 'alloy',
  provider: 'openai' | 'elevenlabs' = 'openai'
): Promise<void> => {
  if (instructionLines.length === 0) {
    console.log('[AUDIO] No instructions to pre-generate');
    return;
  }

  // Ensure preloadCount doesn't exceed available instructions
  preloadCount = Math.min(preloadCount, instructionLines.length);
  
  console.log(`[AUDIO] Progressive pre-generation strategy: loading ${preloadCount} instruction(s) now, queueing ${instructionLines.length - preloadCount} for background`);
  
  // Pre-generate first N instructions one by one to ensure exact count
  const preload = instructionLines.slice(0, preloadCount);
  const background = instructionLines.slice(preloadCount);

  // Generate exactly preloadCount instructions - marked as starting instructions
  for (const text of preload) {
    const cacheKey = `${text}-${useOpenAI ? (provider + '_' + voice) : 'browser'}`;
    
    // Skip if already cached
    if (audioCache.has(cacheKey)) {
      console.log(`[AUDIO] Already cached: "${text.substring(0, 30)}..."`);
      continue;
    }
    
    if (useOpenAI) {
      try {
        console.log(`[AUDIO] Pre-generating initial instruction: "${text.substring(0, 30)}..."`);
        // Pass true for isStartingInstruction to improve analytics
        const blob = await textToSpeech(text, voice, undefined, provider, 0, true);
        console.log(`[AUDIO] Cached initial instruction: "${text.substring(0, 30)}..."`);
        audioCache.set(cacheKey, blob);
      } catch (error) {
        console.error(`[AUDIO] Failed to pre-generate initial instruction: "${text.substring(0, 30)}..."`, error);
      }
    }
  }

  // Queue the rest for background generation - not marked as starting instructions
  background.forEach(text => {
    backgroundAudioQueue.push(() => {
      return new Promise<void>(async (resolve) => {
        const cacheKey = `${text}-${useOpenAI ? (provider + '_' + voice) : 'browser'}`;
        
        // Skip if already cached
        if (audioCache.has(cacheKey)) {
          console.log(`[AUDIO-BG] Already cached: "${text.substring(0, 30)}..."`);
          resolve();
          return;
        }
        
        if (useOpenAI) {
          try {
            console.log(`[AUDIO-BG] Generating background instruction: "${text.substring(0, 30)}..."`);
            // Pass false for isStartingInstruction
            const blob = await textToSpeech(text, voice, undefined, provider, 0, false);
            console.log(`[AUDIO-BG] Cached background instruction: "${text.substring(0, 30)}..."`);
            audioCache.set(cacheKey, blob);
          } catch (error) {
            console.error(`[AUDIO-BG] Failed to pre-generate background instruction: "${text.substring(0, 30)}..."`, error);
          }
        }
        resolve();
      });
    });
  });
  
  // Start background queue processing
  runBackgroundAudioQueue();
};

export default {
  textToSpeech,
  createAudioFromBlob,
  revokeAudioUrl,
  playBell,
  speak,
  preGenerateSessionAudio,
  setCurrentInstructionId,
  cleanup,
  playPreGeneratedAudio,
  fetchElevenLabsVoices,
  preGenerateSessionAudioProgressive,
  getCacheAnalytics,
  optimizeCache,
  preGenerateSessionAudioProgressiveWithAnalytics,
  isAudioCached
};