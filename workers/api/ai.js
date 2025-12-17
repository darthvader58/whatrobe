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
      prompt: `You are a professional fashion stylist analyzing clothing items. Examine this image in detail and identify:

1. CATEGORY: tops, bottoms, dresses, outerwear, shoes, accessories, bags, or jewelry
2. PRIMARY COLOR: Main/dominant color
3. SECONDARY COLOR: Second most prominent color (if any)
4. STYLE: casual, formal, athletic, business, vintage, bohemian, streetwear, preppy, minimalist, etc.
5. FIT: slim, regular, relaxed, oversized, fitted, loose, tailored, skinny, wide-leg
6. SEASON: spring, summer, fall, winter, all-season
7. PATTERN: solid, striped, plaid, floral, geometric, polka-dot, animal-print, abstract, checkered, none
8. MATERIAL: cotton, denim, leather, wool, silk, polyester, linen, knit, synthetic, suede, etc.
9. FORMALITY: very-casual, casual, smart-casual, business-casual, business-formal, formal, black-tie
10. BRAND/LOGO: Any visible brand or logo (or "none")
11. TAGS: 8-12 specific descriptive tags (e.g., "v-neck", "button-down", "distressed", "high-waisted", "ankle-length", "crew-neck", "sleeveless", "hooded", "zip-up", "graphic-print")
12. DESCRIPTION: Detailed 2-3 sentence description

Respond ONLY with this JSON format:
{
  "category": "category",
  "color": "primary color",
  "secondaryColor": "secondary color or null",
  "style": "style",
  "fit": "fit type",
  "season": "season",
  "pattern": "pattern type",
  "material": "material type",
  "formality": "formality level",
  "brand": "brand name or none",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "description": "detailed description"
}`,
      max_tokens: 768,
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
        secondaryColor: null,
        style: 'casual',
        fit: 'regular',
        season: 'all-season',
        pattern: 'solid',
        material: 'cotton',
        formality: 'casual',
        brand: 'none',
        tags: ['clothing', 'wardrobe', 'everyday'],
        description: 'Clothing item',
      };
    }

    // Normalize and validate the values
    const normalized = {
      category: normalizeCategory(analysis.category),
      color: normalizeColor(analysis.color),
      secondaryColor: analysis.secondaryColor ? normalizeColor(analysis.secondaryColor) : null,
      style: normalizeStyle(analysis.style),
      fit: normalizeFit(analysis.fit),
      season: analysis.season || 'all-season',
      pattern: analysis.pattern || 'solid',
      material: analysis.material || 'cotton',
      formality: analysis.formality || 'casual',
      brand: analysis.brand || 'none',
      tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 12) : ['clothing'],
      description: analysis.description || 'Clothing item',
    };

    console.log('Normalized analysis:', normalized); // Debug logging
    return normalized;

  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      category: 'tops',
      color: 'gray',
      secondaryColor: null,
      style: 'casual',
      fit: 'regular',
      season: 'all-season',
      pattern: 'solid',
      material: 'cotton',
      formality: 'casual',
      brand: 'none',
      tags: ['clothing'],
      description: 'Clothing item',
    };
  }
}

