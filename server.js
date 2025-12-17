import express from 'express';
import multer from 'multer';
import cors from 'cors';

const app = express();
const port = 8788;

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

// Mock AI analysis
function mockAnalyzeImage(filename) {
  const categories = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes'];
  const colors = ['black', 'white', 'blue', 'red', 'gray', 'brown'];
  const styles = ['casual', 'formal', 'athletic', 'vintage'];
  const fits = ['slim', 'regular', 'relaxed', 'oversized'];
  
  return {
    category: categories[Math.floor(Math.random() * categories.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
    style: styles[Math.floor(Math.random() * styles.length)],
    fit: fits[Math.floor(Math.random() * fits.length)],
    season: 'all-season',
    tags: ['clothing', 'wardrobe'],
    description: `A ${colors[Math.floor(Math.random() * colors.length)]} ${categories[Math.floor(Math.random() * categories.length)]} item`
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

app.post('/api/clothing', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  // Convert buffer to base64 for display
  const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  
  // Mock AI analysis
  const analysis = mockAnalyzeImage(req.file.originalname);
  
  const item = {
    id: `item-${itemIdCounter++}`,
    imageUrl,
    ...analysis,
    created_at: Date.now(),
    updated_at: Date.now()
  };
  
  clothingItems.push(item);
  
  res.status(201).json(item);
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