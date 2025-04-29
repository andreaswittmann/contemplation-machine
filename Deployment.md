# Meditation App Deployment Guide

## Unified Container Deployment

This application uses a single-container architecture that incorporates both the frontend and backend components.

### Requirements

- Docker and Docker Compose
- Environment variables for API keys:
  - `OPENAI_API_KEY` (required for TTS functionality)
  - `ELEVENLABS_API_KEY` (optional for enhanced voice options)

### Deployment Steps

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd meditation-app
   ```

2. Set up environment variables:
   ```bash
   # Create .env file from sample
   cp backend/sample.env .env
   
   # Edit the .env file with your API keys
   # OPENAI_API_KEY=your_openai_api_key
   # ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

3. Build and start the container:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. Access the application:
   - Browser: http://localhost:8088
   - API endpoints: http://localhost:8088/api

### Updating the Application

To update to a new version:

1. Pull the latest code:
   ```bash
   git pull
   ```

2. Rebuild and restart the container:
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

## Development Mode

For local development without Docker:

1. Install dependencies for both frontend and backend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Run the development script:
   ```bash
   ./dev.sh
   ```

This runs both frontend and backend servers with hot reload capability.

## Troubleshooting

### "Error: Load failed" Issue

Some users may encounter an "Error: Load failed" message when accessing the application in the browser. This is typically related to how certain assets (particularly audio files) are loaded.

#### Debugging Steps

1. **Check browser console for specific errors**
   - Open developer tools (F12 or right-click > Inspect)
   - Look at the Console tab for detailed error messages about which files failed to load

2. **Verify Docker logs**
   ```bash
   docker-compose logs -f
   ```
   - Look for "Serving static file" messages to confirm files are being served
   - Check for any 404 (Not Found) or 500 (Server Error) responses

3. **Verify file paths in the container**
   ```bash
   docker-compose exec meditation-app ls -la /app/frontend/build
   docker-compose exec meditation-app ls -la /app/frontend/build/sounds
   ```

4. **Try these workarounds**:
   - Perform a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear browser cache and reload
   - Access the app in Incognito/Private browsing mode
   - Try a different browser

5. **Check network requests**
   - In browser developer tools, go to the Network tab
   - Reload the page and look for failed requests (red items)
   - Note the paths of failed resources

#### Advanced Troubleshooting

If you need to access the container to perform deeper debugging:

```bash
# Access container shell
docker-compose exec meditation-app sh

# Check environment variables
env | grep API_KEY

# Verify node process is running
ps aux | grep node

# Check files in the data directory
ls -la /app/data
```

### Other Common Issues

1. **API Keys Not Working**
   - Verify the environment variables are correctly set in `.env` file
   - Check if keys are valid and have necessary permissions

2. **Audio Generation Fails**
   - Check OpenAI API key status and quota
   - Verify the TTS endpoints are accessible from your environment

3. **Container Fails to Start**
   - Check Docker logs for startup errors
   - Verify port 8088 is not used by another application