// Enhanced AI-powered outfit generation with anti-redundancy
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
  const usedCombinations = new Set(); // Track used combinations to avoid duplicates

  try {
    // Enhanced AI prompt with more detailed item information
    const itemsSummary = items
      .map(item => {
        const details = [
          `ID: "${item.id}"`,
          `${item.category}`,
          `${item.color}${item.secondary_color ? '/' + item.secondary_color : ''}`,
          `${item.style}`,
          `${item.fit} fit`,
          item.pattern && item.pattern !== 'solid' ? item.pattern : '',
          item.material ? item.material : '',
          item.formality ? item.formality : '',
          item.tags ? `[${item.tags.slice(0, 5).join(', ')}]` : ''
        ].filter(Boolean).join(' | ');
        return details;
      })
      .join('\n');

    const prompt = `You are an expert fashion stylist creating unique, non-repetitive outfit combinations. Analyze these wardrobe items:

${itemsSummary}

Context:
- Occasion: ${occasion}
- Style: ${style}
- Weather: ${weather}

Fashion Guidelines:
1. Color Theory: Use complementary, analogous, or monochromatic color schemes
2. Pattern Mixing: Max one bold pattern per outfit, balance with solids
3. Formality Matching: Keep formality levels consistent (don't mix athletic with formal)
4. Texture Variety: Mix different materials for visual interest
5. Proportions: Balance fitted and loose pieces
6. Weather Appropriate: Consider layering for cold, breathable for hot
7. DIVERSITY: Each outfit must use DIFFERENT item combinations - no repeating the same items

Create 5 COMPLETELY DIFFERENT outfit combinations. Vary the items used in each outfit.

Respond ONLY with JSON using EXACT item IDs:
[
  {
    "name": "Unique creative name",
    "itemIds": ["id-1", "id-2", "id-3"],
    "description": "Detailed styling explanation with color theory and why it works"
  }
]`;

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: prompt,
      max_tokens: 2000,
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

    // Process AI recommendations and check for duplicates
    for (const aiOutfit of aiOutfits) {
      if (!aiOutfit.itemIds || !Array.isArray(aiOutfit.itemIds)) continue;
      
      // Create a unique key for this combination
      const combinationKey = aiOutfit.itemIds.sort().join('|');
      if (usedCombinations.has(combinationKey)) {
        console.log('Skipping duplicate combination:', combinationKey);
        continue; // Skip duplicate combinations
      }
      
      const outfitItems = items.filter(item => aiOutfit.itemIds.includes(item.id));
      
      if (outfitItems.length >= 2) {
        usedCombinations.add(combinationKey);
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

  // Enhanced fallback with smarter combinations and anti-redundancy
  if (outfits.length < 5) {
    console.log('Using enhanced fallback outfit generation');
    
    // Advanced color coordination with color theory
    const colorHarmony = {
      // Complementary colors
      red: ['green', 'white', 'black', 'gray', 'beige', 'navy'],
      blue: ['orange', 'white', 'black', 'gray', 'beige', 'brown'],
      green: ['red', 'white', 'black', 'gray', 'beige', 'brown'],
      yellow: ['purple', 'white', 'black', 'gray', 'navy', 'blue'],
      purple: ['yellow', 'white', 'black', 'gray', 'green'],
      orange: ['blue', 'white', 'black', 'gray', 'navy'],
      pink: ['white', 'black', 'gray', 'navy', 'green'],
      // Neutrals go with everything
      black: ['white', 'gray', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'beige', 'brown'],
      white: ['black', 'gray', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'beige', 'brown', 'navy'],
      gray: ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'beige', 'brown', 'navy'],
      beige: ['black', 'white', 'gray', 'brown', 'navy', 'green', 'red'],
      brown: ['beige', 'white', 'black', 'gray', 'green', 'blue'],
      navy: ['white', 'beige', 'gray', 'yellow', 'pink', 'red'],
    };
    
    const getComplementaryItems = (baseItem, category) => {
      return categorized[category].filter(item => {
        // Check color harmony
        const baseColor = baseItem.color.toLowerCase();
        const itemColor = item.color.toLowerCase();
        
        if (colorHarmony[baseColor] && colorHarmony[baseColor].includes(itemColor)) {
          return true;
        }
        
        // Same color family
        if (baseColor === itemColor) return true;
        
        return false;
      });
    };
    
    const checkFormalityMatch = (item1, item2) => {
      const formalityLevels = {
        'very-casual': 1,
        'casual': 2,
        'smart-casual': 3,
        'business-casual': 4,
        'business-formal': 5,
        'formal': 6,
        'black-tie': 7
      };
      
      const level1 = formalityLevels[item1.formality] || 2;
      const level2 = formalityLevels[item2.formality] || 2;
      
      // Allow items within 1 formality level
      return Math.abs(level1 - level2) <= 1;
    };

    // Strategy 1: Diverse Top + Bottom combinations
    if (categorized.tops.length > 0 && categorized.bottoms.length > 0) {
      const topIndices = [...Array(categorized.tops.length).keys()];
      const bottomIndices = [...Array(categorized.bottoms.length).keys()];
      
      // Shuffle to create variety
      topIndices.sort(() => Math.random() - 0.5);
      bottomIndices.sort(() => Math.random() - 0.5);
      
      for (const topIdx of topIndices) {
        if (outfits.length >= 5) break;
        
        const top = categorized.tops[topIdx];
        const compatibleBottoms = getComplementaryItems(top, 'bottoms')
          .filter(bottom => checkFormalityMatch(top, bottom));
        
        for (const bottom of compatibleBottoms) {
          const combinationKey = [top.id, bottom.id].sort().join('|');
          if (usedCombinations.has(combinationKey)) continue;
          
          const outfitItems = [top, bottom];
          
          // Add shoes if available and compatible
          if (categorized.shoes.length > 0) {
            const compatibleShoes = categorized.shoes.filter(shoe => 
              checkFormalityMatch(top, shoe) && 
              (colorHarmony[top.color.toLowerCase()]?.includes(shoe.color.toLowerCase()) || 
               shoe.color === 'black' || shoe.color === 'white' || shoe.color === 'brown')
            );
            
            if (compatibleShoes.length > 0) {
              // Rotate through different shoes
              const shoeIdx = outfits.length % compatibleShoes.length;
              outfitItems.push(compatibleShoes[shoeIdx]);
            }
          }
          
          // Add outerwear for cold weather
          if ((weather === 'cold' || weather === 'cool') && categorized.outerwear.length > 0) {
            const compatibleOuterwear = categorized.outerwear.filter(outer => 
              checkFormalityMatch(top, outer)
            );
            if (compatibleOuterwear.length > 0) {
              outfitItems.push(compatibleOuterwear[0]);
            }
          }

          usedCombinations.add(combinationKey);
          outfits.push({
            id: generateId(),
            name: `${top.style.charAt(0).toUpperCase() + top.style.slice(1)} ${occasion} Ensemble`,
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
            description: `${top.color} ${top.category} paired with ${bottom.color} ${bottom.category}${outfitItems.length > 2 ? ' and complementary accessories' : ''}`,
            aiReason: `Color-coordinated ${style} combination using color theory principles, perfect for ${occasion}.`,
          });

          if (outfits.length >= 5) break;
        }
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
