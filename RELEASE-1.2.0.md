# Meditation App Release 1.2.0

**Release Date**: April 29, 2025

## Summary

Release 1.2.0 introduces a powerful new preset feature that allows users to save and load meditation configuration settings, along with significant UI improvements for a more consistent user experience. This highly requested feature enhances the user experience by enabling quick switching between different meditation configurations without manually adjusting each setting. Users can now maintain a library of personal meditation presets customized for different needs, moods, or times of day.

## New Features

### Meditation Presets

- **Save Configuration Presets**: Users can now save their current meditation configuration settings as a named preset with a custom description
- **Load Configuration Presets**: Users can instantly load previously saved presets to quickly configure a meditation session
- **Preset Management**: A new interface for browsing, viewing, and deleting saved presets
- **Persistent Storage**: All presets are stored on disk and preserved across application restarts

### UI Improvements

- **Harmonized Interface**: Consistent preset selection UI between Meditate and Settings pages
- **Improved Preset Controls**: Streamlined preset management with intuitive dropdown selection
- **Enhanced Description Display**: Clear visibility of preset descriptions and last update times
- **Simplified Workflow**: Unified approach to creating, updating, and managing presets
- **Responsive Design**: Mobile-friendly layout for all preset management features

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
  - Unified preset dropdown selector across pages
  - "Save as Preset" modal with name and description fields
  - Preset list component with load and delete options
  - Improved preset management interface in Configuration View
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

## User Guide

### Saving a Preset

1. Configure your meditation settings as desired in the Settings page
2. Click the "Save as New Preset" button
3. Enter a name and optional description for your preset
4. Click "Save" to store your preset

### Loading a Preset

1. Use the preset dropdown selector in either the Meditate or Settings page
2. Select your desired preset from the list
3. The configuration will be automatically applied

### Managing Presets

1. Use the preset dropdown to select and load presets
2. Update the current preset using the "Update Preset" button
3. Create new presets using "Save as New Preset"
4. View preset details including name, description, and last update time
5. Clear the current preset selection using the "Clear" button

## Known Limitations

- Presets are currently stored locally on the server and not synchronized across devices
- Presets include all settings and cannot be partially applied
- If a meditation instruction file referenced in a preset is deleted, the preset will reset to default instructions

## Future Enhancements

- Preset categorization and tagging
- Preset sharing between users
- Partial preset application (applying only selected settings)
- Preset export/import functionality
- Cloud synchronization of presets
- Preset search and filtering

---

This release significantly improves the meditation experience by enabling users to quickly switch between different meditation configurations and providing a more consistent, intuitive interface across the application.