FROM node:18-alpine as build

WORKDIR /app

# Install dependencies first (for better layer caching)
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Build the application and verify the build output
RUN npm run build && ls -la build/ && ls -la build/static/

# Production stage
FROM nginx:alpine

# Copy built files from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Verify the files were copied correctly
RUN ls -la /usr/share/nginx/html/ && ls -la /usr/share/nginx/html/static/ || echo "Static directory not found"

# Copy our custom NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a simple health check file
RUN echo "Meditation App is running" > /usr/share/nginx/html/health.html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]