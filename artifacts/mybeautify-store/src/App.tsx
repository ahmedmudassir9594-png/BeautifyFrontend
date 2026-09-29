import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import {
  ArrowRight, Heart, Menu, Minus, Plus, Search, ShoppingBag, UserRound, X,
} from 'lucide-react';
import {
  getGetCartQueryKey, getGetWishlistQueryKey, getGetOrdersQueryKey,
  useAddCartItem, useAddWishlistItem, useClearCart, useCreateOrder, useGetBrands, useGetCategories,
  useGetCart, useGetOrders, useGetProduct, useGetProductReviews, useGetProducts, useGetWishlist,
  useLogin, useRegister, useRemoveCartItem, useRemoveWishlistItem, useUpdateCartItem, useValidateCoupon,
} from '@workspace/api-client-react';
import type { Brand, Category, Order, Product, Review } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const money = (value = 0) => `$${value.toFixed(2)}`;
const initials = (name = 'Guest') => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const demoImages = [
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700"%3E%3Crect width="600" height="700" fill="%23d9b6a4"/%3E%3Ccircle cx="460" cy="150" r="230" fill="%23e3d8bc"/%3E%3Crect x="185" y="160" width="225" height="475" rx="35" fill="%23456d67"/%3E%3Ctext x="300" y="420" fill="%23f7f0e6" font-family="serif" font-size="30" text-anchor="middle"%3ELUNE%3C/text%3E%3C/svg%3E',
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700"%3E%3Crect width="600" height="700" fill="%23e5d9bd"/%3E%3Ccircle cx="120" cy="540" r="250" fill="%23c96667"/%3E%3Crect x="205" y="180" width="190" height="400" rx="18" fill="%23f4e7d2"/%3E%3Ctext x="300" y="400" fill="%232c3437" font-family="serif" font-size="28" text-anchor="middle"%3EORRERY%3C/text%3E%3C/svg%3E',
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700"%3E%3Crect width="600" height="700" fill="%233d515c"/%3E%3Ccircle cx="470" cy="130" r="200" fill="%23d9b6a4"/%3E%3Cellipse cx="300" cy="440" rx="160" ry="215" fill="%23c1a77d"/%3E%3Ctext x="300" y="450" fill="%23f7f0e6" font-family="serif" font-size="31" text-anchor="middle"%3ESOFT%3C/text%3E%3C/svg%3E',
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700"%3E%3Crect width="600" height="700" fill="%23c96667"/%3E%3Cpath d="M0 530 Q170 350 360 550 T700 420 V700 H0Z" fill="%23ead7ba"/%3E%3Crect x="185" y="165" width="230" height="380" rx="120" fill="%23456d67"/%3E%3Ctext x="300" y="380" fill="%23f7f0e6" font-family="serif" font-size="31" text-anchor="middle"%3EAURA%3C/text%3E%3C/svg%3E',
];
const imageFor = (image: string, index = 0) => image || demoImages[index % demoImages.length];

function BrandMark({ href = '/', testId = 'link-home' }: { href?: string; testId?: string }) {
  return <Link href={href} className="brand-lockup" data-testid={testId}>
    <img className="brand-mark" src="/mybeautify-mark.png" alt="" aria-hidden="true" />
    <span className="brand-name">MyBeautify</span>
  </Link>;
}

function LoadingGrid() {
  return <div className="loading-grid" data-testid="loading-products">{[1, 2, 3, 4].map((item) => <div key={item}><div className="skeleton image" /><div className="skeleton line" /><div className="skeleton line" /></div>)}</div>;
}

function ErrorState({ retry }: { retry?: () => void }) {
  return <div className="error-state" data-testid="status-error"><h3>We hit a quiet patch</h3><p>Something did not load as expected. Please try again.</p>{retry && <button className="button secondary" onClick={retry} data-testid="button-retry">Try again</button>}</div>;
}

