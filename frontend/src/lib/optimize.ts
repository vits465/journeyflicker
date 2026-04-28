/**
 * Utilities for optimizing remote image URLs (Cloudinary, Unsplash, etc.)
 */

export function optimizeImage(url: string | undefined, width = 1200, quality = 80): string {
  if (!url) return '';

  // 1. Cloudinary Optimization
  if (url.includes('res.cloudinary.com')) {
    // We insert transformations after /upload/
    if (url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
    }
  }

  // 2. Unsplash Optimization
  if (url.includes('images.unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&w=${width}&q=${quality}`;
  }

  // 3. Pexels / Generic Unsplash-like (if applicable)
  // Most modern CDNs follow a similar pattern. 
  
  return url;
}
