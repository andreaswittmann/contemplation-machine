# Unified Dockerfile for Contemplation Machine
# Build stage for the React frontend
FROM node:18-alpine as frontend-build

WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source files
COPY frontend/ ./

# Build the React app
RUN npm run build && echo "Frontend build completed"

# Build stage for the backend
FROM node:18-alpine

WORKDIR /app

# Copy root level .env file if it exists (using a safer approach)
COPY .env* ./
# The file might not exist, but that's ok - Docker will just skip it without error

# Copy VERSION.md for version endpoint
COPY VERSION.md ./

# Install backend dependencies first
COPY backend/package*.json ./
RUN npm install

# Copy backend files
COPY backend/ ./

# Create audio cache directory
RUN mkdir -p ./data/audio-cache
RUN chmod -R 755 ./data

# Create frontend directory and copy the built frontend from the frontend-build stage
RUN mkdir -p /app/frontend/build
COPY --from=frontend-build /app/frontend/build /app/frontend/build

# List directories to verify the structure
RUN ls -la /app && ls -la /app/frontend && ls -la /app/frontend/build || echo "Build directory not created properly"

# Expose port for the unified app - this is a documentation feature only
EXPOSE 8088 3001

# Set environment variables
ENV PORT=3001
ENV NODE_ENV=production

# Set Volume for persistent data
VOLUME [ "/app/data" ]

# Command to run the server
CMD ["node", "server.js"]