import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchBrands } from '@/services/brands/brands.service';
import type { BrandResponse } from '@/types/product.types';
import { SiteLayout as Layout } from '@/layouts/SiteLayout';
import { LoadingGrid } from '@/components/common/LoadingGrid';
import { ErrorState } from '@/components/common/ErrorState';
import { initials } from '@/utils/format';

export function BrandsPage() {
  const query = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });
  const brandList: BrandResponse[] = Array.isArray(query.data) ? query.data : [];

  return (
    <Layout>
      <main className="page">
        <div className="catalog-head">
          <div>
            <div className="eyebrow">MALKAZ designers</div>
            <h1>
              Discover the
              <br />
              collections.
            </h1>
          </div>
          <p className="section-copy">
            Browse the jewellery houses and makers featured in the MALKAZ collection.
          </p>
        </div>
        {query.isLoading ? (
          <LoadingGrid />
        ) : query.isError ? (
          <ErrorState retry={() => query.refetch()} />
        ) : (
          <div className="browse-grid" style={{ marginTop: 35 }}>
            {brandList.map((brand: BrandResponse) => (
              <Link
                href={`/shop?brand=${brand.id}`}
                className="browse-card"
                key={brand.id}
                data-testid={`card-browse-brand-${brand.id}`}
              >
                {brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="avatar-img"
                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'contain', background: '#fff', padding: 4 }}
                  />
                ) : (
                  <div className="avatar">{initials(brand.name)}</div>
                )}
                <h3>{brand.name}</h3>
                <p>{brand.description}</p>
                <span className="eyebrow">
                  View products <ArrowRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}

export default BrandsPage;
