const API_BASE = 'http://localhost:8788/api';

// Helper function to get full image URL
export function getImageUrl(imageUrl) {
  try {
    console.log('Processing image URL:', imageUrl);
    if (!imageUrl) {
      console.log('No image URL provided, using placeholder');
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
    if (typeof imageUrl === 'string' && imageUrl.startsWith('/api/images/')) {
      const fullUrl = `http://localhost:8788${imageUrl}`;
      console.log('Generated full URL:', fullUrl);
      return fullUrl;
    }
    console.log('Using original URL:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Error processing image URL:', error);
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  }
}

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': user.id || 'anonymous',
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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/clothing`, {
    method: 'POST',
    headers: {
      'X-User-ID': user.id || 'anonymous',
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
export async function saveFavoriteOutfit(outfitId) {
  return apiCall('/outfits/favorites', {
    method: 'POST',
    body: JSON.stringify({ outfitId }),
  });
}

// Get favorite outfits
export async function getFavoriteOutfits() {
  return apiCall('/outfits/favorites');
}

// Get shopping recommendations
export async function getShoppingRecommendations(wardrobeItems) {
  return apiCall('/shop/recommendations', {
    method: 'POST',
    body: JSON.stringify({ wardrobeItems }),
  });
}