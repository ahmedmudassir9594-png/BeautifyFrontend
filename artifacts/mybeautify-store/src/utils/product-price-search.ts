interface PriceSearchableProduct {
  price?: number | null;
  sellingPrice?: number | null;
  discountPrice?: number | null;
}

export function parsePriceSearchQuery(query: string): number | null {
  const normalized = query
    .trim()
    .replace(/^(?:₹|rs\.?|inr)\s*/i, '')
    .replace(/,/g, '')
    .replace(/\s/g, '');

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;

  const price = Number(normalized);
  return Number.isFinite(price) ? price : null;
}

export function matchesProductPrice(
  product: PriceSearchableProduct,
  searchedPrice: number
): boolean {
  const targetPaise = Math.round(searchedPrice * 100);
  return [product.sellingPrice, product.discountPrice, product.price].some(
    (price) => typeof price === 'number' && Math.round(price * 100) === targetPaise
  );
}
