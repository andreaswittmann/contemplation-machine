const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');

// Configuration for encryption
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const rawKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
// Create a 32-byte key using SHA256
const ENCRYPTION_KEY = crypto.createHash('sha256').update(rawKey).digest();
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const AUTH_TAG_LENGTH = 16;

// Path to the API keys storage file
const API_KEYS_PATH = path.join(__dirname, '../data/api-keys.json');

// Ensure the keys file exists
const ensureKeysFile = () => {
  if (!fs.existsSync(API_KEYS_PATH)) {
    fs.writeJsonSync(API_KEYS_PATH, {}, { spaces: 2 });
  }
};

// Encrypt a string value
const encryptValue = (value) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

// Decrypt a string value
const decryptValue = (encryptedValue) => {
  try {
    const parts = encryptedValue.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted value format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    return null;
  }
};

// Save API keys to file
const saveApiKeys = (keys) => {
  ensureKeysFile();
  
  const encryptedKeys = {};
  
  // Encrypt each key before saving
  Object.entries(keys).forEach(([service, data]) => {
    if (data && data.key) {
      encryptedKeys[service] = {
        ...data,
        key: encryptValue(data.key),
        encrypted: true
      };
    } else {
      encryptedKeys[service] = data;
    }
  });
  
  fs.writeJsonSync(API_KEYS_PATH, encryptedKeys, { spaces: 2 });
};

// Load API keys from file
const loadApiKeys = () => {
  ensureKeysFile();
  
  try {
    const encryptedKeys = fs.readJsonSync(API_KEYS_PATH);
    const decryptedKeys = {};
    
    // Decrypt each key
    Object.entries(encryptedKeys).forEach(([service, data]) => {
      if (data && data.key && data.encrypted) {
        decryptedKeys[service] = {
          ...data,
          key: decryptValue(data.key),
          encrypted: false
        };
      } else {
        decryptedKeys[service] = data;
      }
    });
    
    return decryptedKeys;
  } catch (error) {
    console.error('Error loading API keys:', error);
    return {};
  }
};

// Get a specific API key
const getApiKey = (service) => {
  const keys = loadApiKeys();
  return keys[service] ? keys[service].key : null;
};

// Set a specific API key
const setApiKey = (service, key, metadata = {}) => {
  const keys = loadApiKeys();
  
  keys[service] = {
    key,
    lastUpdated: new Date().toISOString(),
    validated: false,
    ...metadata
  };
  
  saveApiKeys(keys);
};

// Delete a specific API key
const deleteApiKey = (service) => {
  const keys = loadApiKeys();
  
  if (keys[service]) {
    delete keys[service];
    saveApiKeys(keys);
    return true;
  }
  
  return false;
};

// Update key validation status
const updateKeyValidation = (service, isValid) => {
  const keys = loadApiKeys();
  
  if (keys[service]) {
    keys[service].validated = isValid;
    keys[service].lastValidated = new Date().toISOString();
    saveApiKeys(keys);
    return true;
  }
  
  return false;
};

// Get all API key statuses (without the actual keys)
const getApiKeyStatuses = () => {
  const keys = loadApiKeys();
  const statuses = {};
  
  Object.entries(keys).forEach(([service, data]) => {
    statuses[service] = {
      exists: !!data.key,
      validated: data.validated || false,
      lastValidated: data.lastValidated || null,
      lastUpdated: data.lastUpdated || null
    };
  });
  
  return statuses;
};

module.exports = {
  getApiKey,
  setApiKey,
  deleteApiKey,
  updateKeyValidation,
  getApiKeyStatuses
};