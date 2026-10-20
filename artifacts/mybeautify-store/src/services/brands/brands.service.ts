/**
 * Brands Service
 */

import { request } from '@/services/api/client';
import type { BrandResponse } from '@/types/product.types';

export async function fetchBrands(): Promise<BrandResponse[]> {
  const res = await request<any>('/brands');
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return [];
}
