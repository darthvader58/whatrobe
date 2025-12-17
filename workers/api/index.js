// Cloudflare Worker API for Whatrobe

import { generateId, getCurrentTimestamp } from './utils';
import { analyzeClothingImage, generateOutfitRecommendations } from './ai';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      let response;

      // Route handling
      if (path === '/api/auth/google' && request.method === 'POST') {
        response = await handleGoogleAuth(request, env);
      } else if (path === '/api/clothing' && request.method === 'GET') {
        response = await getClothingItems(request, env);
      } else if (path === '/api/clothing' && request.method === 'POST') {
        response = await uploadClothingItem(request, env);
      } else if (path.match(/^\/api\/clothing\/[\w-]+$/) && request.method === 'GET') {
        const id = path.split('/').pop();
        response = await getClothingItem(id, env);
      } else if (path.match(/^\/api\/clothing\/[\w-]+$/) && request.method === 'DELETE') {
        const id = path.split('/').pop();
        response = await deleteClothingItem(id, env);
      } else if (path === '/api/outfits/recommend' && request.method === 'POST') {
        response = await recommendOutfits(request, env);
      } else if (path === '/api/outfits/favorites' && request.method === 'GET') {
        response = await getFavoriteOutfits(request, env);
      } else if (path === '/api/outfits/favorites' && request.method === 'POST') {
        response = await saveFavoriteOutfit(request, env);
      } else if (path.match(/^\/api\/outfits\/favorites\/[\w-]+$/) && request.method === 'DELETE') {
        const id = path.split('/').pop();
        response = await deleteFavoriteOutfit(id, request, env);
      } else if (path === '/api/shop/recommendations' && request.method === 'POST') {
        response = await getShoppingRecommendations(request, env);
      } else if (path.match(/^\/api\/images\/[\w-]+$/) && request.method === 'GET') {
        const imageId = path.split('/').pop();
        response = await getImage(imageId, env);
      } else {
        response = new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
// Add CORS headers to response
      Object.keys(corsHeaders).forEach(key => {
        response.headers.set(key, corsHeaders[key]);
      });

      return response;
    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Internal server error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

// Google OAuth handler
async function handleGoogleAuth(request, env) {
  const { token } = await request.json();
  
  try {
    console.log('Verifying Google token...', 'Token length:', token?.length);
    
    // Verify Google ID token
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const userInfo = await response.json();
    
    console.log('Google tokeninfo response status:', response.status);
    console.log('Google tokeninfo response:', JSON.stringify(userInfo));
    
    if (!response.ok || userInfo.error) {
      const errorMsg = `Token verification failed: ${userInfo.error_description || userInfo.error || 'Unknown error'}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Validate the audience (client ID) matches our OAuth client
    const expectedClientId = '722171290494-hjqescui9o94of72kvikf0aqrcpra7kj.apps.googleusercontent.com';
    if (userInfo.aud && userInfo.aud !== expectedClientId) {
      const errorMsg = `Invalid audience: expected ${expectedClientId}, got ${userInfo.aud}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!userInfo.sub) {
      throw new Error('Invalid token - no subject');
    }
    
    if (!userInfo.email) {
      throw new Error('Invalid token - no email');
    }

    console.log('Token verified successfully for user:', userInfo.email);

    // Create or update user in database
    const timestamp = getCurrentTimestamp();
    await env.DB.prepare(
      'INSERT OR REPLACE INTO users (id, email, name, picture, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userInfo.sub, userInfo.email, userInfo.name, userInfo.picture, timestamp, timestamp).run();
    
    console.log('User saved to database:', userInfo.sub);
    
    return new Response(JSON.stringify({
      user: {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auth error:', error.message || error);
    return new Response(JSON.stringify({ 
      error: 'Authentication failed',
      details: error.message || 'Unknown error'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Get all clothing items
async function getClothingItems(request, env) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const userId = request.headers.get('X-User-ID') || 'anonymous';

  let query = 'SELECT * FROM clothing_items WHERE user_id = ?';
  const params = [userId];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC';

  const { results } = await env.DB.prepare(query).bind(...params).all();

  // Parse JSON fields and map database fields to frontend format
  const items = results.map(item => {
    console.log('Processing item:', item.id, 'image_url:', item.image_url);
    return {
      ...item,
      imageUrl: item.image_url, // Map snake_case to camelCase
      tags: item.tags ? JSON.parse(item.tags) : [],
    };
  });
  
  console.log('Returning', items.length, 'items for user:', userId);

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Get single clothing item
async function getClothingItem(id, env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM clothing_items WHERE id = ?'
  )
    .bind(id)
    .all();

  if (results.length === 0) {
    return new Response(JSON.stringify({ error: 'Item not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const item = results[0];
  item.tags = item.tags ? JSON.parse(item.tags) : [];

  return new Response(JSON.stringify(item), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Upload clothing item with Google OAuth
async function uploadClothingItem(request, env) {
  const formData = await request.formData();
  const imageFile = formData.get('image');
  const userId = request.headers.get('X-User-ID') || 'anonymous';

  if (!imageFile) {
    return new Response(JSON.stringify({ error: 'No image provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Ensure user exists (create anonymous user if needed)
    const timestamp = getCurrentTimestamp();
    await env.DB.prepare(
      'INSERT OR IGNORE INTO users (id, email, name, picture, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, `${userId}@anonymous.com`, 'Anonymous User', '', timestamp, timestamp).run();

    // Generate unique ID for the image
    const imageId = generateId();
    
    // Upload image to R2
    await env.IMAGES.put(imageId, imageFile.stream(), {
      httpMetadata: {
        contentType: imageFile.type,
      },
    });

    // Generate public URL - always use relative URLs, let frontend handle the base URL
    const imageUrl = `/api/images/${imageId}`;

    // Analyze image with enhanced AI
    const arrayBuffer = await imageFile.arrayBuffer();
    const analysis = await analyzeClothingImage(arrayBuffer, env);

    // Store in database
    const id = generateId();

    await env.DB.prepare(
      `INSERT INTO clothing_items 
      (id, user_id, image_url, image_id, category, color, secondary_color, style, fit, season, pattern, material, brand, formality, tags, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        userId,
        imageUrl,
        imageId,
        analysis.category,
        analysis.color,
        analysis.secondaryColor,
        analysis.style,
        analysis.fit,
        analysis.season,
        analysis.pattern,
        analysis.material,
        analysis.brand,
        analysis.formality,
        JSON.stringify(analysis.tags),
        analysis.description,
        timestamp,
        timestamp
      )
      .run();

    return new Response(JSON.stringify({
      id,
      imageUrl,
      ...analysis,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Delete clothing item
async function deleteClothingItem(id, env) {
  // Get item details first
  const { results } = await env.DB.prepare(
    'SELECT image_id, embedding_id FROM clothing_items WHERE id = ?'
  )
    .bind(id)
    .all();

  if (results.length === 0) {
    return new Response(JSON.stringify({ error: 'Item not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const item = results[0];

  // Delete from R2
  await env.IMAGES.delete(item.image_id);

  // Delete embedding from Vectorize
  if (item.embedding_id) {
    await env.VECTORIZE.deleteByIds([item.embedding_id]);
  }

  // Delete from database
  await env.DB.prepare('DELETE FROM clothing_items WHERE id = ?').bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Recommend outfits with enhanced AI
async function recommendOutfits(request, env) {
  const preferences = await request.json();
  const userId = request.headers.get('X-User-ID') || 'anonymous';

  // Get all user's clothing items
  const { results: items } = await env.DB.prepare(
    'SELECT * FROM clothing_items WHERE user_id = ? ORDER BY created_at DESC'
  )
    .bind(userId)
    .all();

  if (items.length < 2) {
    return new Response(
      JSON.stringify({
        error: 'Not enough items in wardrobe. Add at least 2 items.',
        outfits: [],
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Parse tags for each item and map field names
  const itemsWithTags = items.map(item => ({
    ...item,
    imageUrl: item.image_url, // Map for frontend compatibility
    tags: item.tags ? JSON.parse(item.tags) : [],
  }));

  // Generate outfit recommendations using enhanced AI
  const outfits = await generateOutfitRecommendations(itemsWithTags, preferences, env);

  return new Response(JSON.stringify(outfits), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Get favorite outfits
async function getFavoriteOutfits(request, env) {
  const userId = request.headers.get('X-User-ID') || 'anonymous';

  const { results } = await env.DB.prepare(
    'SELECT * FROM outfits WHERE user_id = ? AND is_favorite = 1 ORDER BY updated_at DESC'
  )
    .bind(userId)
    .all();

  const outfits = results.map(outfit => ({
    ...outfit,
    items: JSON.parse(outfit.items),
    ai_reason: outfit.ai_reason,
  }));

  return new Response(JSON.stringify(outfits), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Save favorite outfit
async function saveFavoriteOutfit(request, env) {
  const { outfit } = await request.json();
  const userId = request.headers.get('X-User-ID') || 'anonymous';
  const timestamp = getCurrentTimestamp();
  const id = generateId();

  // Save the complete outfit data
  await env.DB.prepare(
    `INSERT INTO outfits 
    (id, user_id, name, occasion, style, weather, items, ai_reason, is_favorite, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  )
    .bind(
      id,
      userId,
      outfit.name || 'Saved Outfit',
      outfit.occasion || null,
      outfit.style || null,
      outfit.weather || null,
      JSON.stringify(outfit.items),
      outfit.aiReason || outfit.description || null,
      timestamp,
      timestamp
    )
    .run();

  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Delete favorite outfit
async function deleteFavoriteOutfit(id, request, env) {
  const userId = request.headers.get('X-User-ID') || 'anonymous';

  await env.DB.prepare(
    'DELETE FROM outfits WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Get shopping recommendations (placeholder for future feature)
async function getShoppingRecommendations(request, env) {
  const { wardrobeItems } = await request.json();

  // This would integrate with Amazon API or other shopping platforms
  // For now, return empty array as this is a future feature
  return new Response(
    JSON.stringify({
      message: 'Shopping recommendations coming soon!',
      recommendations: [],
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Get image from R2 storage
async function getImage(imageId, env) {
  try {
    const object = await env.IMAGES.get(imageId);
    
    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error serving image:', error);
    return new Response('Error serving image', { status: 500 });
  }
}