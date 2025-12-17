const API_BASE = 'http://localhost:8788/api';

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
  const items = JSON.parse(localStorage.getItem('clothingItems') || '[]');
  
  if (filters.category && filters.category !== 'all') {
    return items.filter(item => item.category === filters.category);
  }
  
  return items;
}

// Get a single clothing item
export async function getClothingItem(id) {
  return apiCall(`/clothing/${id}`);
}

// Upload a new clothing item
export async function uploadClothingItem(file) {
  const formData = new FormData();
  formData.append('image', file);

  // Get AI analysis from Cloudflare Worker
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to analyze image');
  }

  const analysis = await response.json();
  
  // Create item with image data URL and AI analysis
  const imageUrl = URL.createObjectURL(file);
  const item = {
    id: `item-${Date.now()}`,
    imageUrl,
    ...analysis,
    created_at: Date.now(),
    updated_at: Date.now()
  };
  
  // Store in localStorage
  const items = JSON.parse(localStorage.getItem('clothingItems') || '[]');
  items.push(item);
  localStorage.setItem('clothingItems', JSON.stringify(items));
  
  return item;
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
  const items = JSON.parse(localStorage.getItem('clothingItems') || '[]');
  const filteredItems = items.filter(item => item.id !== id);
  localStorage.setItem('clothingItems', JSON.stringify(filteredItems));
  return { success: true };
}

// Get outfit recommendations
export async function getOutfitRecommendations(preferences = {}) {
  const items = JSON.parse(localStorage.getItem('clothingItems') || '[]');
  
  if (items.length < 2) {
    return {
      error: 'Not enough items in wardrobe. Add at least 2 items.',
      outfits: []
    };
  }
  
  // Simple outfit generation
  const { occasion = 'casual', style = 'comfortable' } = preferences;
  const tops = items.filter(item => item.category === 'tops');
  const bottoms = items.filter(item => item.category === 'bottoms');
  const shoes = items.filter(item => item.category === 'shoes');
  
  const outfits = [];
  
  for (let i = 0; i < Math.min(3, tops.length); i++) {
    for (let j = 0; j < Math.min(2, bottoms.length); j++) {
      const outfitItems = [tops[i], bottoms[j]];
      if (shoes.length > 0) outfitItems.push(shoes[0]);
      
      outfits.push({
        id: `outfit-${Date.now()}-${i}-${j}`,
        name: `${style} ${occasion} Outfit ${outfits.length + 1}`,
        items: outfitItems.map(item => ({
          id: item.id,
          imageUrl: item.imageUrl,
          category: item.category,
          color: item.color
        })),
        itemIds: outfitItems.map(item => item.id),
        occasion,
        style,
        description: `A ${style} outfit perfect for ${occasion}`,
        aiReason: `This combination works well for ${occasion} occasions.`
      });
      
      if (outfits.length >= 5) break;
    }
    if (outfits.length >= 5) break;
  }
  
  return outfits;
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