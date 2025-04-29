const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

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
fs.ensureDirSync(dataDir);

// Ensure audio cache directory exists
const audioCacheDir = path.join(dataDir, 'audio-cache');
fs.ensureDirSync(audioCacheDir);

// File path for meditation instructions
const instructionsPath = path.join(dataDir, 'instructions.json');

// Initialize empty instructions file if it doesn't exist
if (!fs.existsSync(instructionsPath)) {
  fs.writeJsonSync(instructionsPath, [], { spaces: 2 });
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
  try {
    const instructions = fs.readJsonSync(instructionsPath);
    res.json(instructions);
  } catch (error) {
    console.error('Error reading instructions:', error);
    res.status(500).json({ error: 'Failed to retrieve meditation instructions' });
  }
});

// GET a single instruction by ID
app.get('/api/instructions/:id', (req, res) => {
  try {
    const instructions = fs.readJsonSync(instructionsPath);
    const instructionId = req.params.id;
    const instruction = instructions.find(i => i.id === instructionId);
    
    if (!instruction) {
      console.log(`Instruction with ID ${instructionId} not found`);
      return res.status(404).json({ error: 'Instruction file not found' });
    }
    
    res.json(instruction);
  } catch (error) {
    console.error('Error retrieving instruction by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve meditation instruction' });
  }
});

app.post('/api/instructions', (req, res) => {
  try {
    const instructions = fs.readJsonSync(instructionsPath);
    const newInstruction = {
      id: Date.now().toString(),
      name: req.body.name,
      description: req.body.description || '',
      content: req.body.content, // Multi-line text content with one instruction per line
      createdAt: new Date().toISOString()
    };
    
    instructions.push(newInstruction);
    fs.writeJsonSync(instructionsPath, instructions, { spaces: 2 });
    
    res.status(201).json(newInstruction);
  } catch (error) {
    console.error('Error saving instruction:', error);
    res.status(500).json({ error: 'Failed to save meditation instruction' });
  }
});

app.put('/api/instructions/:id', (req, res) => {
  try {
    const instructions = fs.readJsonSync(instructionsPath);
    const instructionId = req.params.id;
    const instructionIndex = instructions.findIndex(i => i.id === instructionId);
    
    if (instructionIndex === -1) {
      return res.status(404).json({ error: 'Instruction file not found' });
    }
    
    const updatedInstruction = {
      ...instructions[instructionIndex],
      name: req.body.name || instructions[instructionIndex].name,
      description: req.body.description !== undefined ? 
        req.body.description : instructions[instructionIndex].description,
      content: req.body.content || instructions[instructionIndex].content,
      updatedAt: new Date().toISOString()
    };
    
    instructions[instructionIndex] = updatedInstruction;
    fs.writeJsonSync(instructionsPath, instructions, { spaces: 2 });
    
    // Invalidate cache for this instruction ID
    invalidateInstructionCache(instructionId);
    
    res.json(updatedInstruction);
  } catch (error) {
    console.error('Error updating instruction:', error);
    res.status(500).json({ error: 'Failed to update meditation instruction' });
  }
});

app.delete('/api/instructions/:id', (req, res) => {
  try {
    const instructions = fs.readJsonSync(instructionsPath);
    const instructionId = req.params.id;
    const initialLength = instructions.length;
    
    const filteredInstructions = instructions.filter(i => i.id !== instructionId);
    
    if (filteredInstructions.length === initialLength) {
      return res.status(404).json({ error: 'Instruction file not found' });
    }
    
    fs.writeJsonSync(instructionsPath, filteredInstructions, { spaces: 2 });
    
    // Invalidate cache for this instruction ID
    invalidateInstructionCache(instructionId);
    
    res.json({ message: 'Instruction file successfully deleted' });
  } catch (error) {
    console.error('Error deleting instruction:', error);
    res.status(500).json({ error: 'Failed to delete meditation instruction' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
}

app.use(express.static(staticFilesPath));

// For any other request, serve the React app (handle client-side routing)
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(staticFilesPath, 'index.html'))) {
    res.sendFile(path.join(staticFilesPath, 'index.html'));
  } else {
    console.error(`Error: index.html not found at ${path.join(staticFilesPath, 'index.html')}`);
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
