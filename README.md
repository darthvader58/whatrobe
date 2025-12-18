# Whatrobe - Your AI-Powered Wardrobe Assistant

> *Never wonder what to wear again.*

**Whatrobe** is like having a personal stylist in your pocket, but better – it never judges your 3 AM outfit choices and always knows exactly what's in your closet. Built with modern web technologies and powered by AI, it transforms the daily "what should I wear?" struggle into a fun, swipe-based experience.

## What Makes Whatrobe Special?

### **Smart Wardrobe Management**
Just snap photos of your clothes and let our AI do the heavy lifting. It automatically categorizes everything – from that vintage band tee to your fancy work blazer – so you can focus on looking good instead of organizing.

### **Tinder for Outfits**
Swipe right on outfits you love, left on the ones that don't spark joy. It's addictive, fun, and way more entertaining than staring at your closet for 20 minutes.

### **AI That Actually Gets You**
Our recommendation engine learns your style preferences, considers the weather, and matches outfits to your occasions. Going to a job interview? Date night? Lazy Sunday? We've got you covered.

### **Never Lose a Great Look**
Save your favorite outfit combinations and build a collection of go-to looks for any situation. No more recreating that perfect outfit from memory.

## Tech Stack 

**Frontend:**
- React 18 + Vite (because life's too short for slow builds)
- Framer Motion (for those smooth animations)
- Lucide React (beautiful icons that don't break)

**Backend:**
- Cloudflare Workers (edge computing at its finest)
- D1 Database (SQLite that scales)
- R2 Storage (for all your outfit photos)
- Vectorize (AI embeddings for smart recommendations)

**AI:**
- Cloudflare AI (built-in intelligence)
- Custom recommendation algorithms
- Image analysis for automatic categorization

## Quick Start

1. **Clone:**
   ```bash
   git clone https://github.com/yourusername/whatrobe.git
   cd whatrobe
   ```

2. **Install the goods:**
   ```bash
   npm install
   ```

3. **Set up your secrets:**
   Create a `.env` file:
   ```env
   VITE_OAUTHID=your-google-oauth-client-id
   ```

4. **Start the frontend:**
   ```bash
   npm run dev
   ```

5. **Fire up the backend:**
   ```bash
   cd workers
   wrangler dev
   ```

6. **Open your browser and start building your digital wardrobe!**
   Visit `http://localhost:5173`

## How to Use Whatrobe

1. **Sign in** with your Google account (we promise not to judge your email habits)
2. **Upload your clothes** by taking photos or uploading existing images
3. **Set your preferences** for occasion, style, and weather
4. **Start swiping** through AI-generated outfit recommendations
5. **Save your favorites** and never have a "nothing to wear" moment again

## What's Coming Next?

- **Shopping Integration**: Get recommendations for missing pieces
- **Social Features**: Share your favorite looks with friends



<div align="center">

**Made with &lt;3 by [Shashwat Raj](https://github.com/shashwatraj)**

*Because everyone deserves to look good without the stress*

[🌟 Star this repo](https://github.com/darthvader58/whatrobe) • [🐛 Report Bug](https://github.com/darthvader58/whatrobe/issues) • [💡 Request Feature](https://github.com/darthvader58/whatrobe/issues)

</div>