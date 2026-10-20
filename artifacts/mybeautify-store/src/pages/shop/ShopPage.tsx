import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Search } from 'lucide-react';
import {
  useGetProducts,
  useGetCategories,
  type Product,
} from '@workspace/api-client-react';
import { SiteLayout as Layout } from '@/layouts/SiteLayout';
import { LoadingGrid } from '@/components/common/LoadingGrid';
import { ErrorState } from '@/components/common/ErrorState';
import { ProductCard } from '@/components/products/ProductCard';
import { useProductActions } from '@/hooks/use-product-actions';
import { toArray } from '@/utils/array';

export function ShopPage() {
  const [location] = useLocation();
  const initialParams = useMemo(() => new URLSearchParams(location.split('?')[1] || ''), [location]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(() => initialParams.get('category') || '');
  const [brand] = useState(() => initialParams.get('brand') || '');
  const [sort, setSort] = useState<'featured' | 'newest' | 'price-low' | 'price-high' | 'rating'>('featured');

  const products = useGetProducts({
    search: search || undefined,
    category: category || undefined,
    brand: brand || undefined,
    sort,
  });
  const categories = useGetCategories();
  const actions = useProductActions();
  const productList = toArray<Product>(products.data);
  const categoryList = toArray<{ id: string; name: string }>(categories.data);

  return (
    <Layout>
      <main className="page">
        <div className="catalog-head">
          <div>
            <div className="eyebrow">The storefront</div>
            <h1>Everything good.</h1>
          </div>
          <div className="catalog-tools">
            <input
              className="input search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products or brands"
              aria-label="Search products"
              data-testid="input-product-search"
            />
            <select
              className="select"
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
              aria-label="Sort products"
              data-testid="select-sort"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>
        </div>

        <div className="catalog-layout">
          <aside className="filters">
            <div className="filter-group">
              <h3 className="filter-title">Filter by ritual</h3>
              <label className="filter-label">
                <input
                  type="radio"
                  name="category"
                  checked={!category}
                  onChange={() => setCategory('')}
                />{' '}
                All products
              </label>
              {categoryList.map((item) => (
                <label className="filter-label" key={item.id}>
                  <input
                    type="radio"
                    name="category"
                    checked={category === item.id}
                    onChange={() => setCategory(item.id)}
                  />{' '}
                  {item.name}
                </label>
              ))}
            </div>
          </aside>

          <section>
            {products.isLoading ? (
              <LoadingGrid />
            ) : products.isError ? (
              <ErrorState retry={() => products.refetch()} />
            ) : productList.length ? (
              <div className="product-grid">
                {productList.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    saved={actions.savedIds.has(product.id)}
                    onSave={actions.save}
                    onAdd={actions.add}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search size={24} />
                <h2>No perfect match yet.</h2>
                <p>Try a broader search or browse the full edit.</p>
                <button
                  className="button secondary"
                  onClick={() => {
                    setSearch('');
                    setCategory('');
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </Layout>
  );
}

export default ShopPage;
