# Meditation App Release 1.1.0

**Release Date**: April 29, 2025

## Summary

This release represents a significant architectural improvement to the Meditation App, simplifying the deployment model by consolidating the frontend and backend components into a single container. This unified approach reduces complexity, improves resource utilization, and eliminates cross-origin request issues.

## Key Changes

### Architectural Improvements

- **Single Container Architecture**: Consolidated frontend and backend into a unified Docker container
- **Simplified Networking**: Eliminated container-to-container communication
- **Improved Resource Utilization**: Reduced overhead from running two separate containers
- **Path Detection**: Added automatic detection of frontend files in both development and Docker environments

### Development Workflow Enhancements

- **Dev Script**: Added `dev.sh` script for easier local development
- **Proxy Configuration**: Configured frontend development server to proxy API requests to the backend
- **Environment Detection**: Server automatically detects if running in development or Docker environment

### Docker Configuration

- **Unified Dockerfile**: Created a multi-stage build process for both frontend and backend
- **Path Verification**: Added build-time verification of directory structure
- **Improved Error Handling**: Better error messages when frontend files cannot be located

### Documentation

- **Updated README**: Comprehensive documentation of the new architecture
- **Development Guide**: Added instructions for local development and testing
- **Deployment Instructions**: Updated deployment procedures for the unified container

## Benefits

- **Simplified Deployment**: Single container is easier to deploy and manage
- **Eliminated CORS Issues**: Frontend and backend now share the same origin
- **Improved Development Experience**: Seamless development workflow with the dev script
- **Reduced Resource Usage**: Lower memory and CPU overhead
- **Better Error Handling**: More informative error messages during startup

## Known Issues

1. **"Error: Load failed" on Initial Access**: Some users may encounter an "Error: Load failed" message when first accessing the application in the browser. This appears to be related to how certain resources are loaded in the React application, particularly audio files or specific assets.

   **Workarounds**:
   - Perform a hard refresh in the browser (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear browser cache and reload the application
   - Try accessing the application in Chrome's Incognito mode or Firefox's Private Browsing mode
   - For developers: Check the browser's developer console to identify which specific resources are failing to load

   **Long-term fix**: We're investigating this issue and will address it in a future patch release. It appears to be related to how the React application handles asset loading in the Docker environment rather than an issue with the server's static file handling.

## Upgrade Instructions

1. Stop any existing containers:
   ```
   docker-compose down
   ```

2. Pull the latest code:
   ```
   git pull
   ```

3. Rebuild and start the unified container:
   ```
   docker-compose build
   docker-compose up -d
   ```

4. Verify the application is running:
   ```
   curl http://localhost:8088/api/health
   ```

## Environment Variables

Required environment variables remain the same:
- `OPENAI_API_KEY`: For text-to-speech functionality
- `ELEVENLABS_API_KEY`: For enhanced voice options (optional)