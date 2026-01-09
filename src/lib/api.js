const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8787/api'
  : 'https://whatrobe-api.rajayshashwat.workers.dev/api';

export function getImageUrl(imageUrl) {
  try {
    if (!imageUrl) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
    
    let imageId = null;
    if (typeof imageUrl === 'string') {
      const match = imageUrl.match(/\/api\/images\/([^/?#]+)/);
      if (match) {
        imageId = match[1];
      }
    }
    
    if (imageId) {
      const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8787'
        : 'https://whatrobe-api.rajayshashwat.workers.dev';
      return `${baseUrl}/api/images/${imageId}`;
    }
    
    if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      return imageUrl;
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error processing image URL:', error);
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  }
}

async function apiCall(endpoint, options = {}) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
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

  const data = await response.json();
  
  if (endpoint === '/clothing' && options.method !== 'DELETE') {
    const backupKey = `wardrobe_backup_${userId}`;
    localStorage.setItem(backupKey, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }));
  }
  
  return data;
}

export async function getClothingItems(filters = {}) {
  const params = new URLSearchParams(filters);
  const data = await apiCall(`/clothing?${params}`);
  
  if (Array.isArray(data) && data.length === 0) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.id || sessionStorage.getItem('anonymous_session_id') || 'anonymous';
    const backupKey = `wardrobe_backup_${userId}`;
    const backup = localStorage.getItem(backupKey);
    
    if (backup) {
      try {
        const backupData = JSON.parse(backup);
        if (Date.now() - backupData.timestamp < 3600000) {
          return Array.isArray(backupData.data) ? backupData.data : [backupData.data];
        }
      } catch (error) {
        console.error('Error parsing backup data:', error);
      }
    }
  }
  
  return data;
}

// Get a single clothing item
export async function getClothingItem(id) {
  return apiCall(`/clothing/${id}`);
}

export async function uploadClothingItem(file) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
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

// Migrate anonymous user data to authenticated user
export async function migrateUserData(fromUserId, toUserId) {
  return apiCall('/migrate/user-data', {
    method: 'POST',
    body: JSON.stringify({ fromUserId, toUserId }),
  });
}