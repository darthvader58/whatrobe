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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      let response;

      // Route handling
      if (path === '/api/clothing' && request.method === 'GET') {
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

// Get all clothing items
async function getClothingItems(request, env) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const userId = 'default'; // For now, using default user

  let query = 'SELECT * FROM clothing_items WHERE user_id = ?';
  const params = [userId];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC';

  const { results } = await env.DB.prepare(query).bind(...params).all();

  // Parse JSON fields
  const items = results.map(item => ({
    ...item,
    tags: item.tags ? JSON.parse(item.tags) : [],
  }));

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

// Upload clothing item
async function uploadClothingItem(request, env) {
  const formData = await request.formData();
  const imageFile = formData.get('image');

  if (!imageFile) {
    return new Response(JSON.stringify({ error: 'No image provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate unique ID for the image
  const imageId = generateId();
  const userId = 'default'; // For now, using default user
  
  // Ensure default user exists
  const timestamp = getCurrentTimestamp();
  await env.DB.prepare(
    'INSERT OR IGNORE INTO users (id, email, created_at, updated_at) VALUES (?, ?, ?, ?)'
  ).bind(userId, 'default@example.com', timestamp, timestamp).run();

  // Upload image to R2
  await env.IMAGES.put(imageId, imageFile.stream(), {
    httpMetadata: {
      contentType: imageFile.type,
    },
  });

  // Generate public URL - for local dev, use a placeholder
  const imageUrl = env.ENVIRONMENT === 'development' 
    ? `/api/images/${imageId}` 
    : `https://your-r2-domain.com/${imageId}`;

  // Analyze image with AI
  const arrayBuffer = await imageFile.arrayBuffer();
  const analysis = await analyzeClothingImage(arrayBuffer, env);

  // Generate embedding for similarity search
  const embeddingId = `emb-${imageId}`;
  const embeddingText = `${analysis.category} ${analysis.color} ${analysis.style} ${analysis.fit}`;
  
  const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: [embeddingText],
  });

  // Store embedding in Vectorize (skip in local dev if not available)
  try {
    await env.VECTORIZE.upsert([
      {
        id: embeddingId,
        values: embeddings.data[0],
        metadata: {
          itemId: imageId,
          category: analysis.category,
          color: analysis.color,
        },
      },
    ]);
  } catch (error) {
    console.log('Vectorize not available in local dev:', error.message);
  }

  // Store in database
  const id = generateId();
  const timestamp = getCurrentTimestamp();

  await env.DB.prepare(
    `INSERT INTO clothing_items 
    (id, user_id, image_url, image_id, category, color, style, fit, season, tags, embedding_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      userId,
      imageUrl,
      imageId,
      analysis.category,
      analysis.color,
      analysis.style,
      analysis.fit,
      analysis.season || 'all-season',
      JSON.stringify(analysis.tags || []),
      embeddingId,
      timestamp,
      timestamp
    )
    .run();

  return new Response(
    JSON.stringify({
      id,
      imageUrl,
      ...analysis,
    }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }
  );
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

// Recommend outfits
async function recommendOutfits(request, env) {
  const preferences = await request.json();
  const userId = 'default';

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

  // Generate outfit recommendations using AI
  const outfits = await generateOutfitRecommendations(items, preferences, env);

  // Store outfits in database
  const timestamp = getCurrentTimestamp();
  for (const outfit of outfits) {
    const outfitId = generateId();
    await env.DB.prepare(
      `INSERT INTO outfits 
      (id, user_id, name, occasion, style, weather, items, ai_reason, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        outfitId,
        userId,
        outfit.name,
        preferences.occasion || 'casual',
        preferences.style || 'comfortable',
        preferences.weather || 'moderate',
        JSON.stringify(outfit.itemIds),
        outfit.aiReason,
        timestamp,
        timestamp
      )
      .run();

    outfit.id = outfitId;
  }

  return new Response(JSON.stringify(outfits), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Get favorite outfits
async function getFavoriteOutfits(request, env) {
  const userId = 'default';

  const { results } = await env.DB.prepare(
    'SELECT * FROM outfits WHERE user_id = ? AND is_favorite = 1 ORDER BY updated_at DESC'
  )
    .bind(userId)
    .all();

  const outfits = results.map(outfit => ({
    ...outfit,
    items: JSON.parse(outfit.items),
  }));

  return new Response(JSON.stringify(outfits), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Save favorite outfit
async function saveFavoriteOutfit(request, env) {
  const { outfitId } = await request.json();
  const timestamp = getCurrentTimestamp();

  await env.DB.prepare(
    'UPDATE outfits SET is_favorite = 1, updated_at = ? WHERE id = ?'
  )
    .bind(timestamp, outfitId)
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

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error serving image:', error);
    return new Response('Error serving image', { status: 500 });
  }
}