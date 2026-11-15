/**
 * MALKAZ Luxury Jewellery - Hero Banner Types
 * Aligned with Spring Boot HeroBanner entity & BannerDtos
 */

export interface HeroBanner {
  id: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  imageUrl: string;
  displayOrder: number;
  active: boolean;
  createdAt?: string;
}

export interface HeroBannerRequest {
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl: string;
  displayOrder?: number;
  active?: boolean;
}

export interface ShowcaseImage {
  id: number;
  title?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  displayOrder: number;
  active: boolean;
  createdAt?: string;
}

export interface ShowcaseImageRequest {
  title?: string;
  imageUrl: string;
  linkUrl?: string;
  displayOrder?: number;
  active?: boolean;
}


