// AI functions using Cloudflare Workers AI

import {
  normalizeCategory,
  normalizeColor,
  normalizeStyle,
  normalizeFit,
} from './utils';

// Analyze clothing image using Cloudflare Workers AI
export async function analyzeClothingImage(imageBuffer, env) {
  try {
    // Use Llama Vision model for image analysis
    const imageArray = new Uint8Array(imageBuffer);
    
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
      // Extract JSON from response
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
    // Return default analysis if AI fails
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

// Generate outfit recommendations
export async function generateOutfitRecommendations(items, preferences, env) {
  const { occasion = 'casual', style = 'comfortable', weather = 'moderate' } = preferences;

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

  // Generate combinations based on preferences
  try {
    // Create prompt for AI
    const itemsSummary = items
      .map(item => `${item.id}: ${item.category} - ${item.color} ${item.style}`)
      .join('\n');

    const prompt = `Given these clothing items:
${itemsSummary}

Create 3-5 outfit combinations for:
- Occasion: ${occasion}
- Style preference: ${style}
- Weather: ${weather}

For each outfit, provide:
1. A catchy name
2. List of item IDs to combine (2-4 items)
3. A brief reason why this outfit works

Format as JSON array:
[
  {
    "name": "Outfit name",
    "itemIds": ["id1", "id2", "id3"],
    "description": "Why this works"
  }
]`;

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
    for (const aiOutfit of aiOutfits) {
      const outfitItems = items.filter(item => aiOutfit.itemIds.includes(item.id));
      
      if (outfitItems.length >= 2) {
        outfits.push({
          name: aiOutfit.name || 'Suggested Outfit',
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
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
  }

  // Fallback: Generate rule-based combinations if AI fails
  if (outfits.length === 0) {
    // Strategy 1: Top + Bottom + Shoes
    if (categorized.tops.length > 0 && categorized.bottoms.length > 0) {
      for (let i = 0; i < Math.min(3, categorized.tops.length); i++) {
        for (let j = 0; j < Math.min(2, categorized.bottoms.length); j++) {
          const outfitItems = [categorized.tops[i], categorized.bottoms[j]];
          
          // Add shoes if available
          if (categorized.shoes.length > 0) {
            outfitItems.push(categorized.shoes[0]);
          }
          
          // Add outerwear for cold weather
          if (weather === 'cold' && categorized.outerwear.length > 0) {
            outfitItems.push(categorized.outerwear[0]);
          }

          outfits.push({
            name: `${style.charAt(0).toUpperCase() + style.slice(1)} ${occasion} Outfit`,
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
            aiReason: `This combination matches your ${style} style preference and is suitable for ${occasion} occasions.`,
          });

          if (outfits.length >= 5) break;
        }
        if (outfits.length >= 5) break;
      }
    }

    // Strategy 2: Dresses + Accessories
    if (categorized.dresses.length > 0) {
      for (const dress of categorized.dresses.slice(0, 2)) {
        const outfitItems = [dress];
        
        if (categorized.shoes.length > 0) {
          outfitItems.push(categorized.shoes[0]);
        }
        
        if (categorized.accessories.length > 0) {
          outfitItems.push(categorized.accessories[0]);
        }

        outfits.push({
          name: `Elegant ${occasion} Dress`,
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
          description: 'A dress-based outfit with complementary accessories',
          aiReason: 'Dresses provide an elegant, all-in-one solution perfect for various occasions.',
        });

        if (outfits.length >= 5) break;
      }
    }
  }

  // Return up to 5 outfits
  return outfits.slice(0, 5);
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
