# Meditation App Version Management

## Versioning Scheme

We follow a simplified [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
  - **MAJOR**: Significant changes or redesigns
  - **MINOR**: New features
  - **PATCH**: Bug fixes and minor improvements

## Current Version

Current version: 1.1.0

## Development Process

1. Work directly on `main` for small changes
2. Create a `feature/*` branch only for larger features that might take multiple days
3. After testing locally, merge feature branches back to `main`
4. Increment version number in this file whenever you make a meaningful update
5. Tag significant releases with `v1.2.3` format tags

## Releases

### Version 1.1.0 - April 29, 2025

#### Summary

This release represents a significant architectural improvement to the Meditation App, simplifying the deployment model by consolidating the frontend and backend components into a single container. This unified approach reduces complexity, improves resource utilization, and eliminates cross-origin request issues.

#### Key Changes

##### Architectural Improvements

- **Single Container Architecture**: Consolidated frontend and backend into a unified Docker container
- **Simplified Networking**: Eliminated container-to-container communication
- **Improved Resource Utilization**: Reduced overhead from running two separate containers
- **Path Detection**: Added automatic detection of frontend files in both development and Docker environments

##### Development Workflow Enhancements

- **Dev Script**: Added `dev.sh` script for easier local development
- **Proxy Configuration**: Configured frontend development server to proxy API requests to the backend
- **Environment Detection**: Server automatically detects if running in development or Docker environment

##### Docker Configuration

- **Unified Dockerfile**: Created a multi-stage build process for both frontend and backend
- **Path Verification**: Added build-time verification of directory structure
- **Improved Error Handling**: Better error messages when frontend files cannot be located

##### Documentation

- **Updated README**: Comprehensive documentation of the new architecture
- **Development Guide**: Added instructions for local development and testing
- **Deployment Instructions**: Updated deployment procedures for the unified container

#### Benefits

- **Simplified Deployment**: Single container is easier to deploy and manage
- **Eliminated CORS Issues**: Frontend and backend now share the same origin
- **Improved Development Experience**: Seamless development workflow with the dev script
- **Reduced Resource Usage**: Lower memory and CPU overhead
- **Better Error Handling**: More informative error messages during startup

#### Known Issues

None at this time.

#### Upgrade Instructions

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

#### Environment Variables

Required environment variables remain the same:
- `OPENAI_API_KEY`: For text-to-speech functionality
- `ELEVENLABS_API_KEY`: For enhanced voice options (optional)

### Version 1.0.0 - April 29, 2025

Initial release of the Meditation App with the following features:
- Frontend and backend in separate containers
- Voice guidance with OpenAI and ElevenLabs integration
- Meditation timer with configurable session parameters
- Instruction management with CRUD operations
- Audio caching for improved performance