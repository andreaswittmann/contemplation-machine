# Contemplation Machine Docker Image

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

## 🧘 Overview

The Contemplation Machine is a mindfulness application designed to facilitate deep contemplation through structured exposure to meaningful ideas. This Docker image provides a convenient way to run the complete application without setting up a development environment.

## 📋 Quick Start

```bash
# Pull the image
docker pull contemplationmachine/app:latest

# Create a directory for persistent data
mkdir -p ~/contemplation-data

# Run the container (default port 8088)
docker run -d \
  --name contemplation-machine \
  -p 8088:3001 \
  -v ~/contemplation-data:/app/data \
  contemplationmachine/app:latest
```

Access the application at http://localhost:8088

## 🔧 Configuration

### Environment Variables

The following environment variables can be configured:

| Variable | Description | Default |
|----------|-------------|---------|
| OPENAI_API_KEY | Your OpenAI API key for text-to-speech | None |
| ELEVENLABS_API_KEY | Your ElevenLabs API key for text-to-speech | None |

### Setting API Keys

Create a `.env` file with your API keys and mount it:

```bash
# Create .env file
cat > ~/contemplation-env << EOF
OPENAI_API_KEY=your_openai_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
EOF

# Run with API keys configured
docker run -d \
  --name contemplation-machine \
  -p 8088:3001 \
  -v ~/contemplation-data:/app/data \
  -v ~/contemplation-env:/app/.env \
  contemplationmachine/app:latest
```

### Changing the Port

The container internally runs on port 3001, but you can map it to any port on your host:

```bash
# Map to port 9000 on your host
docker run -d \
  --name contemplation-machine \
  -p 9000:3001 \
  -v ~/contemplation-data:/app/data \
  contemplationmachine/app:latest
```

Access the application at http://localhost:9000

## 💾 Data Persistence

The container stores all user data in `/app/data`. To preserve your settings, presets, and custom meditations between container restarts, mount this directory as shown in the examples above.

## ✨ Features

- **Customizable meditation timer** with precise duration control
- **Voice guidance** with multiple provider options (Browser native, OpenAI, or ElevenLabs)
- **Comprehensive meditation instruction management**
- **Session configuration presets** (both default and user-created)
- **Fullscreen distraction-free** meditation mode
- **Multilingual support** (currently English and German)

## 🐳 Docker Compose

To use with docker-compose:

```yaml
version: '3.8'

services:
  contemplation-machine:
    image: contemplationmachine/app:latest
    ports:
      - "8088:3001"
    volumes:
      - ./data:/app/data
      - ./.env:/app/.env  # Optional: Mount your env file
    restart: unless-stopped
```

## 🔗 Links

- [GitHub Repository](https://github.com/ContemplationMachine/contemplation-machine)
- [Issue Tracker](https://github.com/ContemplationMachine/contemplation-machine/issues)

## 📜 License

This image is licensed under the [MIT License](https://github.com/ContemplationMachine/contemplation-machine/blob/main/LICENSE).