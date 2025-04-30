// ApiService.ts
// Centralized API service for making requests to the backend

// Get the base API URL based on environment
// When in production (like in Docker), use a relative path
// In development, use the environment variable or localhost fallback
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = isDevelopment
  ? (process.env.REACT_APP_API_URL || 'http://localhost:3001/api')
  : '/api'; // In production/Docker, use a relative path

// Fallback URL in case the proxy fails
const FALLBACK_API_BASE_URL = 'http://localhost:3001/api';

// Log the API URL for debugging
console.log(`API Service initialized with base URL: ${API_BASE_URL}`);
console.log(`Environment mode: ${process.env.NODE_ENV || 'not set'}`);
console.log(`Fallback URL (if proxy fails): ${FALLBACK_API_BASE_URL}`);

// Function to build a full API URL from an endpoint path
export const getApiUrl = (endpoint: string): string => {
  // Make sure the endpoint doesn't start with a slash to avoid double slashes
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${API_BASE_URL}/${normalizedEndpoint}`;
  console.log(`Built API URL for endpoint "${endpoint}": ${url}`);
  return url;
};

// Add enhanced error handling for network issues
const handleNetworkError = (error: any, operation: string, url: string) => {
  // Log detailed error information
  console.error(`[API-${operation}] Network error for ${url}:`, error);
  
  // Create more descriptive error message for users
  let errorMessage = `Network error while ${operation.toLowerCase()}. `;
  
  if (error.message && error.message.includes('Failed to fetch')) {
    errorMessage += 'The server may be unavailable or there might be network connectivity issues. ' +
                   'Please check your connection and try again.';
  } else if (error instanceof TypeError) {
    errorMessage += `Type error: ${error.message}`;
  } else {
    errorMessage += error.message || 'Unknown error occurred';
  }
  
  // Return a more informative error
  const enhancedError = new Error(errorMessage);
  enhancedError.name = 'NetworkError';
  return enhancedError;
};

// Generic GET request function
export const apiGet = async <T>(endpoint: string): Promise<T> => {
  const url = getApiUrl(endpoint);
  console.log(`[API-GET] Fetching from ${url}`);
  
  try {
    const response = await fetch(url);
    
    // Handle non-2xx responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API-GET] Error response from ${url}:`, errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data as T;
  } catch (error) {
    // If there's a network error (likely due to proxy issues), try the fallback URL
    if (error instanceof Error && 
       (error.name === 'TypeError' || error.message.includes('Failed to fetch'))) {
      console.log(`[API-GET] Primary request failed, trying fallback URL`);
      try {
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        const fallbackUrl = `${FALLBACK_API_BASE_URL}/${normalizedEndpoint}`;
        console.log(`[API-GET] Using fallback URL: ${fallbackUrl}`);
        
        const fallbackResponse = await fetch(fallbackUrl);
        
        if (!fallbackResponse.ok) {
          const fallbackErrorText = await fallbackResponse.text();
          console.error(`[API-GET] Error response from fallback ${fallbackUrl}:`, fallbackErrorText);
          throw new Error(`API Error: ${fallbackResponse.status} ${fallbackResponse.statusText} - ${fallbackErrorText}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        return fallbackData as T;
      } catch (fallbackError) {
        console.error(`[API-GET] Fallback request also failed:`, fallbackError);
        // Enhanced error handling for the fallback request
        throw handleNetworkError(fallbackError, 'GET', endpoint);
      }
    }
    
    // Enhanced error handling
    if (!(error instanceof Error) || !error.message.startsWith('API Error:')) {
      throw handleNetworkError(error, 'GET', url);
    }
    console.error(`[API-GET] Error fetching from ${url}:`, error);
    throw error;
  }
};

// Generic POST request function
export const apiPost = async <T>(endpoint: string, body: any): Promise<T> => {
  const url = getApiUrl(endpoint);
  console.log(`[API-POST] Posting to ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Handle non-2xx responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API-POST] Error response from ${url}:`, errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data as T;
  } catch (error) {
    // If there's a network error (likely due to proxy issues), try the fallback URL
    if (error instanceof Error && 
       (error.name === 'TypeError' || error.message.includes('Failed to fetch'))) {
      console.log(`[API-POST] Primary request failed, trying fallback URL`);
      try {
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        const fallbackUrl = `${FALLBACK_API_BASE_URL}/${normalizedEndpoint}`;
        console.log(`[API-POST] Using fallback URL: ${fallbackUrl}`);
        
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        
        if (!fallbackResponse.ok) {
          const fallbackErrorText = await fallbackResponse.text();
          console.error(`[API-POST] Error response from fallback ${fallbackUrl}:`, fallbackErrorText);
          throw new Error(`API Error: ${fallbackResponse.status} ${fallbackResponse.statusText} - ${fallbackErrorText}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        return fallbackData as T;
      } catch (fallbackError) {
        console.error(`[API-POST] Fallback request also failed:`, fallbackError);
        // Enhanced error handling for the fallback request
        throw handleNetworkError(fallbackError, 'POST', endpoint);
      }
    }
    
    console.error(`[API-POST] Error posting to ${url}:`, error);
    throw handleNetworkError(error, 'POST', url);
  }
};

