# Meditation App Release 1.5.0

**Release Date**: May 1, 2025

## Summary

Release 1.5.0 enhances the user experience with significant visual and functional improvements to the meditation interface. The update introduces a custom Buddha logo, implements better responsive design for meditation sessions, and improves the preset management system with a "Promote to Default" feature.

## Breaking Changes

- **Removed Language Code Parameter**: The `language_code` parameter has been removed from both backend and frontend to simplify the voice synthesis process. All text-to-speech operations now use the default language setting for the selected voice.

## New Features

### Visual Identity Enhancement
- Added Buddha lotus logo as the application's visual identity
- Improved header design with centered logo presentation
- Enhanced visual branding across the application

### Responsive Meditation Interface
- Implemented full-width meditation view that automatically scales with the window size
- Optimized text display for better readability on all screen sizes
- Enhanced typography with responsive font sizes for meditation instructions
- Improved layout for meditation controls and timer display

### Preset Management Improvements
- Added "Promote to Default" functionality allowing users to convert their personal presets to system defaults
- Enhanced preset list display with clearer visual hierarchy
- Improved preset management modal accessibility

### User Interface Refinements
- Updated version display in footer (now showing "Meditation App - Version 1.5.0")
- Improved user feedback during meditation session transitions
- Enhanced visual cohesion across different views

### Preset Promotion System
- Users can now promote their custom presets to become default presets. This feature allows users to:
  - Convert custom presets to default presets that persist across application rebuilds
  - Share well-crafted meditation configurations with all users
  - Access promoted presets automatically on fresh installations

### Improved Default Configuration Management
- The application now supports storing default presets as individual files in the `defaults/presets` directory
- Individual preset files are easier to manage, version, and distribute than a single JSON file
- Server automatically merges default presets with user customizations on startup

## Concept Overview

This release introduces a new system for managing default settings and user customizations in the Meditation App. The main focus is on improving the way we handle instructions, presets, and their persistence.

### Key Features

1. **Default Settings Management**
   - Application ships with default instructions and presets
   - Default settings stored in separate configuration files
   - Seamless merging of defaults with user customizations
   - Support for promoting user presets to defaults

2. **File System Integration**
   - All user data is persisted to the server file system:
     - Custom settings
     - User-created presets
     - Modified instructions
     - Audio cache files

3. **Container Integration**
   - Default configurations are bundled within the container
   - Ensures consistent initial setup across deployments

4. **Code Optimizations**
   - Simplified text-to-speech API calls by removing unnecessary language parameters
   - Improved type safety in frontend components
   - Streamlined configuration interface
   - Audio cache now used even when API keys are missing

### Technical Implementation

### Frontend Changes
- Modified App.tsx to implement logo and responsive container behavior
- Enhanced SessionView component to utilize available screen space better
- Updated CSS with improved responsive design principles
- Added dynamic class application based on application state

### Backend Changes
- Implemented new API endpoint for preset promotion
- Enhanced preset storage and retrieval with isDefault flag support
- Updated documentation to reflect new preset management capabilities

### Asset Additions
- Added Buddha lotus logo image file
- Optimized image assets for faster loading

### Default settings files location: `/defaults/`
  - `instructions.json`
  - `presets/` directory for individual preset JSON files
- User data storage: `/data/`
  - Custom instructions and presets
  - Audio cache storage
- Runtime behavior:
  - On startup, default settings are merged with user customizations
  - User changes are persisted to the file system
  - Audio files are cached locally for improved performance
  - Default audio cache is copied on first run to ensure immediate functionality

### Data Persistence

The `/data` directory is configured as a Docker volume to ensure persistence across container rebuilds. This includes:
- User-customized instructions
- Custom presets
- Audio cache files
- API keys and configuration

This setup ensures that:
1. User customizations are preserved even when updating or rebuilding the application container
2. The audio cache remains intact, preventing unnecessary re-downloads
3. All user-specific settings persist independently of the container lifecycle

The default settings in `/defaults` are part of the container image and serve as initial values for new installations.

## User Manual

### Using Default Presets and Audio Caching

The meditation app now includes several quality-of-life improvements designed to enhance your experience. This section explains how to use these new features.

#### Audio Cache Support Without API Keys

The application now uses cached audio files even when API keys are not configured:

1. **First-Time Setup**
   - On initial startup, the app copies default audio files to the cache
   - These cached audio files work immediately without requiring API keys

2. **Using Cached Audio**
   - All previously generated audio is available offline
   - When you start a meditation with voice guidance, the app will:
     - Check the cache first
     - Use the cached audio if available
     - Only call the API if the audio doesn't exist in the cache

3. **Benefits**
   - Works offline once content is cached
   - Reduced API usage and costs
   - Faster startup of meditation sessions
   - Eliminates repeated generation of the same audio content

#### Working with Presets

Presets allow you to save and reuse your favorite meditation configurations:

1. **Using Default Presets**
   - Select "Presets" from the main menu
   - Default presets are marked with "(System)" prefix
   - Click "Load" to use any preset

2. **Creating Your Own Presets**
   - Configure meditation settings (duration, instructions, voice, etc.)
   - Click "Save as Preset" button
   - Enter a name and optional description
   - Your preset will appear in the list

3. **Promoting Presets to Default Status**
   - Open the Presets list
   - Find your custom preset
   - Click the "Promote to Default" button
   - Confirm the promotion when prompted

4. **What Happens When You Promote a Preset**
   - The preset is copied to the system default presets
   - It becomes available to all users of the application
   - It will persist even if the application is reinstalled
   - It will be marked with "(System)" in the presets list

5. **When to Use Preset Promotion**
   - When you've created a preset you want to share with others
   - For configurations you want guaranteed to persist
   - To contribute to the default options available to new users
   - For organizational standardization of meditation configurations

#### Recommendation for Organizations

For organizational deployments, administrators can:
1. Set up the application with initial settings
2. Create organization-specific presets
3. Promote those presets to defaults
4. Share the configured Docker volume

This ensures all users in the organization start with the same set of default meditation options while still allowing individuals to customize their personal settings.

## User Experience Improvements

### Meditation Experience
- Larger, more readable meditation instructions during active sessions
- Cleaner, distraction-free meditation interface
- Better visual hierarchy focusing on the current instruction
- Improved timer visibility

### Preset Management
- More intuitive preset system with clearer promotion path
- Improved user control over meditation content ecosystem
- Better distinction between system and user presets

## Testing

Testing has been completed for:
- Responsive behavior across multiple device sizes
- Preset promotion functionality
- Visual display of Buddha logo across browsers
- Meditation interface scaling on various screen resolutions

## Documentation

- Updated PRESET-MANAGEMENT.md with new promotion functionality
- Updated main README.md to reference latest release
- Added comprehensive release notes

---

This release significantly improves the visual identity and user experience of the meditation app, with particular focus on the active meditation experience. The responsive design changes enhance usability on all screen sizes, while the preset promotion feature gives users more control over their meditation content.

