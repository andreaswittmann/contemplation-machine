# Preset Management in Meditation App

This document provides detailed information about managing presets in the Meditation App, including the new preset promotion feature introduced in version 1.5.0.

## Preset System Overview

Presets in the Meditation App allow users to save and reuse specific meditation configurations, including:

- Session duration
- Background sound selection
- Voice guidance settings
- Instruction selection and timing
- Ending behavior

The app distinguishes between two types of presets:

- **Default (System) Presets**: Pre-configured and available to all users
- **User Presets**: Created and saved by individual users

## File System Organization

The Meditation App uses a specific directory structure for preset storage:

```
meditation-app/
├── defaults/
│   └── presets/           # Default presets (individual JSON files)
└── data/
    └── presets/           # User presets (individual JSON files)
```

## Default Preset Management

Default presets are stored in the `defaults/presets/` directory as individual JSON files. These presets:

- Are available to all users
- Persist across application rebuilds
- Are copied to `data/presets/` on initial startup if they don't already exist
- Appear with a "(System)" prefix in the UI

### Preset File Format

Each preset is stored as a JSON file with the following format:

```json
{
  "id": "preset-1234567890123",
  "name": "Example Preset",
  "description": "An example meditation preset",
  "isDefault": true,
  "createdAt": "2025-04-30T12:00:00.000Z",
  "updatedAt": "2025-04-30T12:00:00.000Z",
  "config": {
    "duration": 10,
    "useVoiceGuidance": true,
    "voiceType": "openai",
    "openaiVoice": "alloy",
    "backgroundSound": "nature",
    "backgroundVolume": 0.5,
    "instructions": [
      {
        "id": "default-instruction-1",
        "playAt": 0
      }
    ],
    "endBehavior": "bell"
  }
}
```

## Working with User Presets

### Creating User Presets

1. Configure meditation settings in the app
2. Click "Save as Preset"
3. Enter a name and optional description
4. Click "Save"

User presets are stored in `data/presets/` and remain private to the local installation.

### Promoting User Presets to Default Status

The promotion feature allows users to elevate their custom presets to become default presets:

1. Open the Presets list
2. Find your custom preset
3. Click the "Promote to Default" button
4. Confirm the promotion

When a preset is promoted:
- It's copied to the `defaults/presets/` directory
- The `isDefault` property is set to `true`
- It becomes available to all users and installations

## Administrator Guide

For system administrators or organizations using the Meditation App:

### Adding Custom Default Presets

1. Create a preset through the UI
2. Promote it to default status using the "Promote to Default" button
3. The preset will be available in future deployments

### Manual Default Preset Creation

Advanced users can manually create default presets:

1. Create a JSON file following the preset format above
2. Save it in the `defaults/presets/` directory
3. Ensure it has a unique ID (format: `preset-` followed by timestamp)
4. Set `isDefault` to `true`
5. Restart the application

### Backing Up Presets

To back up all presets:

1. Copy the `defaults/presets/` directory (default presets)
2. Copy the `data/presets/` directory (user presets)

### Migrating Presets Between Installations

1. Copy preset JSON files from source installation
2. Place default presets in target's `defaults/presets/` directory
3. Place user presets in target's `data/presets/` directory
4. Restart the application

## Best Practices

- Use unique, descriptive names for presets
- Add detailed descriptions to explain the purpose of each preset
- For organizational deployments, standardize default presets
- Review and clean up unused presets periodically
- Use promotion sparingly for truly valuable configurations
- Back up preset files before major updates