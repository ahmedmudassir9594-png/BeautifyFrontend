import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/services/categories/categories.service';
import type { CategoryResponse } from '@/types/product.types';
import { SiteLayout as Layout } from '@/layouts/SiteLayout';
import { LoadingGrid } from '@/components/common/LoadingGrid';
import { ErrorState } from '@/components/common/ErrorState';

const CATEGORY_IMAGE_FALLBACKS: Array<[RegExp, string]> = [
  [/\b(lip|gloss|lipstick)\b/i, '/products/gloss-ritual-lip-oil.jpg'],
  [/\b(blush|makeup|make-up)\b/i, '/products/silk-veil-cream-blush.jpg'],
  [/\b(skin|cream|moistur|cleanser|serum|toner)\b/i, '/products/dew-cloud-cream/1.jpg'],
  [/\b(earring|earrings|jhumka|jhumki)\b/i, '/products/jewels/traditional-kundan-jhumka.jpg'],
  [/\b(ring|rings)\b/i, '/products/jewels/vintage-emerald-ring.jpg'],
  [/\b(bangle|bangles)\b/i, '/products/jewels/designer-gold-bangles.jpg'],
  [/\b(bracelet|bracelets)\b/i, '/products/jewels/diamond-tennis-bracelet.jpg'],
  [/\b(necklace|necklaces|chain|chains|pendant)\b/i, '/products/jewels/royal-emerald-necklace.jpg'],
];

const CATEGORY_IMAGE_DEFAULTS = [
  '/products/jewels/royal-emerald-necklace.jpg',
  '/products/jewels/traditional-kundan-jhumka.jpg',
  '/products/jewels/designer-gold-bangles.jpg',
  '/products/jewels/vintage-emerald-ring.jpg',
  '/products/jewels/diamond-tennis-bracelet.jpg',
] as const;

function getCategoryImageFallback(category: CategoryResponse, index: number): string {
  return CATEGORY_IMAGE_FALLBACKS.find(([pattern]) => pattern.test(category.name))?.[1]
    ?? CATEGORY_IMAGE_DEFAULTS[index % CATEGORY_IMAGE_DEFAULTS.length];
}

export function CategoriesPage() {
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const categoryList: CategoryResponse[] = Array.isArray(query.data) ? query.data : [];

  return (
    <Layout>
      <main className="page">
        <div className="catalog-head">
          <div>
            <div className="eyebrow">MALKAZ collections</div>
            <h1>
              Discover your
              <br />
              signature piece.
            </h1>
          </div>
          <p className="section-copy">
            Explore fine jewellery collections, from timeless everyday designs to pieces for special occasions.
          </p>
        </div>
        {query.isLoading ? (
          <LoadingGrid />
        ) : query.isError ? (
          <ErrorState retry={() => query.refetch()} />
        ) : (
          <div className="browse-grid category-browse-grid" style={{ marginTop: 35 }}>
            {categoryList.map((category: CategoryResponse, index: number) => (
              <Link
                href={`/shop?category=${category.id}`}
                className="browse-card category-browse-card"
                key={category.id}
                data-testid={`card-browse-category-${category.id}`}
              >
                <img
                  src={category.imageUrl?.trim() || getCategoryImageFallback(category, index)}
                  alt={category.name}
                  loading="lazy"
                  decoding="async"
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    if (image.naturalWidth >= 400 || image.dataset.fallbackApplied) return;
                    image.dataset.fallbackApplied = 'true';
                    image.src = getCategoryImageFallback(category, index);
                  }}
                  onError={(event) => {
                    if (event.currentTarget.dataset.fallbackApplied) return;
                    event.currentTarget.dataset.fallbackApplied = 'true';
                    event.currentTarget.src = getCategoryImageFallback(category, index);
                  }}
                />
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <span className="eyebrow">
                  Explore collection <ArrowRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}

export default CategoriesPage;
