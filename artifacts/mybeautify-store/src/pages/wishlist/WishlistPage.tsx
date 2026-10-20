import { Link } from 'wouter';
import { Heart } from 'lucide-react';
import { useGetWishlist, type Product } from '@workspace/api-client-react';
import { SiteLayout as Layout } from '@/layouts/SiteLayout';
import { LoadingGrid } from '@/components/common/LoadingGrid';
import { ErrorState } from '@/components/common/ErrorState';
import { ProductCard } from '@/components/products/ProductCard';
import { useProductActions } from '@/hooks/use-product-actions';
import { toArray } from '@/utils/array';

export function WishlistPage() {
  const wishlist = useGetWishlist();
  const actions = useProductActions();
  const list = toArray<Product>(wishlist.data);

  return (
    <Layout>
      <main className="page">
        <div className="catalog-head">
          <div>
            <div className="eyebrow">Your considered list</div>
            <h1>Saved for later.</h1>
          </div>
          <p className="section-copy">
            The things that caught your eye. Keep them here until the moment feels right.
          </p>
        </div>
        {wishlist.isLoading ? (
          <LoadingGrid />
        ) : wishlist.isError ? (
          <ErrorState retry={() => wishlist.refetch()} />
        ) : list.length ? (
          <div className="product-grid" style={{ marginTop: 35 }}>
            {list.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                saved
                onSave={actions.save}
                onAdd={actions.add}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ marginTop: 35 }}>
            <Heart size={25} />
            <h2>A little room for want.</h2>
            <p>Save pieces from the edit and they will gather here.</p>
            <Link href="/shop" className="button" data-testid="link-empty-wishlist">
              Explore products
            </Link>
          </div>
        )}
      </main>
    </Layout>
  );
}

export default WishlistPage;