// Generic PUT request function
export const apiPut = async <T>(endpoint: string, body: any): Promise<T> => {
  const url = getApiUrl(endpoint);
  console.log(`[API-PUT] Putting to ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Handle non-2xx responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API-PUT] Error response from ${url}:`, errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data as T;
  } catch (error) {
    // If there's a network error (likely due to proxy issues), try the fallback URL
    if (error instanceof Error && 
       (error.name === 'TypeError' || error.message.includes('Failed to fetch'))) {
      console.log(`[API-PUT] Primary request failed, trying fallback URL`);
      try {
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        const fallbackUrl = `${FALLBACK_API_BASE_URL}/${normalizedEndpoint}`;
        console.log(`[API-PUT] Using fallback URL: ${fallbackUrl}`);
        
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        
        if (!fallbackResponse.ok) {
          const fallbackErrorText = await fallbackResponse.text();
          console.error(`[API-PUT] Error response from fallback ${fallbackUrl}:`, fallbackErrorText);
          throw new Error(`API Error: ${fallbackResponse.status} ${fallbackResponse.statusText} - ${fallbackErrorText}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        return fallbackData as T;
      } catch (fallbackError) {
        console.error(`[API-PUT] Fallback request also failed:`, fallbackError);
        throw handleNetworkError(fallbackError, 'PUT', endpoint);
      }
    }
    
    console.error(`[API-PUT] Error putting to ${url}:`, error);
    throw handleNetworkError(error, 'PUT', url);
  }
};

// Generic DELETE request function
export const apiDelete = async (endpoint: string): Promise<void> => {
  const url = getApiUrl(endpoint);
  console.log(`[API-DELETE] Deleting from ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    // Handle non-2xx responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API-DELETE] Error response from ${url}:`, errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error) {
    // If there's a network error (likely due to proxy issues), try the fallback URL
    if (error instanceof Error && 
       (error.name === 'TypeError' || error.message.includes('Failed to fetch'))) {
      console.log(`[API-DELETE] Primary request failed, trying fallback URL`);
      try {
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        const fallbackUrl = `${FALLBACK_API_BASE_URL}/${normalizedEndpoint}`;
        console.log(`[API-DELETE] Using fallback URL: ${fallbackUrl}`);
        
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'DELETE',
        });
        
        if (!fallbackResponse.ok) {
          const fallbackErrorText = await fallbackResponse.text();
          console.error(`[API-DELETE] Error response from fallback ${fallbackUrl}:`, fallbackErrorText);
          throw new Error(`API Error: ${fallbackResponse.status} ${fallbackResponse.statusText} - ${fallbackErrorText}`);
        }
        
        return;
      } catch (fallbackError) {
        console.error(`[API-DELETE] Fallback request also failed:`, fallbackError);
        throw handleNetworkError(fallbackError, 'DELETE', endpoint);
      }
    }
    
    console.error(`[API-DELETE] Error deleting from ${url}:`, error);
    throw handleNetworkError(error, 'DELETE', url);
  }
};

// Export all API functions
export default {
  getApiUrl,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
};