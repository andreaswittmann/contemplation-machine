# Meditation App Release 1.5.0

## Summary

This release introduces important improvements to the Meditation App, including a new system for managing default settings and user customizations, as well as several key optimizations and refinements to the codebase.


## Concept Overview

This release introduces a new system for managing default settings and user customizations in the Meditation App. The main focus is on improving the way we handle instructions, presets, and their persistence.

### Key Features

1. **Default Settings Management**
   - Application ships with default instructions and presets
   - Default settings stored in separate configuration files
   - Seamless merging of defaults with user customizations

2. **File System Integration**
   - All user data is persisted to the server file system:
     - Custom settings
     - User-created presets
     - Modified instructions
     - Audio cache files

3. **Container Integration**
   - Default configurations are bundled within the container
   - Ensures consistent initial setup across deployments

### Technical Implementation

- Default settings files location: `/defaults/`
  - `instructions.json`
  - `presets.json`
- User data storage: `/data/`
  - Custom instructions and presets
  - Audio cache storage
- Runtime behavior:
  - On startup, default settings are merged with user customizations
  - User changes are persisted to the file system
  - Audio files are cached locally for improved performance

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

