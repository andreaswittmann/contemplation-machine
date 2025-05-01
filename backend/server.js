const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Debug logging function
const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  if (data) {
    console.log(logMessage, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  } else {
    console.log(logMessage);
  }
};

debugLog('Starting Meditation App server');

// Directory paths
const dataDir = path.join(__dirname, 'data');
const defaultsDir = path.join(__dirname, 'defaults');
const audioCacheDir = path.join(dataDir, 'audio-cache');
const presetsDir = path.join(dataDir, 'presets');
const instructionsPath = path.join(dataDir, 'instructions.json');
const defaultInstructionsPath = path.join(defaultsDir, 'instructions.json');
const defaultPresetsPath = path.join(defaultsDir, 'presets.json');

// CORS and middleware configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));

app.use(express.json());

// Add additional headers to all responses for cross-device compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Ensure directories exist
fs.ensureDirSync(dataDir);
fs.ensureDirSync(audioCacheDir);
fs.ensureDirSync(presetsDir);

// Ensure default audio cache is copied to data/audio-cache if it doesn't exist
const defaultAudioCacheDir = path.join(defaultsDir, 'audio-cache');

// DEBUG: Check if directories exist and log their contents
console.log('Default audio cache directory:', defaultAudioCacheDir);
console.log('Default audio cache exists:', fs.existsSync(defaultAudioCacheDir));
if (fs.existsSync(defaultAudioCacheDir)) {
  console.log('Default audio cache files:', fs.readdirSync(defaultAudioCacheDir).length);
}

console.log('Target audio cache directory:', audioCacheDir);
console.log('Target audio cache exists:', fs.existsSync(audioCacheDir));
if (fs.existsSync(audioCacheDir)) {
  console.log('Target audio cache files:', fs.readdirSync(audioCacheDir).length);
}

// Copy default audio files while preserving existing files
try {
  console.log('Starting smart copy of audio cache (preserving existing files)...');
  fs.ensureDirSync(audioCacheDir);
  
  // Get list of default audio files
  const defaultAudioFiles = fs.existsSync(defaultAudioCacheDir) ? 
    fs.readdirSync(defaultAudioCacheDir) : [];
    
  // Get list of existing audio files
  const existingAudioFiles = fs.existsSync(audioCacheDir) ?
    fs.readdirSync(audioCacheDir) : [];
    
  // Create a set for faster lookups
  const existingFileSet = new Set(existingAudioFiles);
  
  // Copy each missing file from defaults to data
  let filesCopied = 0;
  defaultAudioFiles.forEach(audioFile => {
    // Only copy if this file doesn't already exist
    if (!existingFileSet.has(audioFile)) {
      const sourcePath = path.join(defaultAudioCacheDir, audioFile);
      const destPath = path.join(audioCacheDir, audioFile);
      
      // Copy the file
      fs.copySync(sourcePath, destPath);
      filesCopied++;
    }
  });
  
  console.log(`Audio cache initialization complete. Copied ${filesCopied} new files while preserving existing ones.`);
} catch (error) {
  console.error('Error copying audio cache:', error);
}

// Ensure default presets and instructions are copied to data directory if they don't exist
if (!fs.existsSync(instructionsPath)) {
  console.log('Copying default instructions to data directory...');
  fs.copySync(defaultInstructionsPath, instructionsPath);
  console.log('Default instructions copied successfully.');
}

if (!fs.existsSync(presetsDir) || fs.readdirSync(presetsDir).length === 0) {
  console.log('Copying default presets to data directory...');
  fs.copySync(path.join(defaultsDir, 'presets'), presetsDir);
  console.log('Default presets copied successfully.');
}

// Helper function to merge defaults with user data
const mergeWithDefaults = (userItems, defaultItems) => {
  const mergedItems = [...defaultItems];
  
  // Add non-duplicate user items
  userItems.forEach(userItem => {
    if (!mergedItems.some(defaultItem => defaultItem.id === userItem.id)) {
      mergedItems.push(userItem);
    }
  });
  
  return mergedItems;
};

// Initialize or update instructions with defaults
const initializeInstructions = () => {
  try {
    let userInstructions = [];
    let defaultInstructions = [];

    // Load default instructions
    if (fs.existsSync(defaultInstructionsPath)) {
      defaultInstructions = fs.readJsonSync(defaultInstructionsPath);
      debugLog(`Loaded ${defaultInstructions.length} default instructions`);
    }

    // Load user instructions if they exist
    if (fs.existsSync(instructionsPath)) {
      userInstructions = fs.readJsonSync(instructionsPath);
      debugLog(`Loaded ${userInstructions.length} user instructions`);
    }

    // Merge instructions, keeping user customizations
    const mergedInstructions = mergeWithDefaults(userInstructions, defaultInstructions);
    
    // Save merged instructions
    fs.writeJsonSync(instructionsPath, mergedInstructions, { spaces: 2 });
    debugLog(`Saved ${mergedInstructions.length} merged instructions`);

    return mergedInstructions;
  } catch (error) {
    debugLog(`Error initializing instructions: ${error.message}`, error);
    return [];
  }
};

// Initialize or update presets with defaults
const initializePresets = () => {
  try {
    // Check both the JSON file and the presets directory for defaults
    let defaultPresets = [];
    const defaultPresetsDir = path.join(defaultsDir, 'presets');
    
    // First, check if there are individual preset files in defaults/presets
    if (fs.existsSync(defaultPresetsDir)) {
      debugLog(`Looking for default presets in directory: ${defaultPresetsDir}`);
      const presetFiles = fs.readdirSync(defaultPresetsDir).filter(file => file.endsWith('.json'));
      
      if (presetFiles.length > 0) {
        debugLog(`Found ${presetFiles.length} preset files in defaults/presets directory`);
        
        // Load each preset from its individual file
        presetFiles.forEach(file => {
          try {
            const presetPath = path.join(defaultPresetsDir, file);
            const preset = fs.readJsonSync(presetPath);
            defaultPresets.push(preset);
            debugLog(`Loaded default preset from file: ${file}`);
          } catch (err) {
            debugLog(`Error reading preset file ${file}: ${err.message}`);
          }
        });
      }
    }
    
    // Then, load presets from the JSON file as a fallback
    if (defaultPresets.length === 0 && fs.existsSync(defaultPresetsPath)) {
      debugLog(`No presets found in directory, loading from JSON file: ${defaultPresetsPath}`);
      defaultPresets = fs.readJsonSync(defaultPresetsPath);
    }
    
    debugLog(`Loaded ${defaultPresets.length} default presets`);

    // Copy default presets to user presets directory if they don't exist
    defaultPresets.forEach(preset => {
      const presetPath = path.join(presetsDir, `${preset.id}.json`);
      if (!fs.existsSync(presetPath)) {
        fs.writeJsonSync(presetPath, preset, { spaces: 2 });
        debugLog(`Created default preset: ${preset.name}`);
      }
    });

    return true;
  } catch (error) {
    debugLog(`Error initializing presets: ${error.message}`, error);
    return false;
  }
};

