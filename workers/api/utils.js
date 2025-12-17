// Utility functions for Cloudflare Workers

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getCurrentTimestamp() {
  return Date.now();
}

export function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function sanitizeString(str) {
  if (!str) return '';
  return str.trim().toLowerCase();
}

export const VALID_CATEGORIES = [
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
  'bags',
  'jewelry',
];

export const VALID_COLORS = [
  'black',
  'white',
  'gray',
  'red',
  'pink',
  'purple',
  'blue',
  'cyan',
  'green',
  'yellow',
  'orange',
  'brown',
  'beige',
  'navy',
  'maroon',
  'olive',
  'teal',
];

export const VALID_STYLES = [
  'casual',
  'formal',
  'business',
  'athletic',
  'streetwear',
  'bohemian',
  'vintage',
  'minimalist',
  'preppy',
  'edgy',
  'elegant',
  'comfortable',
];

export const VALID_FITS = ['slim', 'regular', 'relaxed', 'oversized', 'fitted', 'loose', 'tailored'];

export function normalizeCategory(category) {
  const normalized = sanitizeString(category);
  return VALID_CATEGORIES.includes(normalized) ? normalized : 'tops';
}

export function normalizeColor(color) {
  const normalized = sanitizeString(color);
  return VALID_COLORS.includes(normalized) ? normalized : 'gray';
}

export function normalizeStyle(style) {
  const normalized = sanitizeString(style);
  return VALID_STYLES.includes(normalized) ? normalized : 'casual';
}

export function normalizeFit(fit) {
  const normalized = sanitizeString(fit);
  return VALID_FITS.includes(normalized) ? normalized : 'regular';
}