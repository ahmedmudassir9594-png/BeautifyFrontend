import { DEMO_IMAGES } from '@/constants';

/**
 * Returns the provided image or falls back to a deterministic demo SVG image.
 */
export function imageFor(image?: string | null, index = 0): string {
  if (image && image.trim().length > 0) return image;
  return DEMO_IMAGES[index % DEMO_IMAGES.length];
}
