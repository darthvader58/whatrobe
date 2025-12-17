// Utility functions

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Color utilities
export const COLORS = [
  'black', 'white', 'gray', 'red', 'pink', 'purple',
  'blue', 'cyan', 'green', 'yellow', 'orange', 'brown',
  'beige', 'navy', 'maroon', 'olive', 'teal'
];

export const CATEGORIES = [
  'tops', 'bottoms', 'dresses', 'outerwear', 
  'shoes', 'accessories', 'bags', 'jewelry'
];

export const STYLES = [
  'casual', 'formal', 'business', 'athletic',
  'streetwear', 'bohemian', 'vintage', 'minimalist',
  'preppy', 'edgy', 'elegant', 'comfortable'
];

export const FITS = [
  'slim', 'regular', 'relaxed', 'oversized',
  'fitted', 'loose', 'tailored'
];

export const OCCASIONS = [
  'work', 'casual', 'formal', 'party',
  'athletic', 'date night', 'travel', 'home'
];

// Image processing utilities
export function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}