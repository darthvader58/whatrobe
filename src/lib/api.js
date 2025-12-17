const API_BASE = import.meta.env.PROD 
  ? 'https://whatrobe-api.rajayshashwat.workers.dev/api'
  : 'http://localhost:8788/api';

// Helper function to get full image URL
export function getImageUrl(imageUrl) {
  try {
    if (!imageUrl) {
      console.log('No image URL provided');
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
    
    // Extract the image ID from any URL format
    let imageId = null;
    if (typeof imageUrl === 'string') {
      // Match /api/images/[id] pattern in any URL
      const match = imageUrl.match(/\/api\/images\/([^/?#]+)/);
      if (match) {
        imageId = match[1];
      }
    }
    
    // If we found an image ID, construct the URL based on current environment
    if (imageId) {
      const baseUrl = import.meta.env.PROD 
        ? 'https://whatrobe-api.rajayshashwat.workers.dev'
        : 'http://localhost:8788';
      const fullUrl = `${baseUrl}/api/images/${imageId}`;
      console.log('Constructed URL for image ID', imageId, ':', fullUrl);
      return fullUrl;
    }
    
    // If it's already a full URL without /api/images/ pattern, return as is
    if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      console.log('Using full URL as is:', imageUrl);
      return imageUrl;
    }
    
    console.log('Returning image URL as is:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Error processing image URL:', error);
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  }
}

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // If no user is authenticated, use a session-based anonymous ID
  let userId = 'anonymous';
  if (user && user.id) {
    userId = user.id;
    console.log('Using authenticated user ID:', userId);
  } else {
    // Create a session-based anonymous ID that persists during the session
    let sessionId = sessionStorage.getItem('anonymous_session_id');
    if (!sessionId) {
      sessionId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('anonymous_session_id', sessionId);
      console.log('Created new anonymous session ID:', sessionId);
    } else {
      console.log('Using existing anonymous session ID:', sessionId);
    }
    userId = sessionId;
  }
  
  console.log('Making API call to:', `${API_BASE}${endpoint}`, 'with user ID:', userId);
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// Get all clothing items
export async function getClothingItems(filters = {}) {
  const params = new URLSearchParams(filters);
  return apiCall(`/clothing?${params}`);
}

// Get a single clothing item
export async function getClothingItem(id) {
  return apiCall(`/clothing/${id}`);
}

// Upload a new clothing item
export async function uploadClothingItem(file) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // Use the same user ID logic as apiCall
  let userId = 'anonymous';
  if (user && user.id) {
    userId = user.id;
  } else {
    let sessionId = sessionStorage.getItem('anonymous_session_id');
    if (!sessionId) {
      sessionId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('anonymous_session_id', sessionId);
    }
    userId = sessionId;
  }
  
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/clothing`, {
    method: 'POST',
    headers: {
      'X-User-ID': userId,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  return response.json();
}

// Update a clothing item
export async function updateClothingItem(id, updates) {
  return apiCall(`/clothing/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// Delete a clothing item
export async function deleteClothingItem(id) {
  return apiCall(`/clothing/${id}`, {
    method: 'DELETE',
  });
}

// Get outfit recommendations
export async function getOutfitRecommendations(preferences = {}) {
  return apiCall('/outfits/recommend', {
    method: 'POST',
    body: JSON.stringify(preferences),
  });
}

// Save an outfit as favorite
export async function saveFavoriteOutfit(outfit) {
  return apiCall('/outfits/favorites', {
    method: 'POST',
    body: JSON.stringify({ outfit }),
  });
}

// Get favorite outfits
export async function getFavoriteOutfits() {
  return apiCall('/outfits/favorites');
}

// Delete a favorite outfit
export async function deleteFavoriteOutfit(outfitId) {
  return apiCall(`/outfits/favorites/${outfitId}`, {
    method: 'DELETE',
  });
}

// Get shopping recommendations
export async function getShoppingRecommendations(wardrobeItems) {
  return apiCall('/shop/recommendations', {
    method: 'POST',
    body: JSON.stringify({ wardrobeItems }),
  });
}

// Clear anonymous session data when user signs in
export function clearAnonymousSession() {
  sessionStorage.removeItem('anonymous_session_id');
}