// Initialize defaults on server startup
debugLog('Initializing default configurations...');
initializeInstructions();
initializePresets();

// ElevenLabs API base URL
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Define OpenAI voice descriptions
const openAIVoiceDescriptions = {
  'alloy': 'Alloy - Versatile, balanced voice',
  'echo': 'Echo - Clear, confident voice',
  'fable': 'Fable - Warm, soft-spoken voice',
  'onyx': 'Onyx - Deep, authoritative voice',
  'nova': 'Nova - Bright, friendly voice',
  'shimmer': 'Shimmer - Gentle, soothing voice'
};

// Create a mapping of instruction IDs to their cached audio files
let instructionAudioMap = {};

// Track usage analytics for instructions
let cacheAnalytics = {
  accessCount: {}, // Track how many times each audio file is accessed
  lastAccessed: {}, // Track when each audio file was last accessed
  priorityScores: {}, // Store calculated priority scores for each audio file
  instructionFrequency: {}, // Track which instructions are used most frequently
  startingInstructions: {}, // Track which instructions are commonly used at the start
};

// Load cache analytics from disk if exists
const cacheAnalyticsPath = path.join(dataDir, 'cache-analytics.json');
try {
  if (fs.existsSync(cacheAnalyticsPath)) {
    cacheAnalytics = fs.readJsonSync(cacheAnalyticsPath);
    console.log(`Loaded cache analytics data with ${Object.keys(cacheAnalytics.accessCount).length} entries`);
  } else {
    // Initialize and save empty analytics file
    fs.writeJsonSync(cacheAnalyticsPath, cacheAnalytics, { spaces: 2 });
    console.log('Created new cache analytics file');
  }
} catch (error) {
  console.error('Error loading cache analytics:', error);
}

// Helper functions
const generateAudioFileHash = (text, voice, provider = 'openai') => {
  const hash = crypto.createHash('md5');
  hash.update(`${text}_${voice}_${provider}`);
  return hash.digest('hex');
};

const getCachedAudioPath = (text, voice, provider = 'openai') => {
  const hash = generateAudioFileHash(text, voice, provider);
  return path.join(audioCacheDir, `${hash}.mp3`);
};

const getCachedAudio = (text, voice, provider = 'openai') => {
  const audioPath = getCachedAudioPath(text, voice, provider);
  if (fs.existsSync(audioPath)) {
    return audioPath;
  }
  return null;
};

// Function to save cache analytics to disk
const saveCacheAnalytics = () => {
  try {
    fs.writeJsonSync(cacheAnalyticsPath, cacheAnalytics, { spaces: 2 });
  } catch (error) {
    console.error('Error saving cache analytics:', error);
  }
};

// Calculate priority score for audio file based on analytics
const calculatePriorityScore = (audioHash) => {
  const now = Date.now();
  const accessCount = cacheAnalytics.accessCount[audioHash] || 0;
  const lastAccessed = cacheAnalytics.lastAccessed[audioHash] || 0;
  const daysSinceLastAccess = (now - lastAccessed) / (1000 * 60 * 60 * 24);
  
  // Formula: accessCount * (recency factor)
  // Higher access count and more recent access results in higher score
  const recencyFactor = Math.max(0.1, 1 - (daysSinceLastAccess / 30)); // Decays over 30 days
  
  // Calculate final score
  const score = accessCount * recencyFactor;
  
  // Store the calculated score
  cacheAnalytics.priorityScores[audioHash] = score;
  
  return score;
};

// Update cache analytics when audio is accessed
const updateCacheAnalytics = (audioHash, instructionId, isStartingInstruction = false) => {
  // Update access count
  if (!cacheAnalytics.accessCount[audioHash]) {
    cacheAnalytics.accessCount[audioHash] = 0;
  }
  cacheAnalytics.accessCount[audioHash]++;
  
  // Update last accessed timestamp
  cacheAnalytics.lastAccessed[audioHash] = Date.now();
  
  // Update instruction frequency if instructionId is provided
  if (instructionId) {
    if (!cacheAnalytics.instructionFrequency[instructionId]) {
      cacheAnalytics.instructionFrequency[instructionId] = 0;
    }
    cacheAnalytics.instructionFrequency[instructionId]++;
    
    // Track starting instructions
    if (isStartingInstruction) {
      if (!cacheAnalytics.startingInstructions[instructionId]) {
        cacheAnalytics.startingInstructions[instructionId] = 0;
      }
      cacheAnalytics.startingInstructions[instructionId]++;
    }
  }
  
  // Recalculate priority score
  calculatePriorityScore(audioHash);
  
  // Save analytics to disk (debounced to reduce disk writes)
  clearTimeout(saveAnalyticsTimeout);
  saveAnalyticsTimeout = setTimeout(saveCacheAnalytics, 5000); // Save after 5 seconds of inactivity
};

// Debounce timer for saving analytics
let saveAnalyticsTimeout = null;

