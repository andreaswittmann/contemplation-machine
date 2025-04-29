# Meditation App Architecture Document

## Introduction

The Meditation App is designed as a simple yet comprehensive mindfulness application that helps users establish and maintain a meditation practice. Following a minimalist architectural approach, the application delivers guided meditation sessions with customizable content while maintaining low technical complexity. This document outlines the proposed architecture that prioritizes simplicity, reliability, and ease of maintenance.

The application is structured as a single-page web application with a lightweight backend that handles data persistence through file-based storage, eliminating the need for a complex database setup. This approach creates a maintainable system that can be easily containerized and deployed.

## System Architecture

### High-Level Overview

The system follows a simplified two-tier architecture:

1. **Frontend Layer**: Single-page React application for user interface
2. **Backend Layer**: Lightweight Node.js server with file-based persistence

![Meditation App Architecture Diagram](./assets/meditation-app-architecture.png)

*Note: To view the full architecture diagram, please export the `meditation-app-architecture.drawio` file as a PNG image and place it in the assets folder.*

<!-- Original ASCII diagram preserved for reference
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  React Frontend │◄────►  Node.js Backend│
│  (Single Page)  │     │  (Express)      │
│                 │     │                 │
└─────────────────┘     └────────┬────────┘
│
┌────────▼────────┐
│                 │
│  JSON File      │
│  Storage        │
│                 │
└─────────────────┘
-->

## Frontend Architecture

### Component Structure

1. **App Container**: Main application with routing logic
   - Conditional rendering between views
   - Shared layout elements (header/footer)

2. **Core View Components**:
   - **ConfigurationView**: Session configuration interface
   - **SessionView**: Active meditation timer and visualization
   - **InstructionsManagerView**: CRUD interface for meditation content

### State Management

- **React Context API** with multiple contexts:
  - `MeditationConfigContext`: Session parameters and settings
  - `InstructionsContext`: Meditation content management
  - `SessionContext`: Active session state
  - `InstructionFilesContext`: Management of instruction files

## Backend Architecture

### Server Components

- **Express.js Server**: Lightweight API endpoints
- **File System Module**: Direct interaction with JSON storage
- **OpenAI Integration**: API wrapper for TTS functionality

### API Endpoints

- `GET /api/instructions`: Retrieve meditation instruction files
- `POST /api/instructions`: Create new instruction file
- `PUT /api/instructions/:id`: Update existing instruction file
- `DELETE /api/instructions/:id`: Remove instruction file
- `POST /api/tts`: Generate speech from text using OpenAI

## Feature Implementation

### Meditation Configuration

- User-configurable parameters stored in Context and localStorage
- Settings persist across sessions
- Immediate application of settings without page reload
- Selection of instruction file for meditation session

### Meditation Timer

- React-based timer implementation using `useEffect` and `setInterval`
- Sequential presentation of instructions from selected file
- Audio cue system for session start/end with Web Audio API
- Visual progress indicators synchronized with timer

### Voice Guidance

- Dual implementation supporting:
  - Browser-native TTS (Web Speech API)
  - OpenAI TTS API integration
- Settings toggle to switch between voice engines
- Pre-calculation of all voice events at session start

### Instruction Management

- File-based persistence for meditation instructions
- Each instruction file contains multiple lines of text, with each line representing one meditation instruction
- Instructions are presented sequentially during meditation
- Users can create, edit, and delete instruction files
- Users select which instruction file to use for each meditation session
- Optimistic UI updates with error handling

## Data Persistence Strategy

- **JSON File Storage**: Server-side storage of meditation instructions
- **Data Structure**: 
  - Collection of instruction files
  - Each file contains a multi-line text block with one instruction per line
  - Metadata includes file name, description, and creation/update timestamps
- **File Operations**: Atomic file operations to prevent corruption
- **Client-Side Caching**: localStorage for user preferences and session recovery

## Deployment Architecture

- **Docker Container**: Single container deployment
- **Volume Mounting**: External volume for JSON data persistence
- **Environment Variables**: Configuration for OpenAI API keys and app settings

## Implementation Considerations

- **Error Handling**: Robust error handling for API calls and file operations
- **Responsive Design**: Tailwind CSS implementation for all screen sizes
- **Performance Optimization**: Minimal re-renders in React components
- **Accessibility**: Screen reader support for meditation instructions

This architecture provides a complete solution for the Meditation App while maintaining simplicity and avoiding unnecessary technical complexity.


# Implementation Phases for Meditation App

