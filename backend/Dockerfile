FROM node:18-alpine

WORKDIR /app

# Install dependencies first (for better layer caching)
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Create audio cache directory
RUN mkdir -p ./data/audio-cache

# Make sure correct permissions are set
RUN chmod -R 755 ./data

# Expose the API port
EXPOSE 3001

# Command to run the server
CMD ["node", "server.js"]