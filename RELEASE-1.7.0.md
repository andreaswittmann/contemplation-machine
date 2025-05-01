# Meditation App Release 1.7.0

**Release Date**: May 1, 2025

## Summary
This release introduces a refreshed set of default meditation presets and instructions, providing users with a more diverse and comprehensive meditation experience right out of the box. The update includes both English and German language options, covering different meditation styles and techniques to suit various preferences and needs.

## New Default Content

### Updated Default Presets
Our application now includes four carefully curated default meditation presets:

1. **Full Body Awareness - ElevenLabs-Autumn Veil (English)**
   - A 15-minute mindful breathing meditation for present moment awareness
   - Uses the soothing Autumn Veil voice from ElevenLabs
   - Perfect for beginners and experienced meditators alike

2. **Achtsamkeit auf den Atem - ElevenLabs-Emanuel (Deutsch)**
   - A 24-minute breath awareness meditation in German
   - Uses the Emanuel voice from ElevenLabs
   - Based on the "Cultivating Emotional Balance" course

3. **Mental Woop - ElevenLabs-Jameson (English)**
   - A 10-minute structured contemplation based on the WOOP technique (Wish-Outcome-Obstacle-Plan)
   - Uses the Jameson voice from ElevenLabs
   - Excellent for goal setting and mental contrasting

4. **Metta-Sutta OpenAI-Shimmer (Deutsch)**
   - A 10-minute loving-kindness meditation in German
   - Uses OpenAI's gentle Shimmer voice
   - Based on the traditional Metta Sutta (Discourse on Loving-Kindness)

### Updated Default Instructions
The release includes comprehensive instruction scripts for each meditation type:

1. **Full Body Awareness**
   - Focuses on breath awareness, relaxation, and mindful release of thoughts
   - Includes guidance on posture, attention, and managing distractions

2. **Achtsamkeit auf den Atem (Stabilität)**
   - Detailed German guidance for breath awareness meditation
   - Includes sections on motivation, body awareness, breath regulation, and maintaining attention

3. **Mental Woop**
   - Structured contemplation technique with four clear stages:
     - Wish: Identifying a meaningful goal
     - Outcome: Visualizing successful fulfillment
     - Obstacle: Recognizing internal barriers
     - Plan: Creating an if-then strategy to overcome obstacles

4. **Metta-Sutta**
   - German translation of the traditional loving-kindness meditation text
   - Guides practitioners through extending goodwill to themselves and all beings

## Benefits
- More diverse meditation options catering to different preferences and needs
- Multilingual support with both English and German content
- Different meditation durations (10, 15, and 24 minutes) to fit various schedules
- Variety of voice options using both ElevenLabs and OpenAI technologies

## Technical Notes
- Default content is packaged with the application container image
- No additional configuration required to access these presets

## Issues to Address for Next Release

### 1. System Preset Protection
**Issue:** "Update Preset" functionality currently works on System Presets, which should be protected from modification.  
**Proposed Solution:** Add a preset type flag to distinguish between user-created and system presets. Disable the "Update" button for system presets in the UI and add server-side validation to reject modification requests for system presets.  
**Implementation:**  
- Add `isSystemPreset` boolean flag to preset data model
- Update frontend to conditionally render or disable the "Update" button based on this flag
- Add validation logic in the backend API endpoint that handles preset updates

### 2. ElevenLabs Integration Enhancement  
**Issue:** The "Save Key" functionality for ElevenLabs doesn't currently trigger a refresh of the available Voice List.  
**Proposed Solution:** Implement automatic Voice List refresh after API key validation and saving.  
**Implementation:**  
- Modify the key saving logic to immediately fetch the updated voice list after successful key validation
- Add a loading state during the voice list refresh process
- Implement error handling for cases where voice list fetching fails

### 3. Configuration Page Navigation Improvement  
**Issue:** The Configuration Page lacks an alternative "Begin Session" button, requiring users to navigate elsewhere to start meditation.  
**Proposed Solution:** Add a prominent "Begin Session" button to the Configuration Page that allows users to immediately start a meditation session with current settings.  
**Implementation:**  
- Add the button in a visually accessible location on the Configuration Page
- Ensure the button triggers the same session start flow as the existing method
- Update UI styling to maintain visual hierarchy and design consistency

### 4. Duration Input Precision  
**Issue:** The Duration Slider on the Configuration Page is difficult to manipulate precisely.  
**Proposed Solution:** Add a numeric input field alongside the slider to allow for exact time specification.  
**Implementation:**  
- Add a number input field that displays the current duration in minutes/seconds
- Implement two-way binding between the slider and numeric input
- Add validation to ensure values stay within allowed minimum/maximum bounds
- Consider adding preset duration buttons (5, 10, 15, 20 min) for quick selection

### 5. Audio Cache Invalidation  
**Issue:** Audio cache does not properly invalidate when a single line of an instruction is updated.  
**Proposed Solution:** Implement a more robust cache invalidation mechanism based on content hashing rather than just filename.  
**Implementation:**  
- Modify the caching mechanism to create hashes based on the full instruction content
- Ensure instruction text changes trigger regeneration of the corresponding audio files
- Add logging for cache invalidation events to aid in troubleshooting
- Consider adding a manual "Regenerate Audio" option for administrators