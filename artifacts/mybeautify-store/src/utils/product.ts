import type { ProductResponse } from '@/types/product.types';
import {
  PRODUCT_SIZE_LOOKUP,
  PRODUCT_REVIEW_COUNT_LOOKUP,
  PRODUCT_RATING_LOOKUP,
} from '@/constants';

/**
 * Calculates discount percentage label (e.g., "25% OFF")
 */
export const getDiscountPercent = (price: number, discountPrice?: number): string | null => {
  if (!discountPrice || discountPrice >= price) return null;
  const pct = Math.round(((price - discountPrice) / price) * 100);
  return pct > 0 ? `${pct}% OFF` : null;
};

/**
 * Derives badge text and CSS class from product attributes
 */
export const getProductBadge = (
  product: ProductResponse
): { text: string; type: string } => {
  const discount = product.discountPrice ? (product.price - product.discountPrice) / product.price : 0;
  if (discount >= 0.25) return { text: 'Hot Deal', type: 'mb-badge-hotdeal' };
  if (product.featured) return { text: 'Best Seller', type: 'mb-badge-bestseller' };
  if (product.id % 4 === 0) return { text: 'Trending', type: 'mb-badge-trending' };
  if (product.id >= 4) return { text: 'New', type: 'mb-badge-new' };
  return { text: 'Bestseller', type: 'mb-badge-bestseller' };
};

/**
 * Derives display size for a product
 */
export const getProductSize = (product: ProductResponse): string => {
  if (product.size) return product.size;
  return PRODUCT_SIZE_LOOKUP[product.id] || '50ml';
};

/**
 * Derives review count for a product
 */
export const getProductReviewCount = (product: ProductResponse): number => {
  return PRODUCT_REVIEW_COUNT_LOOKUP[product.id] || 25 + (product.id * 7) % 40;
};

/**
 * Derives average rating for a product
 */
export const getProductRating = (product: ProductResponse): number => {
  if (product.averageRating && product.averageRating > 0) return product.averageRating;
  return PRODUCT_RATING_LOOKUP[product.id] || 4.5;
};
