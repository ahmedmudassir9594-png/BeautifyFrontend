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
            <div className="eyebrow">The considered beauty edit / 01</div>
            <h1>
              Beauty that feels like <em>breathing out.</em>
            </h1>
            <p className="lede">
              A small, discerning shop for skincare, color, hair, and the quiet things that make a day feel more yours.
            </p>
            <div className="hero-actions">
              <Link href="/shop" className="button" data-testid="link-hero-shop">
                Explore the edit <ArrowRight size={15} />
              </Link>
              <Link href="/categories" className="button secondary" data-testid="link-hero-categories">
                Browse by ritual
              </Link>
            </div>
          </div>
          <div className="hero-art" aria-label="A warm botanical beauty still life">
            <div className="hero-bottle" />
          </div>
        </section>

        <section className="section" id="edit">
          <div className="section-head">
            <div>
              <div className="eyebrow">In the edit</div>
              <h2 className="section-title">Quietly exceptional</h2>
            </div>
            <p className="section-copy">
              The pieces we reach for most. Ingredient-led, sensorial, and made to live on your shelf.
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
            SKIN / COLOR / HAIR / SELF · SKIN / COLOR / HAIR / SELF · SKIN / COLOR / HAIR / SELF · SKIN / COLOR / HAIR / SELF ·{' '}
          </span>
        </div>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Shop by ritual</div>
              <h2 className="section-title">Find your way in</h2>
            </div>
            <Link href="/categories" className="button secondary small" data-testid="link-all-categories">
              All categories <ArrowRight size={14} />
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
                <p>{category.description || `${category.productCount || 0} considered pieces`}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default HomePage;
