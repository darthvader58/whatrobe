-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    picture TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Clothing items table
CREATE TABLE IF NOT EXISTS clothing_items (
    id TEXT PRIMARY KEY,
    user_id TEXT,
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
    tags TEXT, -- JSON array
    description TEXT,
    embedding_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clothing_user ON clothing_items(user_id);
CREATE INDEX IF NOT EXISTS idx_clothing_category ON clothing_items(category);
CREATE INDEX IF NOT EXISTS idx_clothing_color ON clothing_items(color);

-- Outfits table
CREATE TABLE IF NOT EXISTS outfits (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    occasion TEXT,
    style TEXT,
    weather TEXT,
    items TEXT NOT NULL, -- JSON array of clothing_item IDs
    ai_reason TEXT,
    is_favorite INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_outfits_user ON outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_outfits_favorite ON outfits(is_favorite);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    default_style TEXT,
    favorite_colors TEXT, -- JSON array
    preferred_fit TEXT,
    occasions TEXT, -- JSON array
    updated_at INTEGER NOT NULL
);