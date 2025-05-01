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



# Issues to address
- "Update Preset" must not work on System Presets
- ElevenLabs "Save Key" should update the Voice List.
- Configuaration Page should have an alternative "Begin Session" button.
- The Duration Slider on the Confiuration Page is hard to handle. I need a more precise Input Method.
- If on line of a instruction get's updated the cache is data/audio-cache does not invalidate the correspondint sound file.