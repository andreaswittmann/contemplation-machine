# Contemplation Machine

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

## Introduction

Contemplation Machine is an open-source mindfulness application designed to help users establish and maintain a meditation practice with minimal complexity. With a focus on accessibility and customization, the application delivers guided meditation sessions with different voice options and configurable content while maintaining a clean, distraction-free interface.

Originally developed as a private project, Contemplation Machine is now open source, inviting contributions from the mindfulness and developer communities to extend its capabilities and reach.

**The Art of Contemplation:**
The Contemplation Machine is a simple meditation app with a powerful purpose: to facilitate deep contemplation through structured exposure to meaningful ideas.

At its core, the app takes any set of instructions or contemplative statements and evenly distributes them across your chosen meditation timeframe, delivering them through high-quality text-to-speech. This simple approach serves a profound function.

Contemplation works like a magnifying glass focusing sunlight on paper - when held steady long enough, ignition occurs. Similarly, when the mind rests on a single thought, verse, or question for an extended period, a natural deepening occurs. Without effort, understanding penetrates beyond the surface, revealing layers of meaning inaccessible through casual reading.

This differs from active analytical thinking, which moves constantly from point to point. In contemplation, we hold the mind steady on one subject, allowing insight to emerge organically. Both active thinking and contemplative focus serve as stages of meditative deepening (Jhanas), but each operates differently.

The Contemplation Machine offers a structured container for this practice, whether you're working with personal goals, wisdom teachings, philosophical questions, or any content worthy of deeper reflection. It creates the conditions for your natural wisdom to emerge through the simple power of sustained attention.

## Features

### Core Features
- Customizable meditation timer with precise duration control
- Voice guidance with multiple provider options
- Session configuration presets (both default and user-created)
- Comprehensive meditation instruction management
- Audio cues for session start/end
- Fullscreen distraction-free meditation mode
- Multilingual support (currently English and German)

### Voice Guidance Options
- Browser native Text-to-Speech (no API key required)
- OpenAI Text-to-Speech API
- ElevenLabs Text-to-Speech API

### Preset Management
- Save and load meditation configurations
- Custom names and descriptions
- Quick switching between presets
- Update and delete capabilities
- Unified interface across pages

## Installation

### Prerequisites
- Node.js 18 or higher
- Docker (for containerized deployment)
- OpenAI API key (optional)
- ElevenLabs API key (optional)

### Local Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/contemplation-machine.git
   cd contemplation-machine
   ```

2. Install dependencies:
   ```
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   ```
   # At project root
   cp sample.env .env
   ```
   Edit the `.env` file with your preferred configuration and API keys (if applicable).

4. Start the development servers:
   ```
   # Start backend server
   cd backend
   npm start
   
   # In a separate terminal, start frontend server
   cd frontend
   npm start
   ```

### Docker Deployment

1. Clone the repository and navigate to the project directory.

2. Configure your environment:
   ```
   cp sample.env .env
   ```
   Edit the `.env` file with your preferred configuration.

3. Build and start the containers:
   ```
   docker-compose up -d
   ```

4. Access the application at `http://localhost:3000`

For detailed instructions see:
- [API Key Setup](./backend/API_KEY_INSTRUCTIONS.md)
- [Deployment Guide](./Deployment.md)

## User Guide

### Getting Started

1. **Launch the application** - Access via your browser at localhost:3000 (or your configured domain)
2. **Configure your session** - Adjust the duration, voice settings, and choose guided instructions
3. **Create or select a preset** - Choose from default presets or create your own
4. **Begin meditation** - Start your session and follow the guided instructions
5. **End session** - When complete, you can end manually or wait for the timer to finish

### Voice Configuration

**Browser Native TTS**
- No configuration required
- Uses your browser's built-in text-to-speech capabilities
- Quality and voice options will vary by browser/device

**OpenAI TTS**
- Requires OpenAI API key
- Configure through the settings page
- Offers high-quality natural voices

**ElevenLabs TTS**
- Requires ElevenLabs API key
- Configure through the settings page
- Provides natural-sounding, customizable voices

### Creating Custom Meditations

1. Navigate to the Instructions page
2. Click "Add New Instruction"
3. Provide a name, description, and the instruction content
4. Format your content with section headers using the "Section Name - " format
5. Save your custom instruction
6. Use it in any meditation session by selecting it from the dropdown

## Development

### Technical Architecture

#### Frontend (React)
- Single page application
- Context-based state management
- Responsive design
- Component-based architecture

#### Backend (Node.js)
- Express.js server
- File-based storage
- REST API endpoints
- Audio file caching

#### Data Storage
- JSON files for instructions
- JSON files for presets
- Cached audio files
- Local storage for preferences

### Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details on how to get involved.

All contributors are expected to adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

Contemplation Machine is licensed under the [MIT License](./LICENSE).

## Architecture Diagram

![Contemplation Machine Architecture](./assets/meditation-app-architecture.png)

*For the latest updates and changes, please refer to the [Release Notes](./RELEASE-1.8.0.md).*