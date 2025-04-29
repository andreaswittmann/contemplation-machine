const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

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

// ElevenLabs API base URL
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Enhanced CORS configuration
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Cache preflight request for 1 day
}));

app.use(express.json());

// Add additional headers to all responses for cross-device compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
debugLog(`Setting up data directory: ${dataDir}`);
fs.ensureDirSync(dataDir);

// Ensure audio cache directory exists
const audioCacheDir = path.join(dataDir, 'audio-cache');
debugLog(`Setting up audio cache directory: ${audioCacheDir}`);
fs.ensureDirSync(audioCacheDir);

// Ensure presets directory exists
const presetsDir = path.join(dataDir, 'presets');
debugLog(`Setting up presets directory: ${presetsDir}`);
fs.ensureDirSync(presetsDir);

// Define OpenAI voice descriptions
const openAIVoiceDescriptions = {
  'alloy': 'Alloy - Versatile, balanced voice',
  'echo': 'Echo - Clear, confident voice',
  'fable': 'Fable - Warm, soft-spoken voice',
  'onyx': 'Onyx - Deep, authoritative voice',
  'nova': 'Nova - Bright, friendly voice',
  'shimmer': 'Shimmer - Gentle, soothing voice'
};

// File path for meditation instructions
const instructionsPath = path.join(dataDir, 'instructions.json');
debugLog(`Instructions file path: ${instructionsPath}`);

// Initialize empty instructions file if it doesn't exist
if (!fs.existsSync(instructionsPath)) {
  debugLog('Instructions file does not exist, creating empty file');
  fs.writeJsonSync(instructionsPath, [], { spaces: 2 });
  debugLog('Created empty instructions file');
} else {
  debugLog('Instructions file already exists');
  try {
    const stats = fs.statSync(instructionsPath);
    debugLog(`Instructions file size: ${stats.size} bytes, last modified: ${stats.mtime}`);
    
    // Check if file is readable and parse its content
    const instructionsContent = fs.readJsonSync(instructionsPath);
    debugLog(`Instructions file contains ${instructionsContent.length} entries`);
  } catch (error) {
    debugLog(`Error reading instructions file: ${error.message}`, error);
  }
}

// Helper function to generate a unique hash for text + voice + provider
const generateAudioFileHash = (text, voice, provider = 'openai') => {
  const hash = crypto.createHash('md5');
  hash.update(`${text}_${voice}_${provider}`);
  return hash.digest('hex');
};

// Helper function to get cached audio file path
const getCachedAudioPath = (text, voice, provider = 'openai') => {
  const hash = generateAudioFileHash(text, voice, provider);
  return path.join(audioCacheDir, `${hash}.mp3`);
};

// Helper function to check if cached audio exists
const getCachedAudio = (text, voice, provider = 'openai') => {
  const audioPath = getCachedAudioPath(text, voice, provider);
  if (fs.existsSync(audioPath)) {
    return audioPath;
  }
  return null;
};

// Create a mapping of instruction IDs to their cached audio files
let instructionAudioMap = {};

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
      }
    });
    
    // Clear the tracking for this instruction
    delete instructionAudioMap[instructionId];
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

// Track generated audio files with their instruction ID
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'alloy', instructionId, provider = 'openai' } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for TTS conversion' });
    }

    // Validate provider
    if (!['openai', 'elevenlabs'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider. Must be "openai" or "elevenlabs"' });
    }
    
    // Check if appropriate API key is configured
    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    } else if (provider === 'elevenlabs' && !process.env.ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    // Check cache first
    const cachedAudioPath = getCachedAudio(text, voice, provider);
    const audioHash = cachedAudioPath ? 
      path.basename(cachedAudioPath) : 
      generateAudioFileHash(text, voice, provider) + '.mp3';
    
    // Track this audio file with its instruction (if provided)
    if (instructionId) {
      if (!instructionAudioMap[instructionId]) {
        instructionAudioMap[instructionId] = [];
      }
      
      // Only add to tracking if not already tracked
      if (!instructionAudioMap[instructionId].includes(audioHash)) {
        instructionAudioMap[instructionId].push(audioHash);
      }
    }
    
    if (cachedAudioPath) {
      console.log(`Using cached audio for: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}" (${provider}/${voice})`);
      
      // Return cached audio file
      return res.sendFile(cachedAudioPath);
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
        // Map OpenAI voice names to ElevenLabs voice IDs or use default
        const voiceId = getElevenLabsVoiceId(voice);
        
        // Call ElevenLabs API with simplified settings
        const audioBuffer = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`, {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: text,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        });

        if (!audioBuffer.ok) {
          const error = await audioBuffer.json();
          console.error('ElevenLabs TTS API error:', error);
          return res.status(audioBuffer.status).json({ error: error.error?.message || 'Failed to generate speech with ElevenLabs' });
        }

        buffer = Buffer.from(await audioBuffer.arrayBuffer());
      } catch (elevenLabsError) {
        console.error('ElevenLabs API error:', elevenLabsError);
        return res.status(500).json({ error: 'Failed to generate speech with ElevenLabs' });
      }
    }
    
    // Save to cache
    const newAudioPath = getCachedAudioPath(text, voice, provider);
    await fs.writeFile(newAudioPath, buffer);
    
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

// Helper function to map OpenAI voice names to ElevenLabs voice IDs
const getElevenLabsVoiceId = (openaiVoice) => {
  // Default premium voices from ElevenLabs
  // Map OpenAI voices to similar ElevenLabs voices
  // These are example IDs - replace with actual ElevenLabs voice IDs
  const voiceMapping = {
    'alloy': '21m00Tcm4TlvDq8ikWAM', // Rachel
    'echo': 'AZnzlk1XvdvUeBnXmlld', // Domi
    'fable': 'EXAVITQu4vr4xnSDxMaL', // Bella
    'onyx': 'VR6AewLTigWG4xSOukaG', // Adam
    'nova': 'pNInz6obpgDQGcFmaJgB', // Elli
    'shimmer': 'jBpfuIE2acCO8z3wKNLl', // Grace
    // Add more mappings as needed
  };
  
  return voiceMapping[openaiVoice] || '21m00Tcm4TlvDq8ikWAM'; // Default to Rachel if no match
};

// Helper function to check available ElevenLabs voices
app.get('/api/elevenlabs/voices', async (req, res) => {
  try {
    // Get the limit parameter from the query string (default to all voices if not specified)
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }
    
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      method: 'GET',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching ElevenLabs voices:', errorData);
      return res.status(response.status).json({ error: 'Failed to fetch ElevenLabs voices' });
    }

    const voicesData = await response.json();
    
    // If a limit was specified and is valid, limit the number of voices returned
    if (limit && !isNaN(limit) && limit > 0) {
      voicesData.voices = voicesData.voices.slice(0, limit);
    }
    
    res.json(voicesData);
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
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