// Function to invalidate cached audio for specific instruction content
const invalidateInstructionCache = (instructionId) => {
  // If we have tracked cached files for this instruction, remove them
  if (instructionAudioMap[instructionId]) {
    console.log(`Invalidating cache for instruction ID: ${instructionId}`);
    
    const filesToRemove = instructionAudioMap[instructionId];
    filesToRemove.forEach(file => {
      const filePath = path.join(audioCacheDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Removed cached file: ${file}`);
        
        // Also remove from analytics
        delete cacheAnalytics.accessCount[file];
        delete cacheAnalytics.lastAccessed[file];
        delete cacheAnalytics.priorityScores[file];
      }
    });
    
    // Clear the tracking for this instruction
    delete instructionAudioMap[instructionId];
    delete cacheAnalytics.instructionFrequency[instructionId];
    delete cacheAnalytics.startingInstructions[instructionId];
    
    // Save analytics to disk
    saveCacheAnalytics();
  }
};

// Cache management endpoint - for manual clearing of cache
app.post('/api/tts/cache/manage', (req, res) => {
  try {
    const { action, instructionId, clearAll } = req.body;
    
    if (action === 'clear') {
      if (clearAll) {
        // Clear entire cache
        fs.emptyDirSync(audioCacheDir);
        instructionAudioMap = {};
        console.log('Cleared entire TTS audio cache');
        return res.json({ message: 'Entire TTS audio cache cleared successfully' });
      } else if (instructionId) {
        // Clear specific instruction cache
        invalidateInstructionCache(instructionId);
        return res.json({ message: `Cache for instruction ID ${instructionId} cleared successfully` });
      }
    }
    
    return res.status(400).json({ error: 'Invalid cache management request' });
  } catch (error) {
    console.error('Error managing cache:', error);
    res.status(500).json({ error: 'Failed to manage TTS cache' });
  }
});

// API Endpoints
// Note: All API endpoints are prefixed with /api to distinguish them from frontend routes

// Cache status endpoint - for diagnostics
app.get('/api/tts/cache/status', (req, res) => {
  try {
    const files = fs.readdirSync(audioCacheDir);
    const cacheSize = files.reduce((total, file) => {
      const filePath = path.join(audioCacheDir, file);
      const stats = fs.statSync(filePath);
      return total + stats.size;
    }, 0);
    
    res.json({
      files: files.length,
      sizeBytes: cacheSize,
      sizeMB: Math.round((cacheSize / (1024 * 1024)) * 100) / 100
    });
  } catch (error) {
    console.error('Error getting cache status:', error);
    res.status(500).json({ error: 'Failed to get cache status' });
  }
});

// Enhanced cache status endpoint with analytics
app.get('/api/tts/cache/analytics', (req, res) => {
  try {
    const files = fs.readdirSync(audioCacheDir);
    const cacheSize = files.reduce((total, file) => {
      const filePath = path.join(audioCacheDir, file);
      const stats = fs.statSync(filePath);
      return total + stats.size;
    }, 0);
    
    // Get top accessed files
    const accessCounts = Object.entries(cacheAnalytics.accessCount)
      .map(([hash, count]) => ({ hash, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Get recently accessed files
    const recentAccess = Object.entries(cacheAnalytics.lastAccessed)
      .map(([hash, timestamp]) => ({ hash, timestamp }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
    
    // Get highest priority files
    const highPriority = Object.entries(cacheAnalytics.priorityScores)
      .map(([hash, score]) => ({ hash, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    // Get most frequently used instructions
    const frequentInstructions = Object.entries(cacheAnalytics.instructionFrequency)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Get common starting instructions
    const startingInstructions = Object.entries(cacheAnalytics.startingInstructions)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    res.json({
      summary: {
        files: files.length,
        sizeBytes: cacheSize,
        sizeMB: Math.round((cacheSize / (1024 * 1024)) * 100) / 100,
        uniqueInstructions: Object.keys(instructionAudioMap).length,
        trackedFiles: Object.keys(cacheAnalytics.accessCount).length
      },
      analytics: {
        topAccessed: accessCounts,
        recentAccess,
        highPriority,
        frequentInstructions,
        startingInstructions
      }
    });
  } catch (error) {
    console.error('Error getting cache analytics:', error);
    res.status(500).json({ error: 'Failed to get cache analytics' });
  }
});

// Smart cache cleanup endpoint
app.post('/api/tts/cache/optimize', async (req, res) => {
  try {
    const { maxSize, keepHighPriority = true, maxAge } = req.body;
    
    const stats = {
      beforeFiles: 0,
      afterFiles: 0,
      beforeSizeBytes: 0,
      afterSizeBytes: 0,
      deletedFiles: 0,
      savedBytes: 0
    };
    
    // Get all files in cache directory with stats
    const files = fs.readdirSync(audioCacheDir);
    stats.beforeFiles = files.length;
    
    // Map of filename to stats
    const fileStats = {};
    
    // Calculate initial size and gather stats
    files.forEach(file => {
      const filePath = path.join(audioCacheDir, file);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const stat = fs.statSync(filePath);
        const fileHash = file.replace('.mp3', '');
        
        fileStats[file] = {
          path: filePath,
          size: stat.size,
          mtime: stat.mtime.getTime(),
          atime: stat.atime.getTime(),
          score: cacheAnalytics.priorityScores[fileHash] || 0,
          accessCount: cacheAnalytics.accessCount[fileHash] || 0,
          lastAccessed: cacheAnalytics.lastAccessed[fileHash] || 0
        };
        
        stats.beforeSizeBytes += stat.size;
      }
    });
    
    // Files to delete
    const filesToDelete = [];
    
    // If maxAge specified, mark old files for deletion
    if (maxAge && !isNaN(parseInt(maxAge))) {
      const maxAgeMs = parseInt(maxAge) * 24 * 60 * 60 * 1000; // Convert days to ms
      const now = Date.now();
      
      Object.entries(fileStats).forEach(([file, stat]) => {
        const lastAccessedTime = stat.lastAccessed || stat.atime;
        if ((now - lastAccessedTime) > maxAgeMs) {
          filesToDelete.push(file);
        }
      });
    }
    
    // If maxSize specified, remove lowest priority files until we're under the limit
    if (maxSize && !isNaN(parseInt(maxSize))) {
      const maxSizeBytes = parseInt(maxSize) * 1024 * 1024; // Convert MB to bytes
      
      if (stats.beforeSizeBytes > maxSizeBytes) {
        // Calculate current size after age-based deletions
        const currentSize = stats.beforeSizeBytes - filesToDelete.reduce((total, file) => {
          return total + (fileStats[file]?.size || 0);
        }, 0);
        
        if (currentSize > maxSizeBytes) {
          // Sort remaining files by priority score (ascending = lowest priority first)
          const remainingFiles = Object.entries(fileStats)
            .filter(([file]) => !filesToDelete.includes(file))
            .sort((a, b) => a[1].score - b[1].score);
          
          let sizeToFree = currentSize - maxSizeBytes;
          
          // Remove files until we're under the limit
          for (const [file, stat] of remainingFiles) {
            if (sizeToFree <= 0) break;
            
            // Skip high priority files if requested
            if (keepHighPriority && stat.score > 5) continue;
            
            filesToDelete.push(file);
            sizeToFree -= stat.size;
          }
        }
      }
    }
    
    // Delete the files
    for (const file of filesToDelete) {
      const filePath = fileStats[file].path;
      const fileSize = fileStats[file].size;
      
      try {
        fs.unlinkSync(filePath);
        stats.deletedFiles++;
        stats.savedBytes += fileSize;
        
        // Remove from analytics
        const fileHash = file.replace('.mp3', '');
        delete cacheAnalytics.accessCount[fileHash];
        delete cacheAnalytics.lastAccessed[fileHash];
        delete cacheAnalytics.priorityScores[fileHash];
        
        // Remove from instructionAudioMap
        for (const instructionId in instructionAudioMap) {
          const index = instructionAudioMap[instructionId].indexOf(file);
          if (index !== -1) {
            instructionAudioMap[instructionId].splice(index, 1);
            if (instructionAudioMap[instructionId].length === 0) {
              delete instructionAudioMap[instructionId];
            }
          }
        }
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error);
      }
    }
    
    // Save updated analytics
    saveCacheAnalytics();
    
    // Calculate final stats
    stats.afterFiles = stats.beforeFiles - stats.deletedFiles;
    stats.afterSizeBytes = stats.beforeSizeBytes - stats.savedBytes;
    
    res.json({
      message: `Cache optimization complete. Deleted ${stats.deletedFiles} files, saved ${formatBytes(stats.savedBytes)}`,
      stats: {
        beforeCount: stats.beforeFiles,
        afterCount: stats.afterFiles,
        beforeSize: formatBytes(stats.beforeSizeBytes),
        afterSize: formatBytes(stats.afterSizeBytes),
        savedSpace: formatBytes(stats.savedBytes)
      }
    });
  } catch (error) {
    console.error('Error optimizing cache:', error);
    res.status(500).json({ error: 'Failed to optimize cache' });
  }
});

app.get('/api/instructions', (req, res) => {
  debugLog(`GET /api/instructions request received from ${req.ip}`);
  try {
    debugLog(`Reading instructions file at: ${instructionsPath}`);
    
    if (!fs.existsSync(instructionsPath)) {
      debugLog('WARNING: Instructions file not found when trying to read it');
      return res.status(404).json({ error: 'Instructions file not found' });
    }
    
    const instructions = fs.readJsonSync(instructionsPath);
    debugLog(`Successfully read ${instructions.length} instructions`);
    res.json(instructions);
  } catch (error) {
    debugLog(`Error reading instructions: ${error.message}`, error);
    console.error('Error reading instructions:', error);
    res.status(500).json({ error: 'Failed to retrieve meditation instructions' });
  }
});

// GET a single instruction by ID
app.get('/api/instructions/:id', (req, res) => {
  const instructionId = req.params.id;
  debugLog(`GET /api/instructions/${instructionId} request received from ${req.ip}`);
  
  try {
    debugLog(`Reading instructions file for ID: ${instructionId}`);
    
    if (!fs.existsSync(instructionsPath)) {
      debugLog(`WARNING: Instructions file not found when trying to read instruction ID: ${instructionId}`);
      return res.status(404).json({ error: 'Instructions file not found' });
    }
    
    const instructions = fs.readJsonSync(instructionsPath);
    debugLog(`Successfully read ${instructions.length} instructions, searching for ID: ${instructionId}`);
    
    const instruction = instructions.find(i => i.id === instructionId);
    
    if (!instruction) {
      debugLog(`Instruction with ID ${instructionId} not found`);
      return res.status(404).json({ error: 'Instruction file not found' });
    }
    
    debugLog(`Successfully found instruction "${instruction.name}" with ID: ${instructionId}`);
    res.json(instruction);
  } catch (error) {
    debugLog(`Error retrieving instruction by ID ${instructionId}: ${error.message}`, error);
    console.error('Error retrieving instruction by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve meditation instruction' });
  }
});

app.post('/api/instructions', (req, res) => {
  debugLog('POST /api/instructions request received', { body: req.body });
  
  try {
    if (!fs.existsSync(instructionsPath)) {
      debugLog('WARNING: Instructions file not found when trying to create new instruction');
      fs.writeJsonSync(instructionsPath, [], { spaces: 2 });
      debugLog('Created new empty instructions file');
    }
    
    const instructions = fs.readJsonSync(instructionsPath);
    debugLog(`Read ${instructions.length} existing instructions`);
    
    const newInstruction = {
      id: Date.now().toString(),
      name: req.body.name,
      description: req.body.description || '',
      content: req.body.content, // Multi-line text content with one instruction per line
      createdAt: new Date().toISOString()
    };
    
    debugLog('Created new instruction object', newInstruction);
    instructions.push(newInstruction);
    
    debugLog(`Writing updated instructions file with ${instructions.length} entries`);
    fs.writeJsonSync(instructionsPath, instructions, { spaces: 2 });
    debugLog('Successfully wrote instructions file');
    
    res.status(201).json(newInstruction);
  } catch (error) {
    debugLog(`Error saving instruction: ${error.message}`, error);
    console.error('Error saving instruction:', error);
    res.status(500).json({ error: 'Failed to save meditation instruction' });
  }
});

app.put('/api/instructions/:id', (req, res) => {
  const instructionId = req.params.id;
  debugLog(`PUT /api/instructions/${instructionId} request received`, { body: req.body });
  
  try {
    if (!fs.existsSync(instructionsPath)) {
      debugLog(`WARNING: Instructions file not found when trying to update instruction ID: ${instructionId}`);
      return res.status(404).json({ error: 'Instructions file not found' });
    }
    
    const instructions = fs.readJsonSync(instructionsPath);
    debugLog(`Read ${instructions.length} instructions, searching for ID: ${instructionId}`);
    
    const instructionIndex = instructions.findIndex(i => i.id === instructionId);
    
    if (instructionIndex === -1) {
      debugLog(`Instruction with ID ${instructionId} not found for update`);
      return res.status(404).json({ error: 'Instruction file not found' });
    }
    
    debugLog(`Found instruction at index ${instructionIndex}, updating fields`);
    
    const updatedInstruction = {
      ...instructions[instructionIndex],
      name: req.body.name || instructions[instructionIndex].name,
      description: req.body.description !== undefined ? 
        req.body.description : instructions[instructionIndex].description,
      content: req.body.content || instructions[instructionIndex].content,
      updatedAt: new Date().toISOString()
    };
    
    instructions[instructionIndex] = updatedInstruction;
    debugLog('Updated instruction object', updatedInstruction);
    
    debugLog(`Writing updated instructions file with ${instructions.length} entries`);
    fs.writeJsonSync(instructionsPath, instructions, { spaces: 2 });
    debugLog('Successfully wrote instructions file');
    
    // Invalidate cache for this instruction ID
    invalidateInstructionCache(instructionId);
    
    res.json(updatedInstruction);
  } catch (error) {
    debugLog(`Error updating instruction ${instructionId}: ${error.message}`, error);
    console.error('Error updating instruction:', error);
    res.status(500).json({ error: 'Failed to update meditation instruction' });
  }
});

app.delete('/api/instructions/:id', (req, res) => {
  const instructionId = req.params.id;
  debugLog(`DELETE /api/instructions/${instructionId} request received`);
  
  try {
    if (!fs.existsSync(instructionsPath)) {
      debugLog(`WARNING: Instructions file not found when trying to delete instruction ID: ${instructionId}`);
      return res.status(404).json({ error: 'Instructions file not found' });
    }
    
    const instructions = fs.readJsonSync(instructionsPath);
    debugLog(`Read ${instructions.length} instructions, filtering out ID: ${instructionId}`);
    
    const initialLength = instructions.length;
    const filteredInstructions = instructions.filter(i => i.id !== instructionId);
    
    if (filteredInstructions.length === initialLength) {
      debugLog(`Instruction with ID ${instructionId} not found for deletion`);
      return res.status(404).json({ error: 'Instruction file not found' });
    }
    
    debugLog(`Removed instruction, writing updated file with ${filteredInstructions.length} entries`);
    fs.writeJsonSync(instructionsPath, filteredInstructions, { spaces: 2 });
    debugLog('Successfully wrote instructions file');
    
    // Invalidate cache for this instruction ID
    invalidateInstructionCache(instructionId);
    
    res.json({ message: 'Instruction file successfully deleted' });
  } catch (error) {
    debugLog(`Error deleting instruction ${instructionId}: ${error.message}`, error);
    console.error('Error deleting instruction:', error);
    res.status(500).json({ error: 'Failed to delete meditation instruction' });
  }
});

// Health check endpoint with instruction file status
app.get('/api/health', (req, res) => {
  debugLog('GET /api/health request received');
  
  try {
    // Check instruction file status
    const instructionStatus = {
      exists: fs.existsSync(instructionsPath),
      stats: fs.existsSync(instructionsPath) ? fs.statSync(instructionsPath) : null,
      entries: 0
    };
    
    if (instructionStatus.exists) {
      try {
        const instructions = fs.readJsonSync(instructionsPath);
        instructionStatus.entries = instructions.length;
        instructionStatus.readable = true;
      } catch (err) {
        instructionStatus.readable = false;
        instructionStatus.readError = err.message;
      }
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      instructions: instructionStatus
    });
  } catch (error) {
    debugLog(`Error in health check: ${error.message}`, error);
    res.status(500).json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Network connectivity test endpoint
app.get('/api/network-test', (req, res) => {
  try {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const networkInfo = {
      clientIp: req.ip || req.connection.remoteAddress,
      clientHeaders: req.headers,
      serverInterfaces: {},
      timestamp: new Date().toISOString()
    };
    
    // Get server network interfaces
    for (const name of Object.keys(nets)) {
      networkInfo.serverInterfaces[name] = nets[name].map(net => ({
        address: net.address,
        family: net.family,
        internal: net.internal
      }));
    }
    
    res.json(networkInfo);
  } catch (error) {
    console.error('Error getting network info:', error);
    res.status(500).json({ error: 'Failed to get network information' });
  }
});

// Import API key manager
const keyManager = require('./utils/keyManager');

// API Key management routes
app.get('/api/keys/status', (req, res) => {
  try {
    const statuses = keyManager.getApiKeyStatuses();
    
    // Determine which services are available based on key status and environment variables
    const serviceStatus = {
      openai: {
        available: !!(statuses.openai && statuses.openai.exists && statuses.openai.validated),
        lastChecked: statuses.openai ? statuses.openai.lastValidated : null,
        features: ["tts"],
        envKeyPresent: !!process.env.OPENAI_API_KEY
      },
      elevenlabs: {
        available: !!(statuses.elevenlabs && statuses.elevenlabs.exists && statuses.elevenlabs.validated),
        lastChecked: statuses.elevenlabs ? statuses.elevenlabs.lastValidated : null,
        features: ["tts"],
        envKeyPresent: !!process.env.ELEVENLABS_API_KEY
      }
    };
    
    res.json({
      services: serviceStatus
    });
  } catch (error) {
    console.error('Error getting API key statuses:', error);
    res.status(500).json({ error: 'Failed to retrieve API key statuses' });
  }
});

// Set an API key
app.post('/api/keys', async (req, res) => {
  try {
    const { service, key } = req.body;
    
    if (!service || !key) {
      return res.status(400).json({ error: 'Service and key are required' });
    }
    
    // Validate that service is supported
    if (!['openai', 'elevenlabs'].includes(service)) {
      return res.status(400).json({ error: 'Unsupported service' });
    }
    
    // Validate the key with the service
    let isValid = false;
    let validationError = null;
    
    try {
      isValid = await validateApiKey(service, key);
    } catch (error) {
      validationError = error.message;
    }
    
    // Save the key even if validation fails (user might be offline or API temporarily unavailable)
    keyManager.setApiKey(service, key, { validated: isValid });
    
    // Set environment variable so it's available for the current session
    if (service === 'openai') {
      process.env.OPENAI_API_KEY = key;
    } else if (service === 'elevenlabs') {
      process.env.ELEVENLABS_API_KEY = key;
    }
    
    res.json({
      success: true,
      service,
      validated: isValid,
      error: validationError
    });
  } catch (error) {
    console.error('Error setting API key:', error);
    res.status(500).json({ error: 'Failed to set API key' });
  }
});

// Delete an API key
app.delete('/api/keys/:service', (req, res) => {
  try {
    const { service } = req.params;
    
    // Validate that service is supported
    if (!['openai', 'elevenlabs'].includes(service)) {
      return res.status(400).json({ error: 'Unsupported service' });
    }
    
    const deleted = keyManager.deleteApiKey(service);
    
    // Also remove from environment variables for current session
    if (service === 'openai') {
      delete process.env.OPENAI_API_KEY;
    } else if (service === 'elevenlabs') {
      delete process.env.ELEVENLABS_API_KEY;
    }
    
    if (deleted) {
      res.json({ success: true, message: `${service} API key deleted` });
    } else {
      res.status(404).json({ error: `No ${service} API key found` });
    }
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Test an API key
app.post('/api/keys/validate', async (req, res) => {
  try {
    const { service, key } = req.body;
    
    if (!service || !key) {
      return res.status(400).json({ error: 'Service and key are required' });
    }
    
    // Validate that service is supported
    if (!['openai', 'elevenlabs'].includes(service)) {
      return res.status(400).json({ error: 'Unsupported service' });
    }
    
    try {
      const isValid = await validateApiKey(service, key);
      
      res.json({
        valid: isValid,
        service
      });
    } catch (error) {
      console.error(`API key validation error for ${service}:`, error);
      res.status(400).json({ 
        valid: false, 
        service,
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({ error: 'Failed to validate API key' });
  }
});

// Helper function to validate an API key with its service
async function validateApiKey(service, key) {
  if (service === 'openai') {
    // Test with a simple model call
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI validation failed: ${response.status} ${response.statusText}`);
    }
    
    return true;
  } else if (service === 'elevenlabs') {
    // Test with a voices list call
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': key
      }
    });
    
    if (!response.ok) {
      throw new Error(`ElevenLabs validation failed: ${response.status} ${response.statusText}`);
    }
    
    return true;
  }
  
  throw new Error('Unsupported service');
}

