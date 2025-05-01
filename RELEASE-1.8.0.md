# Contemplation Machine Release 1.8.0

**Release Date**: May 1, 2025

## Summary
This release focuses on improving the user experience and fixing several important issues that were reported in the previous version. We've enhanced the preset management, improved voice integration, and added quality-of-life features to make meditation sessions easier to configure and start.

## Bug Fixes and Improvements

### System Preset Protection
- Fixed: "Update Preset" button is now properly disabled for System Presets
- Added server-side validation to prevent system preset modification through API calls

### ElevenLabs Integration Enhancement
- Fixed: ElevenLabs "Save Key" now automatically refreshes the Voice List
- Improved integration between API key management and voice selection interfaces

### User Interface Improvements
- Added: "Begin Session" button on the Configuration Page for quicker access to meditation
- Enhanced navigation flow between configuration and session screens

### Duration Selection Enhancement
- Improved: Duration can now be set with direct numerical input alongside the slider
- Added quick preset buttons (5, 10, 15, 20, 30 minutes) for common meditation durations

### Audio Cache Optimization
- Fixed: Audio cache now intelligently invalidates only when specific instruction content changes
- Improved: Tracking of individual instruction lines for more efficient cache management
- Enhanced: Performance and reduced API calls by maintaining valid cached audio files

## Technical Notes
- No breaking changes to existing functionality
- Configuration files and environment setup remain compatible with previous versions
- Default presets and content unaffected by the update