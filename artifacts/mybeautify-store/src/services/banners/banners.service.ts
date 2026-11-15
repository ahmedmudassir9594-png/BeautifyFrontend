/**
 * MALKAZ Luxury Jewellery - Storefront & Admin Hero Banners Service
 */

import { request } from '@/services/api/client';
import { extractArray } from '@/utils/array';
import type { HeroBanner, HeroBannerRequest, ShowcaseImage, ShowcaseImageRequest } from '@/types/banner.types';

export async function fetchBanners(): Promise<HeroBanner[]> {
  try {
    const res = await request<unknown>('/banners');
    return extractArray<HeroBanner>(res);
  } catch (error) {
    console.warn('Could not fetch active hero banners from backend:', error);
    return [];
  }
}

export async function fetchAdminBanners(): Promise<HeroBanner[]> {
  const res = await request<unknown>('/admin/banners');
  return extractArray<HeroBanner>(res);
}

export async function createAdminBanner(data: HeroBannerRequest): Promise<HeroBanner> {
  return request<HeroBanner>('/admin/banners', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminBanner(id: number, data: HeroBannerRequest): Promise<HeroBanner> {
  return request<HeroBanner>(`/admin/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleAdminBannerStatus(id: number, active: boolean): Promise<HeroBanner> {
  return request<HeroBanner>(`/admin/banners/${id}/status?active=${active}`, {
    method: 'PATCH',
  });
}

export async function deleteAdminBanner(id: number): Promise<void> {
  return request<void>(`/admin/banners/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchShowcaseImages(): Promise<ShowcaseImage[]> {
  try {
    const res = await request<unknown>('/showcase-images');
    return extractArray<ShowcaseImage>(res);
  } catch (error) {
    console.warn('Could not fetch active showcase images from backend:', error);
    return [];
  }
}

export async function fetchAdminShowcaseImages(): Promise<ShowcaseImage[]> {
  const res = await request<unknown>('/admin/showcase-images');
  return extractArray<ShowcaseImage>(res);
}

export async function createAdminShowcaseImage(data: ShowcaseImageRequest): Promise<ShowcaseImage> {
  return request<ShowcaseImage>('/admin/showcase-images', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminShowcaseImage(id: number, data: ShowcaseImageRequest): Promise<ShowcaseImage> {
  return request<ShowcaseImage>(`/admin/showcase-images/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleAdminShowcaseStatus(id: number, active: boolean): Promise<ShowcaseImage> {
  return request<ShowcaseImage>(`/admin/showcase-images/${id}/status?active=${active}`, {
    method: 'PATCH',
  });
}

export async function deleteAdminShowcaseImage(id: number): Promise<void> {
  return request<void>(`/admin/showcase-images/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderAdminShowcaseImages(orderedIds: number[]): Promise<ShowcaseImage[]> {
  const res = await request<unknown>('/admin/showcase-images/reorder', {
    method: 'PUT',
    body: JSON.stringify(orderedIds),
  });
  return extractArray<ShowcaseImage>(res);
}


