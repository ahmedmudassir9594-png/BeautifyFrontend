/**
 * Products and Reviews Service
 */

import { request } from '@/services/api/client';
import type {
  ProductResponse,
  ProductFilterParams,
  ReviewResponse,
} from '@/types/product.types';
import type { PageResponse } from '@/types/api.types';

export async function fetchProducts(
  params: ProductFilterParams = {}
): Promise<PageResponse<ProductResponse>> {
  const queryParts: string[] = [];
  if (params.query?.trim()) queryParts.push(`query=${encodeURIComponent(params.query.trim())}`);
  if (params.categoryId) queryParts.push(`categoryId=${params.categoryId}`);
  if (params.brandId) queryParts.push(`brandId=${params.brandId}`);
  if (params.featured !== undefined) queryParts.push(`featured=${params.featured}`);
  if (params.minPrice !== undefined) queryParts.push(`minPrice=${params.minPrice}`);
  if (params.maxPrice !== undefined) queryParts.push(`maxPrice=${params.maxPrice}`);
  if (params.page !== undefined) queryParts.push(`page=${params.page}`);
  if (params.size !== undefined) queryParts.push(`size=${params.size}`);
  if (params.sort) queryParts.push(`sort=${encodeURIComponent(params.sort)}`);

  const qs = queryParts.length ? `?${queryParts.join('&')}` : '';
  return request<PageResponse<ProductResponse>>(`/products${qs}`);
}

export async function fetchProductById(id: number): Promise<ProductResponse> {
  return request<ProductResponse>(`/products/${id}`);
}

export async function fetchProductBySlug(slug: string): Promise<ProductResponse> {
  return request<ProductResponse>(`/products/slug/${encodeURIComponent(slug)}`);
}

export async function fetchProductReviews(
  productId: number
): Promise<PageResponse<ReviewResponse>> {
  return request<PageResponse<ReviewResponse>>(`/products/${productId}/reviews`);
}

export async function submitProductReview(
  productId: number,
  review: { rating: number; title?: string; comment: string; orderId?: number }
): Promise<ReviewResponse> {
  return request<ReviewResponse>(`/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
  });
}
