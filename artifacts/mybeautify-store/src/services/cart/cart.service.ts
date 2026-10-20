/**
 * Shopping Cart Service
 */

import { request } from '@/services/api/client';
import type { CartResponse } from '@/types/cart.types';

export async function fetchCart(): Promise<CartResponse> {
  return request<CartResponse>('/cart');
}

export async function addToCart(productId: number, quantity = 1): Promise<CartResponse> {
  return request<CartResponse>('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartItemQuantity(
  itemId: number,
  quantity: number
): Promise<CartResponse> {
  return request<CartResponse>(`/cart/items/${itemId}?quantity=${quantity}`, {
    method: 'PUT',
  });
}

export async function removeCartItem(itemId: number): Promise<void> {
  return request<void>(`/cart/items/${itemId}`, {
    method: 'DELETE',
  });
}

export async function clearCart(): Promise<void> {
  return request<void>('/cart/clear', {
    method: 'DELETE',
  });
}