function ProductCard({ product, saved = false, onSave, onAdd }: { product: Product; saved?: boolean; onSave?: (product: Product) => void; onAdd?: (product: Product) => void }) {
  return <article className="product-card" data-testid={`card-product-${product.id}`}>
    <div className="product-image">
      {product.badge && <span className="badge">{product.badge}</span>}
      {onSave && <button className="heart-button" onClick={() => onSave(product)} aria-label={saved ? 'Remove from saved items' : 'Save product'} data-testid={`button-save-${product.id}`}><Heart size={16} fill={saved ? 'currentColor' : 'none'} /></button>}
      <Link href={`/product/${product.id}`} data-testid={`link-product-${product.id}`}><img src={imageFor(product.image)} alt={product.name} /></Link>
      {onAdd && <div className="product-overlay"><button className="button small" onClick={() => onAdd(product)} data-testid={`button-add-${product.id}`}>Add to bag</button><Link href={`/product/${product.id}`} className="button small secondary" data-testid={`link-view-${product.id}`}>View</Link></div>}
    </div>
    <div className="product-info"><div className="product-brand">{product.brand}</div><Link href={`/product/${product.id}`} className="product-name" data-testid={`text-product-name-${product.id}`}>{product.name}</Link><div className="product-meta"><span className="stars">{'★'.repeat(Math.min(5, Math.round(product.rating || 0)))} <small>({product.reviews || 0})</small></span><span>{money(product.price)}{product.compareAtPrice && <span className="price-old">{money(product.compareAtPrice)}</span>}</span></div></div>
  </article>;
}

