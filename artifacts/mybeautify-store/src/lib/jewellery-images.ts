const JEWELLERY_IMAGES = [
  '/products/jewels/royal-emerald-necklace.jpg',
  '/products/jewels/traditional-kundan-jhumka.jpg',
  '/products/jewels/vintage-emerald-ring.jpg',
  '/products/jewels/designer-gold-bangles.jpg',
  '/products/jewels/diamond-tennis-bracelet.jpg',
  '/products/jewels/graceful-pendant-necklace.jpg',
  '/products/jewels/classic-green-studs.jpg',
  '/products/jewels/floral-diamond-ring.jpg',
] as const;

const NON_JEWELLERY_CONTENT =
  /\b(skincare|skin[- ]?care|cosmetic|make[- ]?up|cream|serum|cleanser|lipstick|lip[- ]?oil|blush|foundation|toner|sunscreen|mascara|moisturizer|moisturiser|beauty)\b/i;

const JEWELLERY_CATEGORIES: Array<[RegExp, (typeof JEWELLERY_IMAGES)[number]]> = [
  [/\b(jhumka|jhumki|earring|studs?)\b/i, JEWELLERY_IMAGES[1]],
  [/\b(ring|rings)\b/i, JEWELLERY_IMAGES[2]],
  [/\b(bangle|bangles)\b/i, JEWELLERY_IMAGES[3]],
  [/\b(bracelet|bracelets)\b/i, JEWELLERY_IMAGES[4]],
  [/\b(pendant|pendants|chain|chains)\b/i, JEWELLERY_IMAGES[5]],
  [/\b(necklace|necklaces)\b/i, JEWELLERY_IMAGES[0]],
];

export function getJewelleryImage(
  imageUrl?: string | null,
  productName?: string | null,
  productId?: number,
): string {
  const name = productName ?? '';
  const url = imageUrl ?? '';
  const source = `${name} ${url}`;

  if (
    url.startsWith('/products/jewels/') &&
    !NON_JEWELLERY_CONTENT.test(source)
  ) {
    return url;
  }

  if (
    /^https?:\/\//i.test(url) &&
    !NON_JEWELLERY_CONTENT.test(source)
  ) {
    return url;
  }

  const matchedCategory = JEWELLERY_CATEGORIES.find(([pattern]) => pattern.test(name));
  if (matchedCategory) return matchedCategory[1];

  const numericId = typeof productId === 'number' && Number.isFinite(productId)
    ? Math.abs(productId)
    : 0;
  return JEWELLERY_IMAGES[numericId % JEWELLERY_IMAGES.length];
}
