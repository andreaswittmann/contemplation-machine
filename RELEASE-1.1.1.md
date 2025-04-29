# Meditation App Patch Release 1.1.1

**Release Date**: April 29, 2025

## Summary

This patch release addresses a critical issue that caused the application to fail when running in the Docker container environment. Users were experiencing an "Error: Load failed" message in the user interface due to incorrect API URL configuration.

## Issue Details

When the application was running in the Docker container, it was attempting to connect to `http://localhost:3001/api` for backend API requests instead of using a relative URL. In a Docker container, this URL points to the host machine, not to the internal service, which caused all API requests to fail.

## Fix Implementation

The key change is in the frontend API service configuration:

```typescript
// Before
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// After
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = isDevelopment
  ? (process.env.REACT_APP_API_URL || 'http://localhost:3001/api')
  : '/api'; // In production/Docker, use a relative path
```

This ensures that when running in a production environment (like our Docker container), the API calls use relative URLs which will correctly resolve to the same server that's serving the frontend.

## Additional Improvements

1. **Enhanced Error Handling**: Added better error handling for network issues with more descriptive error messages
2. **Improved Debugging**: Added detailed logging of the environment mode and API URL configuration

## Affected Files

- `frontend/src/services/ApiService.ts`

## Upgrade Instructions

1. Stop any existing containers:
   ```bash
   docker-compose down
   ```

2. Pull the latest code:
   ```bash
   git pull
   ```

3. Rebuild and start the unified container:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

## Verification Steps

After upgrading, you can verify the fix by:

1. Opening the application in a browser at http://localhost:8088
2. Checking that meditation instructions load properly
3. Reviewing the browser console logs to confirm API requests are using relative paths

## Known Issues

None at this time. This patch resolves the "Error: Load failed" issue that was present in version 1.1.0.