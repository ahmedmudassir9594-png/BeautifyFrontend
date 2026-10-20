import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import {
  useGetProducts,
  useGetCategories,
  type Product,
  type Category,
} from '@workspace/api-client-react';
import { SiteLayout as Layout } from '@/layouts/SiteLayout';
import { LoadingGrid } from '@/components/common/LoadingGrid';
import { ErrorState } from '@/components/common/ErrorState';
import { ProductCard } from '@/components/products/ProductCard';
import { useProductActions } from '@/hooks/use-product-actions';
import { toArray } from '@/utils/array';

export function HomePage() {
  const products = useGetProducts({ sort: 'featured' });
  const categories = useGetCategories();
  const actions = useProductActions();
  const productList = toArray<Product>(products.data);
  const categoryList = toArray<Category>(categories.data);

  return (
    <Layout>
      <main className="page">
        <section className="hero">
          <div>
            <div className="eyebrow">MALKAZ Royal Jewels / 01</div>
            <h1>
              Jewellery made for <em>your story.</em>
            </h1>
            <p className="lede">
              Discover thoughtfully selected gold, gemstones, and timeless designs from MALKAZ Royal Jewels.
            </p>
            <div className="hero-actions">
              <Link href="/shop" className="button" data-testid="link-hero-shop">
                Explore jewellery <ArrowRight size={15} />
              </Link>
              <Link href="/categories" className="button secondary" data-testid="link-hero-categories">
                Browse collections
              </Link>
            </div>
          </div>
          <div className="hero-art" aria-label="MALKAZ fine jewellery collection">
            <img src="/hero-jewellery.jpg" alt="MALKAZ fine jewellery collection" />
          </div>
        </section>

        <section className="section" id="edit">
          <div className="section-head">
            <div>
              <div className="eyebrow">MALKAZ collection</div>
              <h2 className="section-title">Fine jewellery, thoughtfully chosen</h2>
            </div>
            <p className="section-copy">
              Explore distinctive pieces selected for meaningful moments and everyday elegance.
            </p>
          </div>
          {products.isLoading ? (
            <LoadingGrid />
          ) : products.isError ? (
            <ErrorState retry={() => products.refetch()} />
          ) : (
            <div className="product-grid">
              {productList.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  saved={actions.savedIds.has(product.id)}
                  onSave={actions.save}
                  onAdd={actions.add}
                />
              ))}
            </div>
          )}
        </section>

        <div className="marquee">
          <span>
            GOLD / GEMSTONES / KUNDAN / DIAMONDS · GOLD / GEMSTONES / KUNDAN / DIAMONDS · GOLD / GEMSTONES / KUNDAN / DIAMONDS ·{' '}
          </span>
        </div>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Shop by collection</div>
              <h2 className="section-title">Find your signature piece</h2>
            </div>
            <Link href="/categories" className="button secondary small" data-testid="link-all-categories">
              All collections <ArrowRight size={14} />
            </Link>
          </div>
          <div className="category-strip">
            {categoryList.slice(0, 4).map((category) => (
              <Link
                href={`/shop?category=${category.id}`}
                className="category-tile"
                key={category.id}
                data-testid={`card-category-${category.id}`}
              >
                <h3>{category.name}</h3>
                <p>{category.description || `${category.productCount || 0} fine jewellery pieces`}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default HomePage;
