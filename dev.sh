#!/bin/bash

# Development script for running both frontend and backend servers

# Get the absolute path to the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Check for required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Warning: OPENAI_API_KEY environment variable is not set"
  echo "Voice generation features using OpenAI will not work"
fi

if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "Warning: ELEVENLABS_API_KEY environment variable is not set"
  echo "Voice generation features using ElevenLabs will not work"
fi

# Print startup message
echo "Starting Meditation App in development mode..."
echo "Frontend will run on: http://localhost:3000"
echo "Backend will run on:  http://localhost:3001"
echo ""
echo "Using the proxy configuration, all API calls from the frontend"
echo "will automatically be forwarded to the backend API"
echo ""

# Function to kill background processes on exit
cleanup() {
  echo ""
  echo "Shutting down servers..."
  kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
  exit 0
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

# Start backend server
echo "Starting backend server..."
cd "$SCRIPT_DIR/backend" && npm run dev &
BACKEND_PID=$!

# Wait a moment to ensure backend has started
sleep 2

# Start frontend server
echo "Starting frontend server..."
cd "$SCRIPT_DIR/frontend" && npm start &
FRONTEND_PID=$!

# Wait for either process to exit
wait $FRONTEND_PID $BACKEND_PID

# Clean up
cleanup