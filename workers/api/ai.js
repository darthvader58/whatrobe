// Enhanced AI functions using Cloudflare Workers AI

import {
  normalizeCategory,
  normalizeColor,
  normalizeStyle,
  normalizeFit,
} from './utils';

// Analyze clothing image using Cloudflare Workers AI with enhanced prompting
export async function analyzeClothingImage(imageBuffer, env) {
  try {
    const imageArray = new Uint8Array(imageBuffer);
    
    const response = await env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      image: [...imageArray],
      prompt: `You are a fashion expert analyzing clothing items. Look at this image carefully and identify:

1. CATEGORY: Determine if this is tops, bottoms, dresses, outerwear, shoes, accessories, bags, or jewelry
2. COLOR: Identify the primary/dominant color
3. STYLE: Classify the fashion style (casual, formal, athletic, business, vintage, etc.)
4. FIT: Determine the fit type (slim, regular, relaxed, oversized, fitted, loose, tailored)
5. SEASON: Best season for this item (spring, summer, fall, winter, all-season)
6. TAGS: 3-5 descriptive tags
7. DESCRIPTION: Brief description

Respond ONLY with this JSON format:
{
  "category": "exact category from the list above",
  "color": "primary color name",
  "style": "style classification", 
  "fit": "fit type",
  "season": "best season",
  "tags": ["tag1", "tag2", "tag3"],
  "description": "brief description of the item"
}`,
      max_tokens: 512,
    });

    let analysis;
    try {
      const text = response.response || response.description || '';
      console.log('AI Response:', text); // Debug logging
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Raw response:', response);
      
      // Enhanced fallback based on common patterns
      analysis = {
        category: 'tops',
        color: 'gray',
        style: 'casual',
        fit: 'regular',
        season: 'all-season',
        tags: ['clothing', 'wardrobe'],
        description: 'Clothing item',
      };
    }

    // Normalize and validate the values
    const normalized = {
      category: normalizeCategory(analysis.category),
      color: normalizeColor(analysis.color),
      style: normalizeStyle(analysis.style),
      fit: normalizeFit(analysis.fit),
      season: analysis.season || 'all-season',
      tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 5) : ['clothing'],
      description: analysis.description || 'Clothing item',
    };

    console.log('Normalized analysis:', normalized); // Debug logging
    return normalized;

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

