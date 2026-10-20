/**
 * Wishlist Service
 */

import { request } from '@/services/api/client';
import type { ProductResponse } from '@/types/product.types';

export async function fetchWishlist(): Promise<ProductResponse[]> {
  return request<ProductResponse[]>('/wishlist');
}

export async function addToWishlist(productId: number): Promise<ProductResponse[]> {
  return request<ProductResponse[]>(`/wishlist/${productId}`, {
    method: 'POST',
  });
}

export async function removeFromWishlist(productId: number): Promise<void> {
  return request<void>(`/wishlist/${productId}`, {
    method: 'DELETE',
  });
}
