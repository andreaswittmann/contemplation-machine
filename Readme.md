# Meditation App Documentation

## Introduction

The Meditation App is designed as a simple yet comprehensive mindfulness application that helps users establish and maintain a meditation practice. Following a minimalist architectural approach, the application delivers guided meditation sessions with customizable content while maintaining low technical complexity.

## Features

### Core Features
- Customizable meditation timer
- Voice guidance with multiple provider options
- Session configuration presets
- Meditation instruction management
- Audio cues for session start/end
- Fullscreen meditation mode

### Voice Guidance Options
- Browser native Text-to-Speech
- OpenAI Text-to-Speech API
- ElevenLabs Text-to-Speech API

### Preset Management
- Save and load meditation configurations
- Custom names and descriptions
- Quick switching between presets
- Update and delete capabilities
- Unified interface across pages

## Technical Architecture

### Frontend (React)
- Single page application
- Context-based state management
- Responsive design
- Component-based architecture

### Backend (Node.js)
- Express.js server
- File-based storage
- REST API endpoints
- Audio file caching

### Data Storage
- JSON files for instructions
- JSON files for presets
- Cached audio files
- Local storage for preferences

### Configuration
- Centralized environment configuration (`.env` file at project root)
- API key management through the user interface
- Unified configuration for both backend and frontend services

## Implementation Status

All planned phases have been successfully completed:

### Phase 1: Foundation ✓
- Basic application structure
- Core UI components
- Simple meditation timer
- Initial API endpoints

### Phase 2: Content Management ✓
- Instruction file management
- File-based persistence
- Data structure implementation
- API endpoint completion

### Phase 3: Audio Integration ✓
- Enhanced timer functionality
- Audio cue implementation
- Voice guidance integration
- Progress visualization

### Phase 4: Refinement & Deployment ✓
- Configuration preset system
- UI harmonization
- Responsive design optimization
- Error handling improvements
- Docker containerization
- Performance optimization
- Documentation completion

### Phase 5: Experience Enhancement ✓
- Consistent user interface design
- Responsive SessionView component
- Fullscreen meditation mode
- Improved text handling for different screen sizes

## Getting Started

### Prerequisites
- Node.js 18 or higher
- Docker (for containerized deployment)
- OpenAI API key (optional)
- ElevenLabs API key (optional)

### Environment Setup
1. Copy `.env.sample` to `.env` at the project root
2. Edit `.env` and set your API keys and configuration options
3. If upgrading from a previous version, run `./migrate-env.js` to migrate settings

### Development Setup
1. Clone the repository
2. Install dependencies for backend and frontend
3. Set up environment variables as described above
4. Run development server

For detailed instructions see:
- [API Key Setup](./backend/API_KEY_INSTRUCTIONS.md)
- [Deployment Guide](./Deployment.md)
- [Latest Release Notes](./RELEASE-1.6.0.md)

## Architecture Diagram

![Meditation App Architecture](./assets/meditation-app-architecture.png)

*For the latest updates and changes, please refer to the VERSION.md file.*