// Load API keys on startup and set environment variables
function loadApiKeysFromStorage() {
  try {
    const openaiKey = keyManager.getApiKey('openai');
    if (openaiKey) {
      process.env.OPENAI_API_KEY = openaiKey;
      console.log('Loaded OpenAI API key from storage');
    }
    
    const elevenlabsKey = keyManager.getApiKey('elevenlabs');
    if (elevenlabsKey) {
      process.env.ELEVENLABS_API_KEY = elevenlabsKey;
      console.log('Loaded ElevenLabs API key from storage');
    }
  } catch (error) {
    console.error('Error loading API keys from storage:', error);
  }
}

// Load API keys on server startup
loadApiKeysFromStorage();

// Helper function to map OpenAI voice names to ElevenLabs voice IDs
const getElevenLabsVoiceId = (openaiVoice) => {
  // Default premium voices from ElevenLabs
  // Map OpenAI voices to similar ElevenLabs voices
  const voiceMapping = {
    'alloy': '21m00Tcm4TlvDq8ikWAM', // Rachel
    'echo': 'AZnzlk1XvdvUeBnXmlld', // Domi
    'fable': 'EXAVITQu4vr4xnSDxMaL', // Bella
    'onyx': 'VR6AewLTigWG4xSOukaG', // Adam
    'nova': 'pNInz6obpgDQGcFmaJgB', // Elli
    'shimmer': 'jBpfuIE2acCO8z3wKNLl', // Grace
  };
  
  const mappedVoice = voiceMapping[openaiVoice] || openaiVoice;
  console.log(`[ELEVENLABS] Voice mapping: ${openaiVoice} -> ${mappedVoice}`);
  return mappedVoice;
};

