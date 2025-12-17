import express from 'express';
import multer from 'multer';
import cors from 'cors';

const app = express();
const port = 8789;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo
let clothingItems = [];
let outfits = [];
let itemIdCounter = 1;

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Smarter mock AI analysis
function mockAnalyzeImage(filename) {
  const name = filename.toLowerCase();
  
  // Smart category detection based on keywords
  let category = 'tops'; // default
  if (name.includes('shoe') || name.includes('sneaker') || name.includes('boot') || name.includes('sandal')) {
    category = 'shoes';
  } else if (name.includes('pant') || name.includes('jean') || name.includes('trouser') || name.includes('short')) {
    category = 'bottoms';
  } else if (name.includes('dress') || name.includes('gown')) {
    category = 'dresses';
  } else if (name.includes('jacket') || name.includes('coat') || name.includes('hoodie') || name.includes('sweater')) {
    category = 'outerwear';
  } else if (name.includes('shirt') || name.includes('top') || name.includes('blouse') || name.includes('tee')) {
    category = 'tops';
  }
  
  // Smart color detection
  let color = 'gray'; // default
  if (name.includes('black')) color = 'black';
  else if (name.includes('white')) color = 'white';
  else if (name.includes('blue')) color = 'blue';
  else if (name.includes('red')) color = 'red';
  else if (name.includes('green')) color = 'green';
  else if (name.includes('yellow')) color = 'yellow';
  else if (name.includes('brown')) color = 'brown';
  else if (name.includes('pink')) color = 'pink';
  
  // Smart style detection
  let style = 'casual'; // default
  if (name.includes('formal') || name.includes('dress') || name.includes('suit')) {
    style = 'formal';
  } else if (name.includes('sport') || name.includes('athletic') || name.includes('gym')) {
    style = 'athletic';
  } else if (name.includes('vintage') || name.includes('retro')) {
    style = 'vintage';
  }
  
  // Smart fit detection
  let fit = 'regular'; // default
  if (name.includes('slim') || name.includes('tight')) {
    fit = 'slim';
  } else if (name.includes('loose') || name.includes('baggy') || name.includes('oversized')) {
    fit = 'oversized';
  } else if (name.includes('relaxed')) {
    fit = 'relaxed';
  }
  
  return {
    category,
    color,
    style,
    fit,
    season: 'all-season',
    tags: ['clothing', 'wardrobe', category],
    description: `A ${color} ${category} with ${style} style and ${fit} fit`
  };
}

// Routes
app.get('/api/clothing', (req, res) => {
  const { category } = req.query;
  let items = clothingItems;
  
  if (category && category !== 'all') {
    items = clothingItems.filter(item => item.category === category);
  }
  
  res.json(items);
});

app.post('/api/clothing', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    // Convert buffer to base64 for display
    const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Use real AI analysis from Cloudflare Workers
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('image', blob, req.file.originalname);
    
    const aiResponse = await fetch('http://localhost:8788/api/analyze', {
      method: 'POST',
      body: formData
    });
    
    let analysis;
    if (aiResponse.ok) {
      analysis = await aiResponse.json();
    } else {
      // Fallback to smart mock if AI fails
      console.log('AI analysis failed, using fallback');
      analysis = mockAnalyzeImage(req.file.originalname);
    }
    
    const item = {
      id: `item-${itemIdCounter++}`,
      imageUrl,
      ...analysis,
      created_at: Date.now(),
      updated_at: Date.now()
    };
    
    clothingItems.push(item);
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

app.put('/api/clothing/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = clothingItems.findIndex(item => item.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  clothingItems[index] = { ...clothingItems[index], ...updates, updated_at: Date.now() };
  res.json(clothingItems[index]);
});

app.delete('/api/clothing/:id', (req, res) => {
  const { id } = req.params;
  const index = clothingItems.findIndex(item => item.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  clothingItems.splice(index, 1);
  res.json({ success: true });
});

app.post('/api/outfits/recommend', (req, res) => {
  const { occasion = 'casual', style = 'comfortable', weather = 'moderate' } = req.body;
  
  if (clothingItems.length < 2) {
    return res.json({
      error: 'Not enough items in wardrobe. Add at least 2 items.',
      outfits: []
    });
  }
  
  // Simple outfit generation
  const generatedOutfits = [];
  const tops = clothingItems.filter(item => item.category === 'tops');
  const bottoms = clothingItems.filter(item => item.category === 'bottoms');
  const shoes = clothingItems.filter(item => item.category === 'shoes');
  
  // Generate a few outfit combinations
  for (let i = 0; i < Math.min(3, tops.length); i++) {
    for (let j = 0; j < Math.min(2, bottoms.length); j++) {
      const outfitItems = [tops[i], bottoms[j]];
      if (shoes.length > 0) outfitItems.push(shoes[0]);
      
      generatedOutfits.push({
        id: `outfit-${Date.now()}-${i}-${j}`,
        name: `${style} ${occasion} Outfit ${generatedOutfits.length + 1}`,
        items: outfitItems.map(item => ({
          id: item.id,
          imageUrl: item.imageUrl,
          category: item.category,
          color: item.color
        })),
        itemIds: outfitItems.map(item => item.id),
        occasion,
        style,
        weather,
        description: `A ${style} outfit perfect for ${occasion}`,
        aiReason: `This combination works well for ${occasion} occasions with a ${style} style.`
      });
      
      if (generatedOutfits.length >= 5) break;
    }
    if (generatedOutfits.length >= 5) break;
  }
  
  res.json(generatedOutfits);
});

app.get('/api/outfits/favorites', (req, res) => {
  res.json(outfits.filter(outfit => outfit.is_favorite));
});

app.post('/api/outfits/favorites', (req, res) => {
  const { outfitId } = req.body;
  const outfit = outfits.find(o => o.id === outfitId);
  if (outfit) {
    outfit.is_favorite = true;
  }
  res.json({ success: true });
});

app.post('/api/shop/recommendations', (req, res) => {
  res.json({
    message: 'Shopping recommendations coming soon!',
    recommendations: []
  });
});

app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
});