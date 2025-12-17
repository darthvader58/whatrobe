// Complete Cloudflare Worker for Whatrobe app

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
      // Extract user ID from headers
      const userId = request.headers.get('X-User-ID') || 'anonymous';

      // Route handling
      if (path === '/api/auth/google' && request.method === 'POST') {
        return await handleGoogleAuth(request, env, corsHeaders);
      } else if (path === '/api/clothing' && request.method === 'GET') {
        return await getClothingItems(request, env, corsHeaders, userId);
      } else if (path === '/api/clothing' && request.method === 'POST') {
        return await uploadClothingItem(request, env, corsHeaders, userId);
      } else if (path.match(/^\/api\/clothing\/[\w-]+$/) && request.method === 'DELETE') {
        const itemId = path.split('/').pop();
        return await deleteClothingItem(itemId, env, corsHeaders, userId);
      } else if (path === '/api/outfits/recommend' && request.method === 'POST') {
        return await generateOutfitRecommendations(request, env, corsHeaders, userId);
      } else if (path === '/api/analyze' && request.method === 'POST') {
        const formData = await request.formData();
        const imageFile = formData.get('image');

        if (!imageFile) {
          return new Response(JSON.stringify({ error: 'No image provided' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Analyze image with Cloudflare AI
        const imageArray = new Uint8Array(await imageFile.arrayBuffer());
        
        const response = await env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
          image: [...imageArray],
          prompt: `Analyze this clothing item and provide the following information in JSON format:
{
  "category": "one of: tops, bottoms, dresses, outerwear, shoes, accessories, bags, jewelry",
  "color": "primary color of the item",
  "style": "style description (casual, formal, athletic, etc)",
  "fit": "fit type (slim, regular, relaxed, oversized, fitted, loose, tailored)",
  "season": "best season (spring, summer, fall, winter, all-season)",
  "tags": ["tag1", "tag2", "tag3"],
  "description": "brief description of the item"
}

Only respond with valid JSON, no additional text.`,
          max_tokens: 512,
        });

        // Parse the AI response
        let analysis;
        try {
          const text = response.response || response.description || '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          // Fallback to default values
          analysis = {
            category: 'tops',
            color: 'gray',
            style: 'casual',
            fit: 'regular',
            season: 'all-season',
            tags: ['clothing'],
            description: 'Clothing item',
          };
        }

        // Normalize the values
        const normalizedAnalysis = {
          category: normalizeCategory(analysis.category),
          color: normalizeColor(analysis.color),
          style: normalizeStyle(analysis.style),
          fit: normalizeFit(analysis.fit),
          season: analysis.season || 'all-season',
          tags: analysis.tags || [],
          description: analysis.description || 'Clothing item',
        };

        return new Response(JSON.stringify(normalizedAnalysis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
async function handleGoogleAuth(request, env, corsHeaders) {
  const { token } = await request.json();
  
  try {
    // Verify Google ID token
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const userInfo = await response.json();
    
    if (!userInfo.sub) {
      throw new Error('Invalid token');
    }
    
    // Create or update user in database
    const timestamp = Date.now();
    await env.DB.prepare(
      'INSERT OR REPLACE INTO users (id, email, name, picture, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userInfo.sub, userInfo.email, userInfo.name, userInfo.picture, timestamp, timestamp).run();
    
    return new Response(JSON.stringify({
      user: {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Get clothing items for user
async function getClothingItems(request, env, corsHeaders, userId) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  
  let query = 'SELECT * FROM clothing_items WHERE user_id = ?';
  const params = [userId];
  
  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const { results } = await env.DB.prepare(query).bind(...params).all();
  
  const items = results.map(item => ({
    ...item,
    tags: item.tags ? JSON.parse(item.tags) : [],
  }));
  
  return new Response(JSON.stringify(items), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Upload clothing item
async function uploadClothingItem(request, env, corsHeaders, userId) {
  const formData = await request.formData();
  const imageFile = formData.get('image');

  if (!imageFile) {
    return new Response(JSON.stringify({ error: 'No image provided' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Generate unique ID for the image
  const imageId = generateId();
  
  // Upload image to R2
  await env.IMAGES.put(imageId, imageFile.stream(), {
    httpMetadata: {
      contentType: imageFile.type,
    },
  });

  // Generate public URL
  const imageUrl = `https://pub-${env.R2_PUBLIC_DOMAIN}/${imageId}`;

  // Analyze image with AI
  const imageArray = new Uint8Array(await imageFile.arrayBuffer());
  const analysis = await analyzeClothingImage(imageArray, env);

  // Store in database
  const id = generateId();
  const timestamp = Date.now();

  await env.DB.prepare(
    `INSERT INTO clothing_items 
    (id, user_id, image_url, image_id, category, color, style, fit, season, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    userId,
    imageUrl,
    imageId,
    analysis.category,
    analysis.color,
    analysis.style,
    analysis.fit,
    analysis.season,
    JSON.stringify(analysis.tags),
    timestamp,
    timestamp
  ).run();

  return new Response(JSON.stringify({
    id,
    imageUrl,
    ...analysis,
  }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Delete clothing item
async function deleteClothingItem(itemId, env, corsHeaders, userId) {
  // Get item details first
  const { results } = await env.DB.prepare(
    'SELECT image_id FROM clothing_items WHERE id = ? AND user_id = ?'
  ).bind(itemId, userId).all();

  if (results.length === 0) {
    return new Response(JSON.stringify({ error: 'Item not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const item = results[0];

  // Delete from R2
  await env.IMAGES.delete(item.image_id);

  // Delete from database
  await env.DB.prepare('DELETE FROM clothing_items WHERE id = ? AND user_id = ?')
    .bind(itemId, userId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Generate outfit recommendations using AI
async function generateOutfitRecommendations(request, env, corsHeaders, userId) {
  const preferences = await request.json();
  
  // Get user's clothing items
  const { results: items } = await env.DB.prepare(
    'SELECT * FROM clothing_items WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();

  if (items.length < 2) {
    return new Response(JSON.stringify({
      error: 'Not enough items in wardrobe. Add at least 2 items.',
      outfits: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Use AI to generate outfit recommendations
  const outfits = await generateAIOutfits(items, preferences, env);

  return new Response(JSON.stringify(outfits), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// AI-powered outfit generation
async function generateAIOutfits(items, preferences, env) {
  const { occasion = 'casual', style = 'comfortable', weather = 'moderate' } = preferences;

  // Create a summary of available items
  const itemsSummary = items.map(item => 
    `${item.id}: ${item.category} - ${item.color} ${item.style} ${item.fit}`
  ).join('\n');

  const prompt = `Given these clothing items:
${itemsSummary}

Create 5 stylish outfit combinations for:
- Occasion: ${occasion}
- Style preference: ${style}
- Weather: ${weather}

For each outfit, provide:
1. A creative, catchy name
2. List of item IDs to combine (2-4 items that work well together)
3. A brief explanation of why this combination works

Consider color coordination, style matching, and appropriateness for the occasion.

Format as JSON array:
[
  {
    "name": "Outfit name",
    "itemIds": ["id1", "id2", "id3"],
    "description": "Why this combination works well"
  }
]

Only respond with valid JSON, no additional text.`;

  try {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: prompt,
      max_tokens: 1024,
    });

    let aiOutfits;
    try {
      const text = response.response || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        aiOutfits = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found');
      }
    } catch (parseError) {
      console.error('Failed to parse outfit recommendations:', parseError);
      aiOutfits = [];
    }

    // Process AI recommendations
    const outfits = [];
    for (const aiOutfit of aiOutfits) {
      const outfitItems = items.filter(item => aiOutfit.itemIds.includes(item.id));
      
      if (outfitItems.length >= 2) {
        outfits.push({
          id: generateId(),
          name: aiOutfit.name || 'AI Suggested Outfit',
          items: outfitItems.map(item => ({
            id: item.id,
            imageUrl: item.image_url,
            category: item.category,
            color: item.color,
          })),
          itemIds: aiOutfit.itemIds,
          occasion,
          style,
          weather,
          description: aiOutfit.description,
          aiReason: aiOutfit.description,
        });
      }
    }

    // Fallback: Generate rule-based combinations if AI fails
    if (outfits.length === 0) {
      const categorized = {
        tops: items.filter(i => i.category === 'tops'),
        bottoms: items.filter(i => i.category === 'bottoms'),
        shoes: items.filter(i => i.category === 'shoes'),
        outerwear: items.filter(i => i.category === 'outerwear'),
      };

      // Generate basic combinations
      for (let i = 0; i < Math.min(3, categorized.tops.length); i++) {
        for (let j = 0; j < Math.min(2, categorized.bottoms.length); j++) {
          const outfitItems = [categorized.tops[i], categorized.bottoms[j]];
          
          if (categorized.shoes.length > 0) {
            outfitItems.push(categorized.shoes[0]);
          }

          outfits.push({
            id: generateId(),
            name: `${style} ${occasion} Look`,
            items: outfitItems.map(item => ({
              id: item.id,
              imageUrl: item.image_url,
              category: item.category,
              color: item.color,
            })),
            itemIds: outfitItems.map(item => item.id),
            occasion,
            style,
            weather,
            description: `A ${style} outfit perfect for ${occasion}`,
            aiReason: `This combination works well for ${occasion} occasions.`,
          });

          if (outfits.length >= 5) break;
        }
        if (outfits.length >= 5) break;
      }
    }

    return outfits.slice(0, 5);
  } catch (error) {
    console.error('Error generating AI outfits:', error);
    return [];
  }
}

// Analyze clothing image with AI
async function analyzeClothingImage(imageArray, env) {
  try {
    const response = await env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      image: [...imageArray],
      prompt: `Analyze this clothing item and provide the following information in JSON format:
{
  "category": "one of: tops, bottoms, dresses, outerwear, shoes, accessories, bags, jewelry",
  "color": "primary color of the item",
  "style": "style description (casual, formal, athletic, etc)",
  "fit": "fit type (slim, regular, relaxed, oversized, fitted, loose, tailored)",
  "season": "best season (spring, summer, fall, winter, all-season)",
  "tags": ["tag1", "tag2", "tag3"],
  "description": "brief description of the item"
}

Only respond with valid JSON, no additional text.`,
      max_tokens: 512,
    });

    let analysis;
    try {
      const text = response.response || response.description || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysis = {
        category: 'tops',
        color: 'gray',
        style: 'casual',
        fit: 'regular',
        season: 'all-season',
        tags: ['clothing'],
        description: 'Clothing item',
      };
    }

    return {
      category: normalizeCategory(analysis.category),
      color: normalizeColor(analysis.color),
      style: normalizeStyle(analysis.style),
      fit: normalizeFit(analysis.fit),
      season: analysis.season || 'all-season',
      tags: analysis.tags || [],
      description: analysis.description || 'Clothing item',
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      category: 'tops',
      color: 'gray',
      style: 'casual',
      fit: 'regular',
      season: 'all-season',
      tags: ['clothing'],
      description: 'Clothing item',
    };
  }
}

// Generate unique ID
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Normalization functions
function normalizeCategory(category) {
  const categoryMap = {
    'top': 'tops',
    'shirt': 'tops',
    'blouse': 'tops',
    'tshirt': 'tops',
    't-shirt': 'tops',
    'tank': 'tops',
    'sweater': 'outerwear',
    'hoodie': 'outerwear',
    'jacket': 'outerwear',
    'coat': 'outerwear',
    'pant': 'bottoms',
    'pants': 'bottoms',
    'jean': 'bottoms',
    'jeans': 'bottoms',
    'short': 'bottoms',
    'shorts': 'bottoms',
    'skirt': 'bottoms',
    'trouser': 'bottoms',
    'trousers': 'bottoms',
    'shoe': 'shoes',
    'sneaker': 'shoes',
    'boot': 'shoes',
    'boots': 'shoes',
    'sandal': 'shoes',
    'sandals': 'shoes',
    'dress': 'dresses',
    'gown': 'dresses',
    'accessory': 'accessories',
    'bag': 'bags',
    'purse': 'bags',
    'backpack': 'bags',
    'jewelry': 'jewelry',
    'necklace': 'jewelry',
    'bracelet': 'jewelry',
    'ring': 'jewelry',
    'earring': 'jewelry',
    'earrings': 'jewelry'
  };

  const normalized = category?.toLowerCase().trim();
  return categoryMap[normalized] || normalized || 'tops';
}

function normalizeColor(color) {
  const colorMap = {
    'grey': 'gray',
    'navy': 'blue',
    'maroon': 'red',
    'burgundy': 'red',
    'crimson': 'red',
    'olive': 'green',
    'lime': 'green',
    'teal': 'blue',
    'cyan': 'blue',
    'magenta': 'pink',
    'violet': 'purple',
    'indigo': 'purple',
    'tan': 'brown',
    'beige': 'brown',
    'cream': 'white',
    'ivory': 'white'
  };

  const normalized = color?.toLowerCase().trim();
  return colorMap[normalized] || normalized || 'gray';
}

function normalizeStyle(style) {
  const styleMap = {
    'business': 'formal',
    'professional': 'formal',
    'dressy': 'formal',
    'sport': 'athletic',
    'sporty': 'athletic',
    'gym': 'athletic',
    'workout': 'athletic',
    'relaxed': 'casual',
    'everyday': 'casual',
    'street': 'casual',
    'retro': 'vintage',
    'classic': 'vintage'
  };

  const normalized = style?.toLowerCase().trim();
  return styleMap[normalized] || normalized || 'casual';
}

function normalizeFit(fit) {
  const fitMap = {
    'tight': 'slim',
    'skinny': 'slim',
    'fitted': 'slim',
    'loose': 'relaxed',
    'baggy': 'oversized',
    'wide': 'oversized',
    'standard': 'regular',
    'normal': 'regular'
  };

  const normalized = fit?.toLowerCase().trim();
  return fitMap[normalized] || normalized || 'regular';
}