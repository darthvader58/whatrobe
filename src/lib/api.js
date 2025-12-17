const API_BASE = '/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
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
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/clothing`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  return response.json();
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