I recommend a 4-phase implementation plan that allows for incremental development with testable milestones:

## Phase 1: Foundation & Basic Functionality
- Setup project structure (React frontend, Node.js backend)
- Implement core UI components and navigation
- Create basic meditation timer with start/stop functionality
- Develop simple meditation configuration interface
- Establish initial API endpoints structure
- Implement basic file-based storage for settings

## Phase 2: Content Management & Persistence
- Complete instruction file management UI (create, edit, delete)
- Implement file-based persistence for meditation instruction files
- Develop data structure for storing meditation content with multi-line instructions
- Create API endpoints for instruction file CRUD operations
- Add basic error handling and validation
- Implement localStorage backup for user preferences

## Phase 3: Timer & Audio Integration
- Enhance timer with sequential instruction presentation
- Implement audio cues (start/end gongs)
- Develop browser-based TTS integration
- Create OpenAI TTS API integration
- Build voice guidance timing system
- Implement settings for voice type selection
- Add session progress visualization

# Phase 3 Implementation Progress

We've successfully implemented several key features in Phase 3:

## Enhanced Audio System
- Integrated OpenAI TTS API for high-quality speech synthesis
- Added audio caching system to improve performance and reduce API calls
- Implemented hash-based file storage for efficient audio file management
- Created endpoints for cache management and diagnostics

## Multi-Device Support
- Enhanced CORS configuration to enable cross-device compatibility
- Implemented stateless server architecture allowing multiple concurrent users
- Server configured to listen on all network interfaces (0.0.0.0)
- Added response headers for improved cross-origin resource sharing

## Timer & Instruction Presentation
- Developed sequential instruction presentation system
- Implemented proper timing mechanisms for guided meditation flow
- Added progress visualization during meditation sessions
- Synchronized audio cues with meditation progress

## Voice Settings
- Created voice configuration options in settings panel
- Implemented voice selection functionality (different voices/accents)
- Added controls for speech rate and volume adjustments
- Voice preference persistence across sessions

## Performance Optimizations
- Implemented client-side caching to reduce server load
- Added audio file caching to minimize TTS API calls
- Optimized React component rendering for smoother experience
- Improved state management with context providers

These Phase 3 improvements have transformed the application into a fully functional meditation app with professional voice guidance capabilities, robust multi-device support, and optimized performance.

## Phase 4: Refinement & Deployment
- Optimize responsive design for all device sizes
- Implement comprehensive error handling
- Add final UI polish and transitions
- Create Docker containerization
- Implement volume mounting for persistent data
- Conduct performance optimization
- Complete documentation and deployment guide

# Phase 4 Implementation Progress

We've successfully completed the final phase of the Meditation App implementation, focusing on refinement and deployment readiness:

## Responsive Design Optimization
- Implemented comprehensive media queries for mobile, tablet, and desktop devices
- Created CSS variable system for responsive spacing and typography
- Optimized touch targets (44px minimum) for better mobile experience
- Added special handling for landscape orientation on small screens
- Applied responsive container classes throughout the application

## Comprehensive Error Handling
- Created React ErrorBoundary component to catch and handle UI errors gracefully
- Implemented retry logic with exponential backoff for API requests
- Added fallback mechanisms from OpenAI TTS to browser speech synthesis
- Enhanced API error responses with user-friendly messages
- Added structured error logging for better debugging

## UI Polish and Transitions
- Added smooth animations for page transitions and component mounting
- Implemented meditation-specific visual effects like breathing animations
- Enhanced interactive elements with hover and active states
- Created staggered animations for list elements
- Optimized motion for reduced motion preferences

## Docker Containerization
- Created optimized Dockerfiles for both frontend and backend services
- Set up docker-compose orchestration with proper service networking
- Implemented volume mounting for persistent data storage
- Added Nginx configuration with performance optimizations
- Configured environment variable support for secure deployment

## Performance Optimization
- Added server monitoring capabilities for memory usage and performance
- Implemented enhanced cache management with age-based cleanup options
- Optimized static asset delivery with compression and cache headers
- Improved resource cleanup for audio playback
- Added API endpoint performance metrics

## Documentation
- Created detailed deployment guide with Docker instructions
- Added troubleshooting steps for common issues
- Included backup and restore procedures for data safety
- Documented system architecture and implementation details
- Created Phase 4 completion summary

The completion of Phase 4 marks the readiness of our Meditation App for production deployment. The application now provides a polished user experience across all device types, with robust error handling, performance optimizations, and a well-documented deployment process.