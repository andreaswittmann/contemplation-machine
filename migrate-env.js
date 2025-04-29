#!/usr/bin/env node

/**
 * Migration script to move environment variables from backend/.env to root .env
 * 
 * This script is part of the Meditation App Release 1.4.0 which centralizes
 * the environment configuration into a single .env file at the project root.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Set up file paths
const oldEnvPath = path.join(__dirname, 'backend', '.env');
const newEnvPath = path.join(__dirname, '.env');
const sampleEnvPath = path.join(__dirname, '.env.sample');

// Set up readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Meditation App Environment Migration Tool');
console.log('----------------------------------------');
console.log('This script will migrate your environment configuration from backend/.env to a root-level .env file.');

// Function to read the contents of a file if it exists
function readFileIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
  }
  return null;
}

// Function to parse .env file into key-value pairs
function parseEnvFile(content) {
  if (!content) return {};
  
  const envVars = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }
    
    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    }
  }
  
  return envVars;
}

// Function to create or update .env file
function createEnvFile(filePath, envVars, sampleContent) {
  try {
    let content = '';
    
    // If we have a sample file, use it as a template
    if (sampleContent) {
      content = sampleContent;
      
      // Replace variables in the sample with actual values
      for (const [key, value] of Object.entries(envVars)) {
        const regex = new RegExp(`${key}=.*`, 'g');
        if (content.match(regex)) {
          content = content.replace(regex, `${key}=${value}`);
        } else {
          // If the key doesn't exist in the sample, add it
          content += `\n${key}=${value}`;
        }
      }
    } else {
      // Without a sample, just create key=value pairs
      for (const [key, value] of Object.entries(envVars)) {
        content += `${key}=${value}\n`;
      }
    }
    
    fs.writeFileSync(filePath, content);
    return true;
  } catch (err) {
    console.error(`Error creating file ${filePath}:`, err);
    return false;
  }
}

// Main migration function
async function migrateEnv() {
  // Read the old .env file
  const oldEnvContent = readFileIfExists(oldEnvPath);
  
  if (!oldEnvContent) {
    console.log('\nNo existing backend/.env file found.');
    
    // If we have a sample, we can still create a new .env
    const sampleEnvContent = readFileIfExists(sampleEnvPath);
    if (sampleEnvContent) {
      console.log('Would you like to create a new root .env file from the sample? (y/n)');
      const answer = await new Promise(resolve => rl.question('> ', resolve));
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        fs.copyFileSync(sampleEnvPath, newEnvPath);
        console.log(`Created new .env file from sample at ${newEnvPath}`);
        console.log('Please update it with your API keys and configuration.');
      } else {
        console.log('No .env file created. You can manually create one later.');
      }
    } else {
      console.log('No sample .env file found either. Please manually create a .env file at the project root.');
    }
    
    rl.close();
    return;
  }
  
  // Parse the old .env file
  const oldEnvVars = parseEnvFile(oldEnvContent);
  
  // Check if the new .env file already exists
  if (fs.existsSync(newEnvPath)) {
    console.log('\nA root .env file already exists.');
    console.log('Would you like to merge the backend .env values into it? (y/n)');
    const answer = await new Promise(resolve => rl.question('> ', resolve));
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Migration canceled. Your existing files remain unchanged.');
      rl.close();
      return;
    }
    
    // Read and parse the existing new .env
    const newEnvContent = readFileIfExists(newEnvPath);
    const newEnvVars = parseEnvFile(newEnvContent);
    
    // Merge the environment variables, giving priority to the old ones
    const mergedEnvVars = { ...newEnvVars, ...oldEnvVars };
    
    // Create the merged .env file
    const sampleEnvContent = readFileIfExists(sampleEnvPath);
    const success = createEnvFile(newEnvPath, mergedEnvVars, sampleEnvContent);
    
    if (success) {
      console.log(`Successfully merged backend/.env values into root .env file at ${newEnvPath}`);
      
      console.log('\nWould you like to create a backup of your backend/.env file? (y/n)');
      const backupAnswer = await new Promise(resolve => rl.question('> ', resolve));
      
      if (backupAnswer.toLowerCase() === 'y' || backupAnswer.toLowerCase() === 'yes') {
        const backupPath = `${oldEnvPath}.backup`;
        fs.copyFileSync(oldEnvPath, backupPath);
        console.log(`Created backup at ${backupPath}`);
      }
      
      console.log('\nWould you like to remove the old backend/.env file? (y/n)');
      const removeAnswer = await new Promise(resolve => rl.question('> ', resolve));
      
      if (removeAnswer.toLowerCase() === 'y' || removeAnswer.toLowerCase() === 'yes') {
        fs.unlinkSync(oldEnvPath);
        console.log(`Removed old environment file at ${oldEnvPath}`);
      }
    } else {
      console.error('Failed to create merged .env file.');
    }
  } else {
    // No existing .env at root, create a new one
    const sampleEnvContent = readFileIfExists(sampleEnvPath);
    const success = createEnvFile(newEnvPath, oldEnvVars, sampleEnvContent);
    
    if (success) {
      console.log(`Created new root .env file at ${newEnvPath} with values from backend/.env`);
      
      console.log('\nWould you like to remove the old backend/.env file? (y/n)');
      const removeAnswer = await new Promise(resolve => rl.question('> ', resolve));
      
      if (removeAnswer.toLowerCase() === 'y' || removeAnswer.toLowerCase() === 'yes') {
        fs.unlinkSync(oldEnvPath);
        console.log(`Removed old environment file at ${oldEnvPath}`);
      } else {
        console.log(`Left the old environment file intact at ${oldEnvPath}`);
        console.log('Note: The application will now use the root .env file instead.');
      }
    } else {
      console.error('Failed to create new .env file.');
    }
  }
  
  rl.close();
}

// Start the migration process
migrateEnv().catch(err => {
  console.error('An error occurred during migration:', err);
  rl.close();
});