# API Key Setup for Contemplation Machine

This contemplation application uses both OpenAI's and ElevenLabs' Text-to-Speech (TTS) APIs for generating voice guidance during contemplation sessions. To enable these functionalities, you need to add your API keys.

## How to Add Your API Keys

1. Open the `.env` file in the backend directory (or create it by copying `sample.env` if it doesn't exist)

2. Replace the placeholder values with your actual API keys:
   ```
   OPENAI_API_KEY=sk-your-actual-openai-api-key-goes-here
   ELEVENLABS_API_KEY=your-actual-elevenlabs-api-key-goes-here
   ```

3. Save the file.

4. Restart the backend server for the changes to take effect.

## Getting an OpenAI API Key

If you don't have an OpenAI API key yet:

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to API keys section in your account dashboard
4. Click "Create new secret key"
5. Give your key a name (e.g., "Contemplation Machine")
6. Copy the key immediately (OpenAI will only show it once)

## Getting an ElevenLabs API Key

If you don't have an ElevenLabs API key yet:

1. Go to [https://elevenlabs.io](https://elevenlabs.io)
2. Sign in or create an account
3. Navigate to your Profile Settings
4. Find the "API" section
5. Copy your API key (or generate a new one if needed)

## Security Note

- Never commit your `.env` file with real API keys to version control
- Keep your API keys secret and don't share them publicly
- The `.env` file should already be listed in your `.gitignore` file

## Testing the API Keys

After adding your API keys and restarting the server:

1. Go to the Contemplation Machine
2. In Configuration, enable voice guidance
3. Select either "OpenAI TTS" or "ElevenLabs TTS" as the voice type
4. Choose a voice from the available options
5. Start a contemplation session
6. You should hear high-quality voice instructions

If you encounter any issues, check the browser console and server logs for error messages.