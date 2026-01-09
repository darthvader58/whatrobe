// Cloudflare Worker API for Whatrobe

import { generateId, getCurrentTimestamp } from './utils';
import { analyzeClothingImage, generateOutfitRecommendations } from './ai';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Enable foreign key constraints for all database operations
    try {
      await env.DB.prepare('PRAGMA foreign_keys = ON').run();
    } catch (error) {
      console.log('Foreign keys already enabled or not supported');
    }

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
      } else if (path === '/api/feedback' && request.method === 'POST') {
        response = await submitFeedback(request, env);
      } else if (path === '/api/debug/db' && request.method === 'GET') {
        response = await debugDatabase(request, env);
      } else if (path === '/api/init/db' && request.method === 'POST') {
        response = await initializeDatabase(request, env);
      } else if (path === '/api/migrate/user-data' && request.method === 'POST') {
        response = await migrateUserData(request, env);
      } else if (path.match(/^\/api\/debug\/user\/[\w-]+$/) && request.method === 'GET') {
        const userId = path.split('/').pop();
        response = await debugUserData(userId, env);
      } else if (path === '/api/debug/headers' && request.method === 'GET') {
        response = await debugHeaders(request, env);
      } else if (path === '/api/backup/user-data' && request.method === 'POST') {
        response = await backupUserData(request, env);
      } else if (path === '/api/restore/user-data' && request.method === 'POST') {
        response = await restoreUserData(request, env);
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
    console.log('=== GOOGLE AUTH START ===');
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

    console.log('Token verified successfully for user:', userInfo.email, 'ID:', userInfo.sub);

    // Check if user already exists
    const existingUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userInfo.sub).first();
    console.log('Existing user check:', existingUser ? 'Found' : 'Not found');

    // Create or update user in database
    const timestamp = getCurrentTimestamp();
    
    if (existingUser) {
      // User exists - UPDATE only (preserves foreign key relationships)
      const result = await env.DB.prepare(
        'UPDATE users SET email = ?, name = ?, picture = ?, updated_at = ? WHERE id = ?'
      ).bind(userInfo.email, userInfo.name, userInfo.picture, timestamp, userInfo.sub).run();
      console.log('User updated:', result);
    } else {
      // New user - INSERT
      const result = await env.DB.prepare(
        'INSERT INTO users (id, email, name, picture, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(userInfo.sub, userInfo.email, userInfo.name, userInfo.picture, timestamp, timestamp).run();
      console.log('User created:', result);
    }
    
    console.log('User saved to database:', userInfo.sub);
    
    // Check user's current data
    const clothingCount = await env.DB.prepare('SELECT COUNT(*) as count FROM clothing_items WHERE user_id = ?').bind(userInfo.sub).first();
    const outfitsCount = await env.DB.prepare('SELECT COUNT(*) as count FROM outfits WHERE user_id = ?').bind(userInfo.sub).first();
    console.log('User data summary - Clothing items:', clothingCount.count, 'Outfits:', outfitsCount.count);
    
    console.log('=== GOOGLE AUTH SUCCESS ===');
    
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
    console.error('=== GOOGLE AUTH ERROR ===', error.message || error);
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

  console.log('=== GET CLOTHING ITEMS ===');
  console.log('getClothingItems called with userId:', userId, 'category:', category);
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));

  let query = 'SELECT * FROM clothing_items WHERE user_id = ?';
  const params = [userId];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC';

  console.log('Executing query:', query, 'with params:', params);
  const { results } = await env.DB.prepare(query).bind(...params).all();
  console.log('Query returned', results.length, 'results for user:', userId);

  // Parse JSON fields and map database fields to frontend format
  const items = results.map(item => {
    console.log('Processing item:', item.id, 'image_url:', item.image_url);
    return {
      ...item,
      imageUrl: item.image_url, // Map snake_case to camelCase
      tags: item.tags ? JSON.parse(item.tags) : [],
    };
  });
  
  console.log('=== RETURNING', items.length, 'ITEMS ===');

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

  console.log('=== UPLOAD CLOTHING ITEM START ===');
  console.log('User ID:', userId);

  if (!imageFile) {
    return new Response(JSON.stringify({ error: 'No image provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Ensure user exists (create anonymous user if needed)
    const timestamp = getCurrentTimestamp();
    const userResult = await env.DB.prepare(
      'INSERT OR IGNORE INTO users (id, email, name, picture, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, `${userId}@anonymous.com`, 'Anonymous User', '', timestamp, timestamp).run();
    
    console.log('User creation result:', userResult);

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
    
    console.log('Inserting clothing item:', {
      id,
      userId,
      imageUrl,
      category: analysis.category
    });

    const insertResult = await env.DB.prepare(
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

    console.log('Insert result:', insertResult);
    
    // Verify the item was saved
    const verifyResult = await env.DB.prepare('SELECT id FROM clothing_items WHERE id = ?').bind(id).first();
    console.log('Verification result:', verifyResult);
    
    if (!verifyResult) {
      throw new Error('Failed to save clothing item to database');
    }
    
    // Check total items for user
    const countResult = await env.DB.prepare('SELECT COUNT(*) as count FROM clothing_items WHERE user_id = ?').bind(userId).first();
    console.log('Total items for user:', countResult.count);
    
    console.log('=== UPLOAD CLOTHING ITEM SUCCESS ===');

    return new Response(JSON.stringify({
      id,
      imageUrl,
      ...analysis,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('=== UPLOAD CLOTHING ITEM ERROR ===', error);
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

// Submit feedback
async function submitFeedback(request, env) {
  try {
    const feedbackData = await request.json();
    const timestamp = getCurrentTimestamp();
    const id = generateId();

    // Store feedback in database
    await env.DB.prepare(
      `INSERT INTO feedback 
      (id, name, email, rating, category, message, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        feedbackData.name,
        feedbackData.email,
        feedbackData.rating,
        feedbackData.category,
        feedbackData.message,
        feedbackData.timestamp,
        timestamp
      )
      .run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Feedback submitted successfully',
      id: id
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to submit feedback',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Debug database status
async function debugDatabase(request, env) {
  try {
    const results = {};
    
    // Check if tables exist
    const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    results.tables = tables.results.map(t => t.name);
    
    // Count records in each table
    for (const table of results.tables) {
      try {
        const count = await env.DB.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).first();
        results[`${table.name}_count`] = count.count;
      } catch (error) {
        results[`${table.name}_error`] = error.message;
      }
    }
    
    // Check recent users
    try {
      const recentUsers = await env.DB.prepare("SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 5").all();
      results.recent_users = recentUsers.results;
    } catch (error) {
      results.users_error = error.message;
    }
    
    // Check recent clothing items
    try {
      const recentItems = await env.DB.prepare("SELECT id, user_id, category, created_at FROM clothing_items ORDER BY created_at DESC LIMIT 5").all();
      results.recent_clothing_items = recentItems.results;
    } catch (error) {
      results.clothing_items_error = error.message;
    }
    
    return new Response(JSON.stringify(results, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Debug database error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to debug database',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Initialize database tables
async function initializeDatabase(request, env) {
  try {
    const results = {};
    
    // Enable foreign key constraints
    await env.DB.prepare('PRAGMA foreign_keys = ON').run();
    results.foreign_keys = 'enabled';
    
    // Create users table first (referenced by other tables)
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        name TEXT,
        picture TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `).run();
    results.users_table = 'created';

    // Create clothing_items table with foreign key constraint
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS clothing_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        image_id TEXT NOT NULL,
        category TEXT NOT NULL,
        color TEXT,
        secondary_color TEXT,
        style TEXT,
        fit TEXT,
        season TEXT,
        pattern TEXT,
        material TEXT,
        brand TEXT,
        formality TEXT,
        tags TEXT,
        description TEXT,
        embedding_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();
    results.clothing_items_table = 'created';

    // Create outfits table with foreign key constraint
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS outfits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT,
        occasion TEXT,
        style TEXT,
        weather TEXT,
        items TEXT NOT NULL,
        ai_reason TEXT,
        is_favorite INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();
    results.outfits_table = 'created';

    // Create user_preferences table with foreign key constraint
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT PRIMARY KEY,
        default_style TEXT,
        favorite_colors TEXT,
        preferred_fit TEXT,
        occasions TEXT,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();
    results.user_preferences_table = 'created';

    // Create feedback table (no foreign key needed)
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        category TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `).run();
    results.feedback_table = 'created';

    // Create indexes
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_clothing_user ON clothing_items(user_id)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_clothing_category ON clothing_items(category)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_clothing_color ON clothing_items(color)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_outfits_user ON outfits(user_id)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_outfits_favorite ON outfits(is_favorite)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at)').run();
    results.indexes = 'created';
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Database initialized successfully with foreign key constraints',
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to initialize database',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Migrate user data from anonymous session to authenticated user
async function migrateUserData(request, env) {
  try {
    const { fromUserId, toUserId } = await request.json();
    
    if (!fromUserId || !toUserId || fromUserId === toUserId) {
      return new Response(JSON.stringify({ 
        error: 'Invalid user IDs for migration' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`=== MIGRATION START: ${fromUserId} -> ${toUserId} ===`);
    
    // Check if the target user already has data
    const existingClothing = await env.DB.prepare('SELECT COUNT(*) as count FROM clothing_items WHERE user_id = ?').bind(toUserId).first();
    const existingOutfits = await env.DB.prepare('SELECT COUNT(*) as count FROM outfits WHERE user_id = ?').bind(toUserId).first();
    
    console.log('Target user existing data:', {
      clothing: existingClothing.count,
      outfits: existingOutfits.count
    });
    
    // Check if the source user has data to migrate
    const sourceClothing = await env.DB.prepare('SELECT COUNT(*) as count FROM clothing_items WHERE user_id = ?').bind(fromUserId).first();
    const sourceOutfits = await env.DB.prepare('SELECT COUNT(*) as count FROM outfits WHERE user_id = ?').bind(fromUserId).first();
    
    console.log('Source user data to migrate:', {
      clothing: sourceClothing.count,
      outfits: sourceOutfits.count
    });
    
    const results = {};
    
    // Only migrate if target user has no data and source user has data
    if (existingClothing.count === 0 && sourceClothing.count > 0) {
      const clothingResult = await env.DB.prepare(
        'UPDATE clothing_items SET user_id = ? WHERE user_id = ?'
      ).bind(toUserId, fromUserId).run();
      results.clothing_items_migrated = clothingResult.changes;
      console.log('Migrated clothing items:', clothingResult.changes);
    } else {
      results.clothing_items_migrated = 0;
      results.clothing_skip_reason = existingClothing.count > 0 ? 'target_has_data' : 'source_empty';
    }
    
    // Only migrate if target user has no data and source user has data
    if (existingOutfits.count === 0 && sourceOutfits.count > 0) {
      const outfitsResult = await env.DB.prepare(
        'UPDATE outfits SET user_id = ? WHERE user_id = ?'
      ).bind(toUserId, fromUserId).run();
      results.outfits_migrated = outfitsResult.changes;
      console.log('Migrated outfits:', outfitsResult.changes);
    } else {
      results.outfits_migrated = 0;
      results.outfits_skip_reason = existingOutfits.count > 0 ? 'target_has_data' : 'source_empty';
    }
    
    // Always try to migrate preferences (they can be overwritten)
    const preferencesResult = await env.DB.prepare(
      'UPDATE user_preferences SET user_id = ? WHERE user_id = ?'
    ).bind(toUserId, fromUserId).run();
    results.preferences_migrated = preferencesResult.changes;
    
    console.log('=== MIGRATION COMPLETE ===', results);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'User data migration completed',
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('User data migration error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to migrate user data',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Debug specific user data
async function debugUserData(userId, env) {
  try {
    const results = { userId };
    
    // Get user info
    try {
      const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
      results.user = user;
    } catch (error) {
      results.user_error = error.message;
    }
    
    // Get clothing items
    try {
      const clothingItems = await env.DB.prepare('SELECT id, category, created_at FROM clothing_items WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all();
      results.clothing_items = clothingItems.results;
      results.clothing_count = clothingItems.results.length;
    } catch (error) {
      results.clothing_error = error.message;
    }
    
    // Get outfits
    try {
      const outfits = await env.DB.prepare('SELECT id, name, is_favorite, created_at FROM outfits WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all();
      results.outfits = outfits.results;
      results.outfits_count = outfits.results.length;
    } catch (error) {
      results.outfits_error = error.message;
    }
    
    return new Response(JSON.stringify(results, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Debug user data error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to debug user data',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Debug request headers
async function debugHeaders(request, env) {
  try {
    const headers = {};
    for (const [key, value] of request.headers.entries()) {
      headers[key] = value;
    }
    
    const userId = request.headers.get('X-User-ID') || 'not-provided';
    
    return new Response(JSON.stringify({
      userId: userId,
      allHeaders: headers,
      url: request.url,
      method: request.method
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Debug headers error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to debug headers',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Backup user data to KV storage for persistence
async function backupUserData(request, env) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user data
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    const clothingItems = await env.DB.prepare('SELECT * FROM clothing_items WHERE user_id = ?').bind(userId).all();
    const outfits = await env.DB.prepare('SELECT * FROM outfits WHERE user_id = ?').bind(userId).all();
    
    const backup = {
      timestamp: new Date().toISOString(),
      user: user,
      clothingItems: clothingItems.results,
      outfits: outfits.results
    };
    
    // Store in KV for persistence
    await env.KV?.put(`backup:${userId}`, JSON.stringify(backup));
    
    return new Response(JSON.stringify({
      success: true,
      message: 'User data backed up successfully',
      itemCount: clothingItems.results.length,
      outfitCount: outfits.results.length
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to backup user data',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Restore user data from KV storage
async function restoreUserData(request, env) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get backup from KV
    const backupData = await env.KV?.get(`backup:${userId}`);
    
    if (!backupData) {
      return new Response(JSON.stringify({ error: 'No backup found for user' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const backup = JSON.parse(backupData);
    const timestamp = getCurrentTimestamp();
    
    // Restore user
    if (backup.user) {
      await env.DB.prepare(
        'INSERT OR REPLACE INTO users (id, email, name, picture, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(backup.user.id, backup.user.email, backup.user.name, backup.user.picture, backup.user.created_at, timestamp).run();
    }
    
    // Restore clothing items
    for (const item of backup.clothingItems) {
      await env.DB.prepare(
        `INSERT OR REPLACE INTO clothing_items 
        (id, user_id, image_url, image_id, category, color, secondary_color, style, fit, season, pattern, material, brand, formality, tags, description, embedding_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        item.id, item.user_id, item.image_url, item.image_id, item.category, item.color, 
        item.secondary_color, item.style, item.fit, item.season, item.pattern, item.material, 
        item.brand, item.formality, item.tags, item.description, item.embedding_id, 
        item.created_at, timestamp
      ).run();
    }
    
    // Restore outfits
    for (const outfit of backup.outfits) {
      await env.DB.prepare(
        `INSERT OR REPLACE INTO outfits 
        (id, user_id, name, occasion, style, weather, items, ai_reason, is_favorite, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        outfit.id, outfit.user_id, outfit.name, outfit.occasion, outfit.style, outfit.weather,
        outfit.items, outfit.ai_reason, outfit.is_favorite, outfit.created_at, timestamp
      ).run();
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'User data restored successfully',
      itemCount: backup.clothingItems.length,
      outfitCount: backup.outfits.length,
      backupTimestamp: backup.timestamp
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Restore error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to restore user data',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}