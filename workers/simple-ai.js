// Simple Cloudflare Worker for AI image analysis only

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
      if (path === '/api/analyze' && request.method === 'POST') {
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