// Enhanced AI-powered outfit generation
export async function generateOutfitRecommendations(items, preferences, env) {
  const { occasion = 'casual', style = 'comfortable', weather = 'moderate' } = preferences;

  if (items.length < 2) {
    return [];
  }

  // Categorize items
  const categorized = {
    tops: items.filter(i => i.category === 'tops'),
    bottoms: items.filter(i => i.category === 'bottoms'),
    dresses: items.filter(i => i.category === 'dresses'),
    outerwear: items.filter(i => i.category === 'outerwear'),
    shoes: items.filter(i => i.category === 'shoes'),
    accessories: items.filter(i => i.category === 'accessories'),
  };

  const outfits = [];

  try {
    // Enhanced AI prompt for better outfit generation
    const itemsSummary = items
      .map(item => `ID: "${item.id}" | ${item.category} - ${item.color} ${item.style} ${item.fit} (${item.description || ''})`)
      .join('\n');

    const prompt = `You are a professional fashion stylist. Create stylish outfit combinations from these wardrobe items:

${itemsSummary}

Requirements:
- Occasion: ${occasion}
- Style preference: ${style}  
- Weather: ${weather}

Fashion Rules:
- Consider color coordination and complementary colors
- Match style aesthetics (don't mix formal with athletic unless intentional)
- Ensure appropriate fit combinations
- Consider weather appropriateness
- Create balanced, complete outfits

Create 5 diverse outfit combinations. Each outfit should have 2-4 items that work well together.

Respond ONLY with this JSON format using the EXACT item IDs from above:
[
  {
    "name": "Creative outfit name",
    "itemIds": ["full-id-1", "full-id-2"],
    "description": "Why this combination works well and looks great"
  }
]

IMPORTANT: Use the complete item IDs exactly as shown above (including the full string after the dash).`;

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: prompt,
      max_tokens: 1500,
    });

    let aiOutfits = [];
    try {
      const text = response.response || '';
      console.log('AI Outfit Response:', text); // Debug logging
      
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
    for (const aiOutfit of aiOutfits) {
      if (!aiOutfit.itemIds || !Array.isArray(aiOutfit.itemIds)) continue;
      
      const outfitItems = items.filter(item => aiOutfit.itemIds.includes(item.id));
      
      if (outfitItems.length >= 2) {
        outfits.push({
          id: generateId(),
          name: aiOutfit.name || 'AI Styled Outfit',
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
          description: aiOutfit.description || 'AI-curated outfit combination',
          aiReason: aiOutfit.description,
        });
      }
    }
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
  }

  // Enhanced fallback with smarter combinations
  if (outfits.length === 0) {
    console.log('Using fallback outfit generation');
    
    // Smart color coordination
    const getComplementaryItems = (baseItem, category) => {
      return categorized[category].filter(item => {
        // Simple color coordination logic
        if (baseItem.color === item.color) return true; // Same color
        if (baseItem.color === 'black' || baseItem.color === 'white' || baseItem.color === 'gray') return true; // Neutrals
        if (item.color === 'black' || item.color === 'white' || item.color === 'gray') return true; // Neutrals
        return false;
      });
    };

    // Strategy 1: Top + Bottom combinations
    if (categorized.tops.length > 0 && categorized.bottoms.length > 0) {
      for (const top of categorized.tops.slice(0, 3)) {
        const compatibleBottoms = getComplementaryItems(top, 'bottoms');
        
        for (const bottom of compatibleBottoms.slice(0, 2)) {
          const outfitItems = [top, bottom];
          
          // Add shoes if available
          if (categorized.shoes.length > 0) {
            const compatibleShoes = getComplementaryItems(top, 'shoes');
            if (compatibleShoes.length > 0) {
              outfitItems.push(compatibleShoes[0]);
            } else {
              outfitItems.push(categorized.shoes[0]);
            }
          }
          
          // Add outerwear for cold weather
          if (weather === 'cold' && categorized.outerwear.length > 0) {
            outfitItems.push(categorized.outerwear[0]);
          }

          outfits.push({
            id: generateId(),
            name: `${style.charAt(0).toUpperCase() + style.slice(1)} ${occasion} Look`,
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
            description: `A coordinated ${style} outfit with ${top.color} ${top.category} and ${bottom.color} ${bottom.category}`,
            aiReason: `Color-coordinated combination perfect for ${occasion} occasions.`,
          });

          if (outfits.length >= 5) break;
        }
        if (outfits.length >= 5) break;
      }
    }

    // Strategy 2: Dress-based outfits
    if (categorized.dresses.length > 0 && outfits.length < 5) {
      for (const dress of categorized.dresses.slice(0, 2)) {
        const outfitItems = [dress];
        
        if (categorized.shoes.length > 0) {
          outfitItems.push(categorized.shoes[0]);
        }
        
        if (categorized.accessories.length > 0) {
          outfitItems.push(categorized.accessories[0]);
        }

        outfits.push({
          id: generateId(),
          name: `Elegant ${dress.color} Dress Ensemble`,
          items: outfitItems.map(item => ({
            id: item.id,
            imageUrl: item.image_url,
            category: item.category,
            color: item.color,
          })),
          itemIds: outfitItems.map(item => item.id),
          occasion,
          style: 'elegant',
          weather,
          description: `A ${dress.color} dress styled with complementary accessories`,
          aiReason: 'Dresses provide an elegant, complete look that works for many occasions.',
        });

        if (outfits.length >= 5) break;
      }
    }
  }

  console.log(`Generated ${outfits.length} outfits`); // Debug logging
  return outfits.slice(0, 5);
}

// Generate unique ID
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Find similar items using vector search
export async function findSimilarItems(itemId, env, limit = 5) {
  try {
    // Get the item's embedding
    const { results } = await env.DB.prepare(
      'SELECT embedding_id, category, color, style FROM clothing_items WHERE id = ?'
    )
      .bind(itemId)
      .all();

    if (results.length === 0) {
      return [];
    }

    const item = results[0];

    // Query Vectorize for similar items
    const queryResults = await env.VECTORIZE.query(item.embedding_id, {
      topK: limit + 1, // +1 to exclude the item itself
      returnMetadata: true,
    });

    // Filter out the original item and return similar items
    const similarItems = queryResults.matches
      .filter(match => match.metadata.itemId !== itemId)
      .slice(0, limit);

    return similarItems;
  } catch (error) {
    console.error('Error finding similar items:', error);
    return [];
  }
}
