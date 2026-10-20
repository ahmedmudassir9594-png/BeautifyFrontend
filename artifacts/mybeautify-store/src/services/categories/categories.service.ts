/**
 * Categories Service
 */

import { request } from '@/services/api/client';
import type { CategoryResponse } from '@/types/product.types';

export async function fetchCategories(): Promise<CategoryResponse[]> {
  return request<CategoryResponse[]>('/categories');
}