// Modify TTS endpoint to use the stored API keys and handle graceful fallbacks
app.post('/api/tts', async (req, res) => {
  try {
    const { 
      text, 
      voice = 'alloy', 
      instructionId, 
      provider = 'openai', 
      isStartingInstruction = false
    } = req.body;
    
    console.log(`[TTS] Request received - Provider: ${provider}, Voice: ${voice}, Text: "${text.substring(0, 30)}..."`);

    // Check cache first
    const cachedAudioPath = getCachedAudio(text, voice, provider);
    const audioHash = cachedAudioPath ? 
      path.basename(cachedAudioPath, '.mp3') : 
      generateAudioFileHash(text, voice, provider);

    if (cachedAudioPath) {
      console.log(`Using cached audio for: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}" (${provider}/${voice})`);
      
      // Update cache analytics
      updateCacheAnalytics(audioHash, instructionId, isStartingInstruction);
      
      // Return cached audio file
      return res.sendFile(cachedAudioPath);
    }

    // Proceed with API key validation only if no cached file is found
    let apiKey = null;
    if (provider === 'openai') {
      apiKey = process.env.OPENAI_API_KEY || keyManager.getApiKey('openai');
      if (!apiKey) {
        return res.status(400).json({ 
          error: 'OpenAI API key not configured', 
          missingKey: true,
          provider: 'openai'
        });
      }
    } else if (provider === 'elevenlabs') {
      apiKey = process.env.ELEVENLABS_API_KEY || keyManager.getApiKey('elevenlabs');
      if (!apiKey) {
        return res.status(400).json({ 
          error: 'ElevenLabs API key not configured', 
          missingKey: true,
          provider: 'elevenlabs'
        });
      }
    }

    console.log(`Generating new audio for: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}" (${provider}/${voice})`);

    let buffer;
    
    if (provider === 'openai') {
      // Call OpenAI API for TTS
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voice, // alloy, echo, fable, onyx, nova, or shimmer
          response_format: 'mp3'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI TTS API error:', error);
        return res.status(response.status).json({ error: error.error?.message || 'Failed to generate speech with OpenAI' });
      }

      // Get the audio buffer from the response
      const audioBuffer = await response.arrayBuffer();
      buffer = Buffer.from(audioBuffer);
      
    } else if (provider === 'elevenlabs') {
      try {
        // For ElevenLabs, use the voice ID directly if it's not an OpenAI voice name
        const voiceId = voice.length === 21 ? voice : getElevenLabsVoiceId(voice);
        console.log(`[ELEVENLABS] Using voice ID: ${voiceId} for request`);
        
        const apiEndpoint = `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
        console.log(`[ELEVENLABS] Calling API endpoint: ${apiEndpoint}`);

        const audioBuffer = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5
            }
          })
        });

        if (!audioBuffer.ok) {
          const error = await audioBuffer.json();
          console.error('[ELEVENLABS] TTS API error:', error);
          return res.status(audioBuffer.status).json({ error: error.error?.message || 'Failed to generate speech with ElevenLabs' });
        }

        console.log('[ELEVENLABS] Successfully generated audio');
        buffer = Buffer.from(await audioBuffer.arrayBuffer());
      } catch (elevenLabsError) {
        console.error('[ELEVENLABS] API error:', elevenLabsError);
        return res.status(500).json({ error: 'Failed to generate speech with ElevenLabs' });
      }
    }
    
    // Save to cache
    const newAudioPath = getCachedAudioPath(text, voice, provider);
    await fs.writeFile(newAudioPath, buffer);
    
    // Update analytics for newly created file
    updateCacheAnalytics(audioHash, instructionId, isStartingInstruction);
    
    // Send response to client
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (error) {
    console.error('Error processing TTS request:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// Performance monitoring endpoint
app.get('/api/system/status', (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cacheSizeInBytes = calculateCacheSize();
    const uptime = process.uptime();
    
    res.json({
      status: 'ok',
      serverUptime: uptime,
      memory: {
        rss: formatBytes(memoryUsage.rss),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        heapUsed: formatBytes(memoryUsage.heapUsed),
        external: formatBytes(memoryUsage.external)
      },
      cache: {
        size: formatBytes(cacheSizeInBytes),
        files: getAudioCacheStats()
      }
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({ error: 'Could not retrieve system status' });
  }
});

// Enhanced cache management endpoint with optimization features
app.delete('/api/cache', (req, res) => {
  try {
    // Extract optional query parameters
    const { olderThan, unused } = req.query;
    
    const stats = {
      totalFiles: 0,
      deletedFiles: 0,
      savedBytes: 0,
      errors: []
    };
    
    // Get all files in cache directory
    const files = fs.readdirSync(audioCacheDir);
    stats.totalFiles = files.length;
    
    // Process each file
    files.forEach(file => {
      const filePath = path.join(audioCacheDir, file);
      
      try {
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          return;
        }
        
        const fileStat = fs.statSync(filePath);
        const fileSizeBytes = fileStat.size;
        
        let shouldDelete = false;
        
        // Delete based on age if olderThan parameter provided (in days)
        if (olderThan && !isNaN(parseInt(olderThan))) {
          const fileAgeDays = (Date.now() - fileStat.mtime) / (1000 * 60 * 60 * 24);
          if (fileAgeDays > parseInt(olderThan)) {
            shouldDelete = true;
          }
        }
        
        // Delete if no filter parameters provided (clear all)
        if (!olderThan && !unused) {
          shouldDelete = true;
        }
        
        if (shouldDelete) {
          fs.unlinkSync(filePath);
          stats.deletedFiles++;
          stats.savedBytes += fileSizeBytes;
        }
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError);
        stats.errors.push(`Error deleting ${file}: ${fileError.message}`);
      }
    });
    
    // Reset the instruction audio map if we deleted files
    if (stats.deletedFiles > 0) {
      instructionAudioMap = {};
    }
    
    res.json({
      message: `Cache cleanup complete. Deleted ${stats.deletedFiles} of ${stats.totalFiles} files.`,
      spaceFreed: formatBytes(stats.savedBytes),
      ...stats
    });
  } catch (error) {
    console.error('Error during cache cleanup:', error);
    res.status(500).json({ error: 'Cache cleanup failed', message: error.message });
  }
});

// Helper function to calculate total cache size
function calculateCacheSize() {
  try {
    const files = fs.readdirSync(audioCacheDir);
    let totalSize = 0;
    
    files.forEach(file => {
      const filePath = path.join(audioCacheDir, file);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        totalSize += fs.statSync(filePath).size;
      }
    });
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating cache size:', error);
    return 0;
  }
}

// Helper function to get audio cache statistics
function getAudioCacheStats() {
  try {
    const files = fs.readdirSync(audioCacheDir);
    return {
      count: files.length,
      instructionsMapped: Object.keys(instructionAudioMap).length
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { count: 0, instructionsMapped: 0 };
  }
}

// Helper function to format bytes into human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper function to check available ElevenLabs voices
app.get('/api/elevenlabs/voices', async (req, res) => {
  try {
    debugLog('GET /api/elevenlabs/voices request received');
    
    if (!process.env.ELEVENLABS_API_KEY) {
      debugLog('ERROR: ElevenLabs API key not configured');
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }
    
    debugLog('Fetching voices from ElevenLabs API...');
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      method: 'GET',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      debugLog('Error from ElevenLabs API:', errorData);
      return res.status(response.status).json({ error: 'Failed to fetch ElevenLabs voices' });
    }

    const voicesData = await response.json();
    debugLog(`Successfully fetched ${voicesData.voices?.length || 0} voices from ElevenLabs`);
    debugLog('Voice names:', voicesData.voices?.map(v => v.name).join(', '));
    
    res.json(voicesData);
  } catch (error) {
    debugLog('Error fetching ElevenLabs voices:', error);
    res.status(500).json({ error: 'Failed to fetch ElevenLabs voices' });
  }
});

// ====== Preset API Endpoints ======

// GET all presets
app.get('/api/presets', (req, res) => {
  debugLog(`GET /api/presets request received from ${req.ip}`);
  try {
    // Read all JSON files from presets directory
    if (!fs.existsSync(presetsDir)) {
      debugLog(`Creating presets directory: ${presetsDir}`);
      fs.ensureDirSync(presetsDir);
      return res.json([]);
    }
    
    const files = fs.readdirSync(presetsDir).filter(file => file.endsWith('.json'));
    debugLog(`Found ${files.length} preset files`);
    
    const presets = files.map(file => {
      try {
        const presetPath = path.join(presetsDir, file);
        const preset = fs.readJsonSync(presetPath);
        return preset;
      } catch (error) {
        debugLog(`Error reading preset file ${file}: ${error.message}`);
        return null;
      }
    }).filter(Boolean); // Remove any null entries from failed reads
    
    res.json(presets);
  } catch (error) {
    debugLog(`Error retrieving presets: ${error.message}`, error);
    console.error('Error retrieving presets:', error);
    res.status(500).json({ error: 'Failed to retrieve meditation presets' });
  }
});

// GET a preset by ID
app.get('/api/presets/:id', (req, res) => {
  const presetId = req.params.id;
  debugLog(`GET /api/presets/${presetId} request received`);
  
  try {
    const presetPath = path.join(presetsDir, `${presetId}.json`);
    
    if (!fs.existsSync(presetPath)) {
      debugLog(`Preset with ID ${presetId} not found`);
      return res.status(404).json({ error: 'Preset not found' });
    }
    
    const preset = fs.readJsonSync(presetPath);
    debugLog(`Successfully retrieved preset: ${preset.name}`);
    res.json(preset);
  } catch (error) {
    debugLog(`Error retrieving preset ${presetId}: ${error.message}`, error);
    console.error('Error retrieving preset:', error);
    res.status(500).json({ error: 'Failed to retrieve meditation preset' });
  }
});

// POST create a new preset
app.post('/api/presets', (req, res) => {
  debugLog('POST /api/presets request received', { body: req.body });
  
  try {
    const { name, description, config } = req.body;
    
    // Validate required fields
    if (!name || !config) {
      return res.status(400).json({ error: 'Name and config are required fields' });
    }
    
    // Ensure presets directory exists
    if (!fs.existsSync(presetsDir)) {
      debugLog(`Creating presets directory: ${presetsDir}`);
      fs.ensureDirSync(presetsDir);
    }
    
    // Generate a unique ID for the preset
    const presetId = `preset-${Date.now().toString()}`;
    
    // Add human-readable voice information to help with display
    let voiceDisplayName = '';
    if (config.useVoiceGuidance) {
      if (config.voiceType === 'browser') {
        voiceDisplayName = 'Browser Default';
      } else if (config.voiceType === 'openai') {
        voiceDisplayName = openAIVoiceDescriptions[config.openaiVoice] || config.openaiVoice;
      } else if (config.voiceType === 'elevenlabs') {
        // We don't have the voice names from ElevenLabs cached on server side, so store the ID
        voiceDisplayName = `ElevenLabs ID: ${config.elevenlabsVoiceId}`;
      }
    }
    
    const newPreset = {
      id: presetId,
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config,
      voiceDisplayName
    };
    
    const presetPath = path.join(presetsDir, `${presetId}.json`);
    debugLog(`Writing new preset to ${presetPath}`, newPreset);
    
    // Write the preset to a JSON file
    fs.writeJsonSync(presetPath, newPreset, { spaces: 2 });
    
    res.status(201).json(newPreset);
  } catch (error) {
    debugLog(`Error creating preset: ${error.message}`, error);
    console.error('Error creating preset:', error);
    res.status(500).json({ error: 'Failed to create meditation preset' });
  }
});

// PUT update an existing preset
app.put('/api/presets/:id', (req, res) => {
  const presetId = req.params.id;
  debugLog(`PUT /api/presets/${presetId} request received`, { body: req.body });
  
  try {
    const presetPath = path.join(presetsDir, `${presetId}.json`);
    
    if (!fs.existsSync(presetPath)) {
      debugLog(`Preset with ID ${presetId} not found for update`);
      return res.status(404).json({ error: 'Preset not found' });
    }
    
    const existingPreset = fs.readJsonSync(presetPath);
    
    // Update fields
    const updatedPreset = {
      ...existingPreset,
      name: req.body.name || existingPreset.name,
      description: req.body.description !== undefined ? req.body.description : existingPreset.description,
      config: req.body.config || existingPreset.config,
      updatedAt: new Date().toISOString()
    };
    
    debugLog(`Updating preset at ${presetPath}`, updatedPreset);
    fs.writeJsonSync(presetPath, updatedPreset, { spaces: 2 });
    
    res.json(updatedPreset);
  } catch (error) {
    debugLog(`Error updating preset ${presetId}: ${error.message}`, error);
    console.error('Error updating preset:', error);
    res.status(500).json({ error: 'Failed to update meditation preset' });
  }
});

// DELETE a preset
app.delete('/api/presets/:id', (req, res) => {
  const presetId = req.params.id;
  debugLog(`DELETE /api/presets/${presetId} request received`);
  
  try {
    const presetPath = path.join(presetsDir, `${presetId}.json`);
    
    if (!fs.existsSync(presetPath)) {
      debugLog(`Preset with ID ${presetId} not found for deletion`);
      return res.status(404).json({ error: 'Preset not found' });
    }
    
    debugLog(`Deleting preset: ${presetPath}`);
    fs.removeSync(presetPath);
    
    res.json({ message: 'Preset successfully deleted' });
  } catch (error) {
    debugLog(`Error deleting preset ${presetId}: ${error.message}`, error);
    console.error('Error deleting preset:', error);
    res.status(500).json({ error: 'Failed to delete meditation preset' });
  }
});

// Promote a preset to default (copy from data/presets to defaults/presets)
app.post('/api/presets/:id/promote', (req, res) => {
  const presetId = req.params.id;
  debugLog(`POST /api/presets/${presetId}/promote request received`);
  
  try {
    // Check if the preset exists
    const sourcePath = path.join(presetsDir, `${presetId}.json`);
    if (!fs.existsSync(sourcePath)) {
      debugLog(`Preset with ID ${presetId} not found for promotion`);
      return res.status(404).json({ error: 'Preset not found' });
    }
    
    // Ensure defaults/presets directory exists
    const defaultPresetsDir = path.join(defaultsDir, 'presets');
    if (!fs.existsSync(defaultPresetsDir)) {
      debugLog(`Creating defaults/presets directory: ${defaultPresetsDir}`);
      fs.ensureDirSync(defaultPresetsDir);
    }
    
    // Read the preset
    const preset = fs.readJsonSync(sourcePath);
    
    // Mark it as a default preset
    const defaultPreset = {
      ...preset,
      isDefault: true,
      updatedAt: new Date().toISOString()
    };
    
    // Write to defaults/presets directory
    const targetPath = path.join(defaultPresetsDir, `${presetId}.json`);
    fs.writeJsonSync(targetPath, defaultPreset, { spaces: 2 });
    
    // Update the data/presets version as well
    fs.writeJsonSync(sourcePath, defaultPreset, { spaces: 2 });
    
    debugLog(`Successfully promoted preset ${presetId} to default preset`);
    res.json({ 
      success: true, 
      message: 'Preset successfully promoted to default',
      preset: defaultPreset 
    });
  } catch (error) {
    debugLog(`Error promoting preset ${presetId}: ${error.message}`, error);
    console.error('Error promoting preset:', error);
    res.status(500).json({ error: 'Failed to promote preset to default' });
  }
});

// Serve static files from the React build directory
// This needs to be AFTER all API routes to prevent conflicts
let staticFilesPath;
// Check if we're running in a Docker container
if (fs.existsSync('/app/frontend/build')) {
  // Docker container path
  staticFilesPath = '/app/frontend/build';
  console.log('Running in Docker: Serving frontend from', staticFilesPath);
} else {
  // Local development path
  staticFilesPath = path.join(__dirname, '../frontend/build');
  console.log('Running in development: Serving frontend from', staticFilesPath);
}

// Check if the frontend build directory exists
if (!fs.existsSync(staticFilesPath)) {
  console.warn(`Warning: Frontend build directory not found at ${staticFilesPath}`);
} else {
  console.log(`Frontend build directory found at ${staticFilesPath}`);
  // List the contents to help with debugging
  try {
    const files = fs.readdirSync(staticFilesPath);
    console.log(`Found ${files.length} files in build directory:`, files.slice(0, 10).join(', ') + (files.length > 10 ? '...' : ''));
  } catch (err) {
    console.error('Error reading build directory:', err);
  }
}

// Configure static file serving with proper options
app.use(express.static(staticFilesPath, {
  etag: true, // Enable ETag for caching
  lastModified: true, // Enable Last-Modified for caching
  setHeaders: (res, path) => {
    // Set proper caching headers based on file type
    if (path.endsWith('.html')) {
      // Don't cache HTML files
      res.setHeader('Cache-Control', 'no-cache');
    } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
      // Cache static assets for 1 day
      res.setHeader('Cache-Control', 'public, max-age=86400');
    } else if (path.match(/\.(mp3|wav)$/)) {
      // Cache audio files for 1 week
      res.setHeader('Cache-Control', 'public, max-age=604800');
      // Ensure proper content type for audio files
      if (path.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
      } else if (path.endsWith('.wav')) {
        res.setHeader('Content-Type', 'audio/wav');
      }
    }
    // Log file access to help with debugging
    console.log(`Serving static file: ${path}`);
  }
}));

// Special route for public/sounds directory in case we need to access audio files directly
app.use('/sounds', express.static(path.join(staticFilesPath, 'sounds'), {
  setHeaders: (res, path) => {
    console.log(`Serving sound file: ${path}`);
    res.setHeader('Content-Type', path.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week
  }
}));

// For any other request, serve the React app (handle client-side routing)
app.get('*', (req, res) => {
  const indexPath = path.join(staticFilesPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log(`Serving index.html for path: ${req.originalUrl}`);
    res.sendFile(indexPath);
  } else {
    console.error(`Error: index.html not found at ${indexPath}`);
    res.status(500).send('Frontend files not found. Please build the frontend first or check container paths.');
  }
});

// Start server on specified host and port to make it accessible on the network
app.listen(PORT, HOST, () => {
  console.log(`Server running in unified container mode at http://${HOST}:${PORT}`);
  console.log(`For local access: http://localhost:${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
  console.log(`Frontend available at: http://localhost:${PORT}`);
  // Try to get the local network IP for easier sharing
  try {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          console.log(`For network access: http://${net.address}:${PORT}`);
        }
      }
    }
  } catch (err) {
    console.log('Could not determine network IP address');
  }
});