function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menu, setMenu] = useState(false);
  const cart = useGetCart();
  const count = cart.data?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const nav = [['Shop', '/shop'], ['Categories', '/categories'], ['Brands', '/brands'], ['Our edit', '/#edit']];
  return <div className="site-shell">
    <div className="topline">Complimentary shipping on orders over $75 · A considered edit for everyday rituals</div>
    <header className="nav">
      <BrandMark />
      <nav className={`navlinks ${menu ? 'show' : ''}`}>{nav.map(([label, href]) => <Link key={href} href={href} className={location === href ? 'active' : ''} data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`}>{label}</Link>)}</nav>
      <div className="nav-actions">
        <Link href="/shop" className="icon-button" aria-label="Search products" data-testid="link-search"><Search size={18} /></Link>
        <Link href="/account" className="icon-button" aria-label="Account" data-testid="link-account"><UserRound size={18} /></Link>
        <Link href="/cart" className="icon-button" aria-label="Shopping bag" data-testid="link-cart"><ShoppingBag size={18} />{count > 0 && <span className="cart-count" data-testid="text-cart-count">{count}</span>}</Link>
        <button className="icon-button mobile-menu" onClick={() => setMenu((open) => !open)} aria-label="Toggle menu" data-testid="button-mobile-menu">{menu ? <X size={19} /> : <Menu size={19} />}</button>
      </div>
    </header>
    {children}
    <footer className="footer"><BrandMark href="/" testId="link-footer-home" /><span>Small rituals, beautifully chosen.</span><nav><Link href="/shop" data-testid="link-footer-shop">Shop</Link> &nbsp;·&nbsp; <Link href="/account" data-testid="link-footer-account">Account</Link> &nbsp;·&nbsp; <Link href="/wishlist" data-testid="link-footer-wishlist">Saved items</Link></nav></footer>
  </div>;
}

function useProductActions() {
  const qc = useQueryClient();
  const addCart = useAddCartItem();
  const addWish = useAddWishlistItem();
  const removeWish = useRemoveWishlistItem();
  const wishlist = useGetWishlist();
  const savedIds = useMemo(() => new Set((wishlist.data || []).map((item) => item.id)), [wishlist.data]);
  const save = (product: Product) => {
    if (savedIds.has(product.id)) {
      removeWish.mutate({ productId: product.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetWishlistQueryKey() }) });
    } else {
      addWish.mutate({ data: { productId: product.id } }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetWishlistQueryKey() }) });
    }
  };
  const add = (product: Product) => addCart.mutate({ data: { productId: product.id, quantity: 1 } }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetCartQueryKey() }) });
  return { savedIds, save, add };
}

function Home() {
  const products = useGetProducts({ sort: 'featured' });
  const categories = useGetCategories();
  const actions = useProductActions();
  return <Layout><main className="page">
    <section className="hero"><div><div className="eyebrow">The considered beauty edit / 01</div><h1>Beauty that feels like <em>breathing out.</em></h1><p className="lede">A small, discerning shop for skincare, color, hair, and the quiet things that make a day feel more yours.</p><div className="hero-actions"><Link href="/shop" className="button" data-testid="link-hero-shop">Explore the edit <ArrowRight size={15} /></Link><Link href="/categories" className="button secondary" data-testid="link-hero-categories">Browse by ritual</Link></div></div><div className="hero-art" aria-label="A warm botanical beauty still life"><div className="hero-bottle" /></div></section>
    <section className="section" id="edit"><div className="section-head"><div><div className="eyebrow">In the edit</div><h2 className="section-title">Quietly exceptional</h2></div><p className="section-copy">The pieces we reach for most. Ingredient-led, sensorial, and made to live on your shelf.</p></div>{products.isLoading ? <LoadingGrid /> : products.isError ? <ErrorState retry={() => products.refetch()} /> : <div className="product-grid">{(products.data || []).slice(0, 4).map((product) => <ProductCard key={product.id} product={product} saved={actions.savedIds.has(product.id)} onSave={actions.save} onAdd={actions.add} />)}</div>}</section>
    <div className="marquee"><span>SKIN / COLOR / HAIR / SELF · SKIN / COLOR / HAIR / SELF · SKIN / COLOR / HAIR / SELF · SKIN / COLOR / HAIR / SELF · </span></div>
    <section className="section"><div className="section-head"><div><div className="eyebrow">Shop by ritual</div><h2 className="section-title">Find your way in</h2></div><Link href="/categories" className="button secondary small" data-testid="link-all-categories">All categories <ArrowRight size={14} /></Link></div><div className="category-strip">{(categories.data || []).slice(0, 4).map((category, index) => <Link href={`/shop?category=${category.id}`} className="category-tile" key={category.id} data-testid={`card-category-${category.id}`}><h3>{category.name}</h3><p>{category.description || `${category.productCount} considered pieces`}</p></Link>)}</div></section>
  </main></Layout>;
}

function Shop() {
  const [location] = useLocation();
  const initialParams = useMemo(() => new URLSearchParams(location.split('?')[1] || ''), [location]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(() => initialParams.get('category') || '');
  const [brand, setBrand] = useState(() => initialParams.get('brand') || '');
  const [sort, setSort] = useState<'featured' | 'newest' | 'price-low' | 'price-high' | 'rating'>('featured');
  const products = useGetProducts({ search: search || undefined, category: category || undefined, brand: brand || undefined, sort });
  const categories = useGetCategories();
  const actions = useProductActions();
  return <Layout><main className="page"><div className="catalog-head"><div><div className="eyebrow">The storefront</div><h1>Everything good.</h1></div><div className="catalog-tools"><input className="input search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or brands" aria-label="Search products" data-testid="input-product-search" /><select className="select" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Sort products" data-testid="select-sort"><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Highest rated</option></select></div></div><div className="catalog-layout"><aside className="filters"><div className="filter-group"><h3 className="filter-title">Filter by ritual</h3><label className="filter-label"><input type="radio" name="category" checked={!category} onChange={() => setCategory('')} /> All products</label>{(categories.data || []).map((item) => <label className="filter-label" key={item.id}><input type="radio" name="category" checked={category === item.id} onChange={() => setCategory(item.id)} /> {item.name}</label>)}</div></aside><section>{products.isLoading ? <LoadingGrid /> : products.isError ? <ErrorState retry={() => products.refetch()} /> : products.data?.length ? <div className="product-grid">{products.data.map((product) => <ProductCard key={product.id} product={product} saved={actions.savedIds.has(product.id)} onSave={actions.save} onAdd={actions.add} />)}</div> : <div className="empty-state"><Search size={24} /><h2>No perfect match yet.</h2><p>Try a broader search or browse the full edit.</p><button className="button secondary" onClick={() => { setSearch(''); setCategory(''); }} data-testid="button-clear-filters">Clear filters</button></div>}</section></div></main></Layout>;
}

function Categories() {
  const query = useGetCategories();
  return <Layout><main className="page"><div className="catalog-head"><div><div className="eyebrow">Browse by ritual</div><h1>Start with what<br />you need.</h1></div><p className="section-copy">A softer way to shop. Begin with the ritual, then discover the pieces that belong in it.</p></div>{query.isLoading ? <LoadingGrid /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : <div className="browse-grid" style={{ marginTop: 35 }}>{(query.data || []).map((category: Category) => <Link href={`/shop?category=${category.id}`} className="browse-card" key={category.id} data-testid={`card-browse-category-${category.id}`}><img src={imageFor(category.image)} alt="" /><h3>{category.name}</h3><p>{category.description}</p><span className="eyebrow">{category.productCount} pieces <ArrowRight size={13} /></span></Link>)}</div>}</main></Layout>;
}

function Brands() {
  const query = useGetBrands();
  return <Layout><main className="page"><div className="catalog-head"><div><div className="eyebrow">The makers</div><h1>Good people,<br />good formulas.</h1></div><p className="section-copy">Independent houses and thoughtful laboratories we are happy to put our name beside.</p></div>{query.isLoading ? <LoadingGrid /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : <div className="browse-grid" style={{ marginTop: 35 }}>{(query.data || []).map((brand: Brand) => <Link href={`/shop?brand=${brand.id}`} className="browse-card" key={brand.id} data-testid={`card-browse-brand-${brand.id}`}><div className="avatar">{initials(brand.name)}</div><h3>{brand.name}</h3><p>{brand.description}</p><span className="eyebrow">{brand.productCount} pieces <ArrowRight size={13} /></span></Link>)}</div>}</main></Layout>;
}

function ProductDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const product = useGetProduct(id, { query: { queryKey: ['/api/products', id] as const, enabled: Boolean(id) } });
  const reviews = useGetProductReviews(id, { query: { queryKey: ['/api/products', id, 'reviews'] as const, enabled: Boolean(id) } });
  const actions = useProductActions();
  const [size, setSize] = useState('');
  if (product.isLoading) return <Layout><main className="page"><div className="detail"><div className="skeleton image" /><div><div className="skeleton line" /><div className="skeleton line" /></div></div></main></Layout>;
  if (product.isError || !product.data) return <Layout><main className="page"><ErrorState retry={() => product.refetch()} /></main></Layout>;
  const item = product.data;
  return <Layout><main className="page"><div className="detail"><div className="detail-image"><img src={imageFor(item.image)} alt={item.name} /></div><div className="detail-copy"><div className="eyebrow">{item.brand} / {item.category}</div><h1>{item.name}</h1><div className="stars">{'★'.repeat(Math.min(5, Math.round(item.rating || 0)))} <small>{item.rating?.toFixed(1)} · {item.reviews} reviews</small></div><p className="detail-description">{item.description}</p><div className="detail-price">{money(item.price)} {item.compareAtPrice && <span className="price-old">{money(item.compareAtPrice)}</span>}</div>{item.sizes?.length > 0 && <><div className="eyebrow">Choose a size</div><div className="size-row">{item.sizes.map((itemSize) => <button key={itemSize} className={`size-pill ${size === itemSize ? 'selected' : ''}`} onClick={() => setSize(itemSize)} data-testid={`button-size-${itemSize}`}>{itemSize}</button>)}</div></>}<div className="hero-actions"><button className="button" onClick={() => actions.add(item)} data-testid="button-detail-add">Add to bag <ShoppingBag size={15} /></button><button className="button secondary" onClick={() => actions.save(item)} data-testid="button-detail-save"><Heart size={15} fill={actions.savedIds.has(item.id) ? 'currentColor' : 'none'} /> {actions.savedIds.has(item.id) ? 'Saved' : 'Save'}</button></div><p className="eyebrow" style={{ marginTop: 23 }}>{item.stock > 0 ? `${item.stock} in stock · Ships within 1–2 days` : 'Currently out of stock'}</p></div></div><div className="detail-sections"><section><h2>Why it belongs</h2><div className="ingredient-list">{(item.benefits || []).map((benefit) => <span className="ingredient" key={benefit}>{benefit}</span>)}</div><h2 style={{ marginTop: 43 }}>What's inside</h2><div className="ingredient-list">{(item.ingredients || []).map((ingredient) => <span className="ingredient" key={ingredient}>{ingredient}</span>)}</div></section><section><div className="section-head"><h2>Notes from the community</h2><span className="eyebrow">{item.reviews} reviews</span></div>{reviews.isLoading ? <div className="skeleton line" /> : reviews.isError ? <ErrorState retry={() => reviews.refetch()} /> : (reviews.data || []).slice(0, 4).map((review: Review) => <div className="review" key={review.id}><div className="review-top"><span>{review.author}</span><span className="stars">{'★'.repeat(review.rating)}</span></div><div className="review-title">{review.title}</div><p className="review-body">{review.body}</p></div>)}</section></div></main></Layout>;
}

function Wishlist() {
  const wishlist = useGetWishlist();
  const actions = useProductActions();
  return <Layout><main className="page"><div className="catalog-head"><div><div className="eyebrow">Your considered list</div><h1>Saved for later.</h1></div><p className="section-copy">The things that caught your eye. Keep them here until the moment feels right.</p></div>{wishlist.isLoading ? <LoadingGrid /> : wishlist.isError ? <ErrorState retry={() => wishlist.refetch()} /> : wishlist.data?.length ? <div className="product-grid" style={{ marginTop: 35 }}>{wishlist.data.map((product) => <ProductCard key={product.id} product={product} saved onSave={actions.save} onAdd={actions.add} />)}</div> : <div className="empty-state" style={{ marginTop: 35 }}><Heart size={25} /><h2>A little room for want.</h2><p>Save pieces from the edit and they will gather here.</p><Link href="/shop" className="button" data-testid="link-empty-wishlist">Explore products</Link></div>}</main></Layout>;
}

function Cart() {
  const cart = useGetCart();
  const qc = useQueryClient();
  const clear = useClearCart();
  const remove = useRemoveCartItem();
  const update = useUpdateCartItem();
  const coupon = useValidateCoupon();
  const create = useCreateOrder();
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [address, setAddress] = useState('');
  const [ordered, setOrdered] = useState<Order | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: getGetCartQueryKey() });
  if (cart.isLoading) return <Layout><main className="page"><div className="skeleton line" style={{ marginTop: 55 }} /><div className="skeleton image" style={{ maxWidth: 500, marginTop: 20 }} /></main></Layout>;
  if (cart.isError) return <Layout><main className="page"><ErrorState retry={() => cart.refetch()} /></main></Layout>;
  if (ordered) return <Layout><main className="page"><div className="empty-state" style={{ marginTop: 80 }}><div className="eyebrow">Order {ordered.id}</div><h2>Beautifully done.</h2><p>Your order is on its way to becoming part of your ritual.</p><Link href="/account" className="button" data-testid="link-order-account">View order history</Link></div></main></Layout>;
  const data = cart.data;
  return <Layout><main className="page"><div className="catalog-head"><div><div className="eyebrow">Your bag</div><h1>Take a moment.</h1></div><p className="section-copy">{data?.items?.length || 0} pieces selected · Review your ritual before you go.</p></div>{data?.items?.length ? <div className="cart-layout"><section>{data.items.map((item) => <div className="cart-item" key={item.product.id}><img className="cart-thumb" src={imageFor(item.product.image)} alt={item.product.name} /><div><div className="product-brand">{item.product.brand}</div><div className="product-name">{item.product.name}</div><div className="qty"><button onClick={() => item.quantity > 1 ? update.mutate({ productId: item.product.id, data: { quantity: item.quantity - 1 } }, { onSuccess: refresh }) : remove.mutate({ productId: item.product.id }, { onSuccess: refresh })} aria-label="Decrease quantity" data-testid={`button-decrease-${item.product.id}`}><Minus size={13} /></button><span data-testid={`text-quantity-${item.product.id}`}>{item.quantity}</span><button onClick={() => update.mutate({ productId: item.product.id, data: { quantity: item.quantity + 1 } }, { onSuccess: refresh })} aria-label="Increase quantity" data-testid={`button-increase-${item.product.id}`}><Plus size={13} /></button></div></div><div><strong>{money(item.lineTotal)}</strong><button className="icon-button" onClick={() => remove.mutate({ productId: item.product.id }, { onSuccess: refresh })} aria-label="Remove item" data-testid={`button-remove-${item.product.id}`}><X size={15} /></button></div></div>)}<button className="button secondary small" onClick={() => clear.mutate(undefined, { onSuccess: refresh })} data-testid="button-clear-cart">Clear bag</button></section><aside className="summary"><h2>Your total</h2><div className="summary-line"><span>Subtotal</span><span>{money(data.subtotal)}</span></div><div className="summary-line"><span>Shipping</span><span>{data.shipping ? money(data.shipping) : 'Complimentary'}</span></div><div className="summary-line"><span>Estimated tax</span><span>{money(data.tax)}</span></div>{Boolean(data.couponDiscount) && <div className="summary-line"><span>Coupon</span><span>−{money(data.couponDiscount)}</span></div>}<div className="coupon"><input className="input" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Coupon code" aria-label="Coupon code" data-testid="input-coupon" /><button className="button secondary small" onClick={() => coupon.mutate({ data: { code: couponCode } }, { onSuccess: (result) => setCouponMessage(result.message || (result.valid ? 'Coupon applied.' : 'That code is not valid.')) })} data-testid="button-apply-coupon">Apply</button></div>{couponMessage && <p className="eyebrow">{couponMessage}</p>}<div className="summary-line summary-total"><span>Total</span><span>{money(data.total)}</span></div><input className="input" style={{ width: '100%', margin: '12px 0' }} placeholder="Shipping address" value={address} onChange={(event) => setAddress(event.target.value)} aria-label="Shipping address" data-testid="input-shipping-address" /><button className="button wide" disabled={!address || create.isPending} onClick={() => create.mutate({ data: { items: data.items.map((item) => ({ productId: item.product.id, quantity: item.quantity })), shippingAddress: address, paymentMethod: 'card' } }, { onSuccess: (result) => { setOrdered(result); qc.invalidateQueries({ queryKey: getGetCartQueryKey() }); qc.invalidateQueries({ queryKey: getGetOrdersQueryKey() }); } })} data-testid="button-checkout">{create.isPending ? 'Placing order…' : 'Place order'}</button></aside></div> : <div className="empty-state" style={{ marginTop: 35 }}><ShoppingBag size={25} /><h2>Your bag is taking a breath.</h2><p>Nothing here yet. We have plenty of good ideas.</p><Link href="/shop" className="button" data-testid="link-empty-cart">Continue shopping</Link></div>}</main></Layout>;
}

function Account() {
  const orders = useGetOrders();
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('mybeautify-user') || 'null'); } catch { return null; } });
  return <Layout><main className="page"><div className="catalog-head"><div><div className="eyebrow">Your space</div><h1>The account<br />edit.</h1></div><p className="section-copy">Order history and a little more context for your next ritual.</p></div>{user ? <div className="account-layout"><nav className="account-nav"><a className="active" href="#profile" data-testid="link-account-profile">Profile</a><a href="#orders" data-testid="link-account-orders">Order history</a><button className="button secondary small" onClick={() => { localStorage.removeItem('mybeautify-user'); setUser(null); }} data-testid="button-sign-out">Sign out</button></nav><section><div className="profile-card" id="profile"><div><div className="eyebrow">Welcome back</div><h2 style={{ font: '32px var(--app-font-serif)', margin: '7px 0' }}>{user.name}</h2><p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{user.email}</p></div><div className="avatar">{initials(user.name)}</div></div><div id="orders" style={{ marginTop: 45 }}><div className="section-head"><h2 className="section-title" style={{ fontSize: 35 }}>Order history</h2></div>{orders.isLoading ? <div className="skeleton line" /> : orders.isError ? <ErrorState retry={() => orders.refetch()} /> : orders.data?.length ? <div>{orders.data.map((order) => <div className="order-row" key={order.id} data-testid={`row-order-${order.id}`}><span>{order.id}</span><span>{new Date(order.createdAt).toLocaleDateString()}</span><span className="status">{order.status}</span><strong>{money(order.total)}</strong></div>)}</div> : <div className="empty-state"><h2>No orders yet.</h2><p>Your considered purchases will appear here.</p><Link href="/shop" className="button small" data-testid="link-account-shop">Start shopping</Link></div>}</div></section></div> : <div className="empty-state" style={{ marginTop: 40 }}><UserRound size={25} /><h2>Your space is waiting.</h2><p>Sign in to see orders, save products, and make your next visit easier.</p><Link href="/sign-in" className="button" data-testid="link-account-sign-in">Sign in</Link></div>}</main></Layout>;
}

function Auth({ register = false }: { register?: boolean }) {
  const [, setLocation] = useLocation();
  const login = useLogin();
  const create = useRegister();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault(); setMessage('');
    const onSuccess = (result: { user: { name: string; email: string } }) => { localStorage.setItem('mybeautify-user', JSON.stringify(result.user)); setLocation('/account'); };
    if (register) create.mutate({ data: { name, email, password } }, { onSuccess, onError: () => setMessage('We could not create that account. Check your details and try again.') });
    else login.mutate({ data: { email, password } }, { onSuccess, onError: () => setMessage('That email and password did not match. Please try again.') });
  };
  return <div className="site-shell"><div className="topline">A considered beauty shop, for your considered self.</div><header className="nav"><BrandMark testId="link-auth-home" /><Link href="/shop" className="button secondary small" style={{ marginLeft: 'auto' }} data-testid="link-auth-shop">Return to shop</Link></header><main className="auth-wrap"><section className="auth-art"><div className="eyebrow">A little more you</div><h1>Make room<br />for ritual.</h1><p>Save your favorites, keep an eye on orders, and let good formulas find their way back to you.</p></section><section className="auth-form"><div className="eyebrow">{register ? 'Join the edit' : 'Welcome back'}</div><h1>{register ? 'Create your account.' : 'Sign in.'}</h1><p className="section-copy">{register ? 'A softer way to keep track of the things you love.' : 'Your saved pieces and rituals are waiting.'}</p><form onSubmit={submit}>{register && <label className="form-field"><span>Your name</span><input className="input" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} data-testid="input-name" /></label>}<label className="form-field"><span>Email address</span><input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required data-testid="input-email" /></label><label className="form-field"><span>Password</span><input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} data-testid="input-password" /></label>{message && <div className="form-message" data-testid="status-auth-error">{message}</div>}<button className="button wide" disabled={login.isPending || create.isPending} type="submit" data-testid="button-submit-auth">{login.isPending || create.isPending ? 'One moment…' : register ? 'Create account' : 'Sign in'}</button></form><p style={{ fontSize: 13, marginTop: 22 }}>{register ? 'Already have an account? ' : 'New here? '}<Link href={register ? '/sign-in' : '/register'} style={{ color: 'hsl(var(--accent))' }} data-testid="link-auth-switch">{register ? 'Sign in' : 'Create an account'}</Link></p></section></main></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/shop" component={Shop} /><Route path="/product/:id" component={ProductDetail} /><Route path="/categories" component={Categories} /><Route path="/brands" component={Brands} /><Route path="/wishlist" component={Wishlist} /><Route path="/cart" component={Cart} /><Route path="/account" component={Account} /><Route path="/sign-in" component={() => <Auth />} /><Route path="/register" component={() => <Auth register />} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

export default function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Router /><Toaster /></TooltipProvider></QueryClientProvider>;
}