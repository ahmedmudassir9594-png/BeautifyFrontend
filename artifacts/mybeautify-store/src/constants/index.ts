/**
 * Application Constants
 */

export const STORAGE_KEYS = {
  TOKEN: 'mybeautify-token',
  REFRESH_TOKEN: 'mybeautify-refresh-token',
  USER: 'mybeautify-user',
} as const;

export const DEMO_IMAGES: readonly string[] = [
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700"%3E%3Crect width="600" height="700" fill="%23d9b6a4"/%3E%3Ccircle cx="460" cy="150" r="230" fill="%23e3d8bc"/%3E%3Crect x="185" y="160" width="225" height="475" rx="35" fill="%23456d67"/%3E%3Ctext x="300" y="420" fill="%23f7f0e6" font-family="serif" font-size="30" text-anchor="middle"%3ELUNE%3C/text%3E%3C/svg%3E',
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700"%3E%3Crect width="600" height="700" fill="%23e5d9bd"/%3E%3Ccircle cx="120" cy="540" r="250" fill="%23c96667"/%3E%3Crect x="205" y="180" width="190" height="400" rx="18" fill="%23f4e7d2"/%3E%3Ctext x="300" y="400" fill="%232c3437" font-family="serif" font-size="28" text-anchor="middle"%3EORRERY%3C/text%3E%3C/svg%3E',
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700"%3E%3Crect width="600" height="700" fill="%233d515c"/%3E%3Ccircle cx="470" cy="130" r="200" fill="%23d9b6a4"/%3E%3Cellipse cx="300" cy="440" rx="160" ry="215" fill="%23c1a77d"/%3E%3Ctext x="300" y="450" fill="%23f7f0e6" font-family="serif" font-size="31" text-anchor="middle"%3ESOFT%3C/text%3E%3C/svg%3E',
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700"%3E%3Crect width="600" height="700" fill="%23c96667"/%3E%3Cpath d="M0 530 Q170 350 360 550 T700 420 V700 H0Z" fill="%23ead7ba"/%3E%3Crect x="185" y="165" width="230" height="380" rx="120" fill="%23456d67"/%3E%3Ctext x="300" y="380" fill="%23f7f0e6" font-family="serif" font-size="31" text-anchor="middle"%3EAURA%3C/text%3E%3C/svg%3E',
] as const;

export const PRODUCT_SIZE_LOOKUP: Record<number, string> = {
  1: 'Adjustable 16-18"',
  2: '2.8" drop',
  3: 'US Size 7',
  4: 'Size 2.6',
  5: '7 inches',
  6: '18" + 2"',
  7: '9mm diameter',
  8: 'US Size 6.5',
};

export const PRODUCT_REVIEW_COUNT_LOOKUP: Record<number, number> = {
  1: 124,
  2: 98,
  3: 76,
  4: 83,
  5: 54,
  6: 43,
  7: 67,
  8: 48,
};

export const PRODUCT_RATING_LOOKUP: Record<number, number> = {
  1: 4.8,
  2: 4.6,
  3: 4.7,
  4: 4.5,
  5: 4.6,
  6: 4.5,
  7: 4.7,
  8: 4.4,
};
