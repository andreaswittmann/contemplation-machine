# Meditation App Deployment Guide

This guide explains how to deploy the Meditation App using Docker. The application consists of a React frontend and a Node.js backend with persistent storage for meditation instructions and audio cache.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- OpenAI API key for text-to-speech functionality

## Environment Setup

1. Create a `.env` file in the project root directory with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## Deployment Steps

### Using Docker Compose (Recommended)

1. Build and start the containers:

```bash
docker-compose up -d
```

This command builds the frontend and backend images and starts the containers in detached mode.

2. Verify the containers are running:

```bash
docker-compose ps
```

3. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:3001/api

### Manual Deployment

If you prefer to build and run the containers manually:

1. Build and run the backend:

```bash
cd backend
docker build -t meditation-backend .
docker run -d -p 3001:3001 -e OPENAI_API_KEY=your_key_here --name meditation-backend meditation-backend
```

2. Build and run the frontend:

```bash
cd frontend
docker build -t meditation-frontend .
docker run -d -p 80:80 --name meditation-frontend meditation-frontend
```

## Data Persistence

The application uses Docker volumes to ensure data persistence:

- Meditation instructions are stored in `/app/data/instructions.json`
- Audio cache files are stored in `/app/data/audio-cache/`

These files are preserved in the `meditation-data` Docker volume, which persists across container restarts.

To inspect the volume:

```bash
docker volume inspect meditation-data
```

## Scaling Considerations

For production environments with higher load:

1. Add a load balancer in front of multiple frontend instances
2. Scale the backend using Docker Swarm or Kubernetes
3. Consider external storage solutions for audio cache files

## Troubleshooting

### Audio TTS Issues

If text-to-speech is not working:

1. Verify your OpenAI API key is correctly set in the environment variables
2. Check the backend logs for API errors:

```bash
docker-compose logs backend
```

### Network Connectivity

If the frontend cannot connect to the backend:

1. Ensure both containers are running
2. Check that the frontend environment variable `REACT_APP_API_URL` is correctly set
3. Verify network connectivity between containers:

```bash
docker network inspect meditation-network
```

### Container Restart

To restart the services:

```bash
docker-compose restart
```

## Backup and Restore

To backup your meditation data:

```bash
# Find the volume path
docker volume inspect meditation-data

# Create a backup
docker run --rm -v meditation-data:/data -v $(pwd):/backup alpine tar -czf /backup/meditation-data-backup.tar.gz -C /data .
```

To restore from backup:

```bash
docker run --rm -v meditation-data:/data -v $(pwd):/backup alpine sh -c "rm -rf /data/* && tar -xzf /backup/meditation-data-backup.tar.gz -C /data"
```