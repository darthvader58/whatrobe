-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    picture TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Clothing items table with proper foreign key relationship
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
    tags TEXT, -- JSON array
    description TEXT,
    embedding_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clothing_user ON clothing_items(user_id);
CREATE INDEX IF NOT EXISTS idx_clothing_category ON clothing_items(category);
CREATE INDEX IF NOT EXISTS idx_clothing_color ON clothing_items(color);

-- Outfits table with proper foreign key relationship
CREATE TABLE IF NOT EXISTS outfits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT,
    occasion TEXT,
    style TEXT,
    weather TEXT,
    items TEXT NOT NULL, -- JSON array of clothing_item IDs
    ai_reason TEXT,
    is_favorite INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_outfits_user ON outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_outfits_favorite ON outfits(is_favorite);

-- User preferences table with proper foreign key relationship
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    default_style TEXT,
    favorite_colors TEXT, -- JSON array
    preferred_fit TEXT,
    occasions TEXT, -- JSON array
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feedback table (no foreign key needed as it can exist independently)
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);