# Meditation App Release 1.2.0

**Release Date**: April 30, 2025

## Summary

Release 1.2.0 introduces a powerful new preset feature that allows users to save and load meditation configuration settings. This highly requested feature enhances the user experience by enabling quick switching between different meditation configurations without manually adjusting each setting. Users can now maintain a library of personal meditation presets customized for different needs, moods, or times of day.

## New Features

### Meditation Presets

- **Save Configuration Presets**: Users can now save their current meditation configuration settings as a named preset with a custom description
- **Load Configuration Presets**: Users can instantly load previously saved presets to quickly configure a meditation session
- **Preset Management**: A new interface for browsing, viewing, and deleting saved presets
- **Persistent Storage**: All presets are stored on disk and preserved across application restarts

## Technical Implementation

### Backend Changes

- New file-based storage system for presets in `/data/presets` directory
- New API endpoints for preset CRUD operations:
  - `GET /api/presets` - List all available presets
  - `POST /api/presets` - Create a new preset
  - `GET /api/presets/:id` - Get a specific preset
  - `PUT /api/presets/:id` - Update a preset
  - `DELETE /api/presets/:id` - Delete a preset

### Frontend Changes

- New `PresetContext` for managing preset state and operations
- UI components for preset management:
  - "Save as Preset" modal with name and description fields
  - Preset list component with load and delete options
  - Preset loading interface integrated into the Configuration View
- Extended API service with preset operations
- Integration with existing `MeditationConfigContext` for applying loaded presets

### Data Structure

Each preset is stored as a JSON file with the following structure:

```json
{
  "id": "unique-preset-id",
  "name": "Morning Relaxation",
  "description": "A gentle 15-minute morning meditation with calm voice guidance",
  "createdAt": "2025-04-28T08:30:00.000Z", 
  "updatedAt": "2025-04-29T08:30:00.000Z",
  "config": {
    "duration": 15,
    "bellAtStart": true,
    "bellAtEnd": true,
    "useVoiceGuidance": true,
    "voiceType": "openai",
    "openaiVoice": "nova",
    "elevenlabsVoiceId": "21m00Tcm4TlvDq8ikWAM",
    "selectedInstructionId": "instruction-file-id-123"
  }
}
```

## Upgrade Instructions

1. Stop any existing containers:
   ```bash
   docker-compose down
   ```

2. Pull the latest code:
   ```bash
   git pull
   ```

3. Rebuild and start the unified container:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

## User Guide

### Saving a Preset

1. Configure your meditation settings as desired in the Settings page
2. Click the "Save as Preset" button
3. Enter a name and optional description for your preset
4. Click "Save" to store your preset

### Loading a Preset

1. Navigate to the Settings page
2. Click the "Load Preset" button or open the presets panel
3. Browse the list of available presets
4. Click "Load" on your desired preset to apply those settings

### Managing Presets

1. Open the presets panel from the Settings page
2. Browse your saved presets
3. View preset details including name, description, and settings
4. Delete unwanted presets using the delete option

## Known Limitations

- Presets are currently stored locally on the server and not synchronized across devices
- Presets include all settings and cannot be partially applied
- If a meditation instruction file referenced in a preset is deleted, the preset will reset to default instructions

## Future Enhancements

- Preset categorization and tagging
- Preset sharing between users
- Partial preset application (applying only selected settings)
- Preset export/import functionality

---

This release improves the meditation experience by enabling users to quickly switch between different meditation configurations, making the app more versatile and user-friendly.