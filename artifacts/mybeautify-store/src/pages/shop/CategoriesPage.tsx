import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/services/categories/categories.service';
import type { CategoryResponse } from '@/types/product.types';
import { SiteLayout as Layout } from '@/layouts/SiteLayout';
import { LoadingGrid } from '@/components/common/LoadingGrid';
import { ErrorState } from '@/components/common/ErrorState';
import { imageFor } from '@/utils/image';

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
          <div className="browse-grid" style={{ marginTop: 35 }}>
            {categoryList.map((category: CategoryResponse, index: number) => (
              <Link
                href={`/shop?category=${category.id}`}
                className="browse-card"
                key={category.id}
                data-testid={`card-browse-category-${category.id}`}
              >
                <img src={imageFor(category.imageUrl || (category as any).image, index)} alt={category.name} />
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
