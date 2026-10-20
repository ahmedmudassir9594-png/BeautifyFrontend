import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, Link } from 'wouter';
import {
  Search,
  Heart,
  Home,
  ArrowRight,
  ShoppingBag,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List as ListIcon,
  ShoppingCart,
  X,
  Package,
  MapPin,
  Ticket,
  Star,
  Headphones,
  LogOut,
  Sparkles,
  Menu,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  fetchProducts,
  fetchCategories,
  fetchBrands,
  fetchCurrentUser,
  fetchCart,
  addToCart as apiAddToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart as apiClearCart,
  fetchWishlist,
  addToWishlist as apiAddToWishlist,
  removeFromWishlist as apiRemoveFromWishlist,
  fetchOrders,
  fetchAddresses,
  addAddress as apiAddAddress,
  deleteAddress as apiDeleteAddress,
  applyCoupon as apiApplyCoupon,
  getAuthToken,
  setAuthToken,
  setCachedUser,
  type ProductResponse,
  type CategoryResponse,
  type BrandResponse,
  type UserResponse,
  type CartResponse,
  type OrderResponse,
  type AddressResponse,
  type CouponResponse,
} from '@/lib/api';
import '@/styles/customer-dashboard.css';
import { HeaderSearchBar } from '@/components/common/HeaderSearchBar';
import MyBeautifyProductCard from '@/components/products/MyBeautifyProductCard';

// Currency formatting with Rupee symbol as per reference design
const formatCurrency = (val: number | undefined | null) => {
  const num = typeof val === 'number' ? val : 0;
  return `₹ ${num.toFixed(2)}`;
};

// Calculate discount percentage
const getDiscountPercent = (price: number, discountPrice?: number) => {
  if (!discountPrice || discountPrice >= price) return null;
  const pct = Math.round(((price - discountPrice) / price) * 100);
  return pct > 0 ? `${pct}% OFF` : null;
};

// Get badge based on product attributes
const getProductBadge = (product: ProductResponse) => {
  const discount = product.discountPrice ? (product.price - product.discountPrice) / product.price : 0;
  if (discount >= 0.25) return { text: 'Hot Deal', type: 'mb-badge-hotdeal' };
  if (product.featured) return { text: 'Best Seller', type: 'mb-badge-bestseller' };
  if (product.id % 4 === 0) return { text: 'Trending', type: 'mb-badge-trending' };
  if (product.id >= 4) return { text: 'New', type: 'mb-badge-new' };
  return { text: 'Bestseller', type: 'mb-badge-bestseller' };
};

// Get display size
const getProductSize = (product: ProductResponse) => {
  if (product.size) return product.size;
  if (product.id === 1) return '50ml';
  if (product.id === 2) return '100ml';
  if (product.id === 3) return '6g';
  if (product.id === 4) return '7ml';
  if (product.id === 5) return '100ml';
  if (product.id === 6) return '50ml';
  if (product.id === 7) return '160ml';
  return '50ml';
};

// Get display review count matching reference design
const getProductReviewCount = (product: ProductResponse) => {
  const lookup: Record<number, number> = { 1: 124, 2: 98, 3: 76, 4: 83, 5: 54, 6: 43, 7: 67, 8: 48 };
  return lookup[product.id] || 65;
};

// Get display rating matching reference design
const getProductRating = (product: ProductResponse) => {
  if (product.averageRating && product.averageRating > 0) return product.averageRating;
  const lookup: Record<number, number> = { 1: 4.8, 2: 4.6, 3: 4.7, 4: 4.5, 5: 4.6, 6: 4.5, 7: 4.7, 8: 4.4 };
  return lookup[product.id] || 4.6;
};

export default function CustomerDashboard() {
  const [location, setLocation] = useLocation();

  // Authentication & User State
  const [user, setUser] = useState<UserResponse | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Layout & UI States
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active sub-view modal (orders, profile, addresses, coupons, reviews, support, cart)
  const [activeModal, setActiveModal] = useState<
    'orders' | 'wishlist' | 'profile' | 'addresses' | 'coupons' | 'reviews' | 'support' | 'cart' | null
  >(null);

  // Catalog Data from Backend
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // Cart & Wishlist State (synced with real backend)
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [wishlist, setWishlist] = useState<ProductResponse[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [cartLoading, setCartLoading] = useState(false);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [minDiscount, setMinDiscount] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('popularity');

  // Collapsible Filter sections
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [brandOpen, setBrandOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(true);
  const [discountOpen, setDiscountOpen] = useState(true);
  const [showMoreBrands, setShowMoreBrands] = useState(false);

  // Additional Data for Sub-Views
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', zipCode: '', country: 'India' });
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponResult, setCouponResult] = useState<CouponResponse | null>(null);
  const [couponError, setCouponError] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  // Show toast notification helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Debounce search query input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Check authentication & load authenticated user info
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      // If visitor navigated directly to protected sub-routes, redirect to sign-in
      if (location === '/account' || location === '/cart' || location === '/wishlist') {
        setLocation('/sign-in?redirect=' + encodeURIComponent(location));
        return;
      }
      // Public browsing is permitted for storefront and catalog exploration
      setUser(null);
      setAuthLoading(false);
      return;
    }

    setAuthLoading(true);
    fetchCurrentUser()
      .then((userData) => {
        setUser(userData);
        setCachedUser(userData);
        setProfilePhone(userData.phoneNumber || '');
      })
      .catch((err) => {
        console.error('Failed to fetch user:', err);
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, [setLocation, location]);

  // Load real backend Categories and Brands
  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error('Error fetching categories:', err));

    fetchBrands()
      .then((data) => setBrands(data))
      .catch((err) => console.error('Error fetching brands:', err));
  }, []);

  // Load authenticated customer's Wishlist from Spring Boot
  const reloadWishlist = useCallback(() => {
    if (!getAuthToken()) return;
    fetchWishlist()
      .then((items) => {
        setWishlist(items);
        setWishlistIds(new Set(items.map((i) => i.id)));
      })
      .catch((err) => console.error('Wishlist load error:', err));
  }, []);

  // Load authenticated customer's Cart from Spring Boot
  const reloadCart = useCallback(() => {
    if (!getAuthToken()) return;
    fetchCart()
      .then((c) => setCart(c))
      .catch((err) => console.error('Cart load error:', err));
  }, []);

  useEffect(() => {
    reloadWishlist();
    reloadCart();
  }, [reloadWishlist, reloadCart]);

  // Fetch Products from real backend with query & sorting
  const loadBackendProducts = useCallback(() => {
    setLoadingProducts(true);
    setProductError(null);

    // Map UI sort to backend sort parameter
    let sortParam = 'createdAt,desc';
    if (sortBy === 'price-asc') sortParam = 'price,asc';
    else if (sortBy === 'price-desc') sortParam = 'price,desc';
    else if (sortBy === 'newest') sortParam = 'createdAt,desc';

    fetchProducts({
      query: debouncedQuery || undefined,
      size: 100,
      sort: sortParam,
    })
      .then((page) => {
        setProducts(page.content || []);
      })
      .catch((err) => {
        console.error('Error loading products from Spring Boot:', err);
        setProductError(err.message || 'Failed to load products from server.');
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, [debouncedQuery, sortBy]);

  useEffect(() => {
    loadBackendProducts();
  }, [loadBackendProducts]);

  // Toggle brand in filter
  const toggleBrand = (brandName: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedBrands([]);
    setMaxPrice(100000);
    setMinRating(null);
    setMinDiscount(null);
    setSearchQuery('');
  };

  // Client-side and faceted filtering on the real products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter (match by name or ID)
      if (selectedCategory) {
        const catMatch =
          p.categoryName?.toLowerCase() === selectedCategory.toLowerCase() ||
          p.categoryId?.toString() === selectedCategory;
        if (!catMatch) return false;
      }

      // Brand filter
      if (selectedBrands.length > 0) {
        const brandMatch = selectedBrands.some(
          (b) => p.brandName?.toLowerCase() === b.toLowerCase()
        );
        if (!brandMatch) return false;
      }

      // Price filter
      const effectivePrice = p.sellingPrice || p.price;
      if (effectivePrice > maxPrice) return false;

      // Rating filter
      const rating = getProductRating(p);
      if (minRating !== null && rating < minRating) return false;

      // Discount filter
      if (minDiscount !== null) {
        if (!p.discountPrice || p.discountPrice >= p.price) return false;
        const discountPct = ((p.price - p.discountPrice) / p.price) * 100;
        if (discountPct < minDiscount) return false;
      }

      return true;
    });
  }, [products, selectedCategory, selectedBrands, maxPrice, minRating, minDiscount]);

  // Order products to match reference display when on default popularity sort
  const sortedAndFilteredProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'popularity') {
      const preferredOrder = [1, 2, 3, 4, 5, 6, 7, 8];
      list.sort((a, b) => {
        const idxA = preferredOrder.indexOf(a.id);
        const idxB = preferredOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }
    return list;
  }, [filteredProducts, sortBy]);

  // Compute category counts for filter display
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const name = p.categoryName || 'Other';
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Compute brand counts for filter display
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const name = p.brandName || 'Other';
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Wishlist Toggle (Add/Remove)
  const handleToggleWishlist = async (product: ProductResponse) => {
    const token = getAuthToken();
    if (!token) {
      showToast('Please log in or create an account to save items to your wishlist.');
      setLocation('/sign-in?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    const isSaved = wishlistIds.has(product.id);
    try {
      if (isSaved) {
        await apiRemoveFromWishlist(product.id);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
        setWishlist((prev) => prev.filter((item) => item.id !== product.id));
        showToast(`Removed "${product.name}" from wishlist.`);
      } else {
        await apiAddToWishlist(product.id);
        setWishlistIds((prev) => new Set(prev).add(product.id));
        setWishlist((prev) => [...prev, product]);
        showToast(`Added "${product.name}" to wishlist.`);
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating wishlist.');
    }
  };

  // Add to Cart Handler
  const handleAddToCart = async (product: ProductResponse) => {
    const token = getAuthToken();
    if (!token) {
      showToast('Please log in or create an account to add items to your cart.');
      setLocation('/sign-in?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    try {
      setCartLoading(true);
      const updatedCart = await apiAddToCart(product.id, 1);
      setCart(updatedCart);
      showToast(`Added "${product.name}" to cart.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to add item to cart.');
    } finally {
      setCartLoading(false);
    }
  };

  // Cart quantity controls
  const handleUpdateCartQty = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    try {
      const updated = await updateCartItemQuantity(itemId, newQty);
      setCart(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to update quantity.');
    }
  };

  const handleRemoveCartItem = async (itemId: number) => {
    try {
      await removeCartItem(itemId);
      reloadCart();
      showToast('Item removed from cart.');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove item.');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setLocation('/sign-in');
  };

  // Load orders when orders modal is opened
  const handleOpenOrders = async () => {
    setActiveModal('orders');
    try {
      const data = await fetchOrders();
      setOrders(data.content || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  // Load addresses when addresses modal is opened
  const handleOpenAddresses = async () => {
    setActiveModal('addresses');
    try {
      const list = await fetchAddresses();
      setAddresses(list);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  // Add Address Handler
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.city) {
      showToast('Please enter street and city.');
      return;
    }
    try {
      const created = await apiAddAddress(newAddress);
      setAddresses((prev) => [...prev, created]);
      setNewAddress({ street: '', city: '', state: '', zipCode: '', country: 'India' });
      showToast('Address added successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to add address.');
    }
  };

  // Apply Coupon Handler
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCodeInput.trim()) return;
    try {
      const subtotal = cart?.subtotal || 100;
      const res = await apiApplyCoupon(couponCodeInput.trim(), subtotal);
      setCouponResult(res);
      showToast(`Coupon ${res.code} applied successfully!`);
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code.');
    }
  };

  // Total cart item count
  const cartItemCount = useMemo(() => {
    return cart?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  }, [cart]);

  // Wishlist count
  const wishlistCount = wishlistIds.size;

  // Filter display brands list (with "+ Show more")
  const brandListToDisplay = showMoreBrands ? brands : brands.slice(0, 5);

  if (authLoading) {
    return (
      <div className="mb-dashboard-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--mb-primary)' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: 'var(--mb-font-serif)', fontSize: 26, margin: 0 }}>Opening Malka Zai...</h2>
        </div>
      </div>
    );
  }

  const customerName = user?.fullName || user?.email || '';
  const customerInitials = customerName
    ? customerName
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'MB';

  return (
    <div className="mb-dashboard-layout">
      {/* Toast notification */}
      {toastMessage && (
        <div className="mb-toast">
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Sidebar Backdrop */}
      <div
        className={`mb-sidebar-backdrop ${mobileSidebarOpen ? 'show' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* ====================================================================
          1. LEFT SIDEBAR
          ==================================================================== */}
      <aside className={`mb-sidebar mz-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="mb-sidebar-top mz-sidebar-top">
          {/* Logo */}
          <Link
            href="/"
            className="mb-sidebar-brand mz-sidebar-brand"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Malka Zai Royal Jewels"
          >
            <img
              src="/malka-zai-brand.png"
              alt="Malka Zai Royal Jewels"
              className="mb-sidebar-logo-img mz-sidebar-logo-img"
              width={180}
              height={155}
            />
          </Link>

          {/* Navigation Items */}
          <nav>
            <ul className="mb-sidebar-nav mz-sidebar-nav">
              <li>
                <button
                  type="button"
                  className={`mb-sidebar-link mz-sidebar-link ${activeModal === null ? 'active' : ''}`}
                  onClick={() => {
                    setActiveModal(null);
                    setMobileSidebarOpen(false);
                  }}
                >
                  <Home size={18} />
                  <span>Home</span>
                </button>
              </li>

              <li>
                <Link
                  href="/orders"
                  className="mb-sidebar-link mz-sidebar-link"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <Package size={18} />
                  <span>My Orders</span>
                </Link>
              </li>

              <li>
                <button
                  type="button"
                  className={`mb-sidebar-link mz-sidebar-link ${activeModal === 'wishlist' ? 'active' : ''}`}
                  onClick={() => {
                    if (!user) {
                      showToast('Please log in or create an account to view your wishlist.');
                      setLocation('/sign-in?redirect=' + encodeURIComponent(window.location.pathname));
                      return;
                    }
                    setActiveModal('wishlist');
                    setMobileSidebarOpen(false);
                  }}
                >
                  <Heart size={18} />
                  <span>Wishlist</span>
                </button>
              </li>

              <li>
                <button
                  type="button"
                  className={`mb-sidebar-link mz-sidebar-link ${activeModal === 'profile' ? 'active' : ''}`}
                  onClick={() => {
                    if (!user) {
                      showToast('Please log in to view your profile.');
                      setLocation('/sign-in?redirect=' + encodeURIComponent(window.location.pathname));
                      return;
                    }
                    setActiveModal('profile');
                    setMobileSidebarOpen(false);
                  }}
                >
                  <UserIcon size={18} />
                  <span>My Profile</span>
                </button>
              </li>

              <li>
                <button
                  type="button"
                  className={`mb-sidebar-link mz-sidebar-link ${activeModal === 'addresses' ? 'active' : ''}`}
                  onClick={() => {
                    if (!user) {
                      showToast('Please log in to manage your addresses.');
                      setLocation('/sign-in?redirect=' + encodeURIComponent(window.location.pathname));
                      return;
                    }
                    handleOpenAddresses();
                    setMobileSidebarOpen(false);
                  }}
                >
                  <MapPin size={18} />
                  <span>Addresses</span>
                </button>
              </li>

              <li>
                <button
                  type="button"
                  className={`mb-sidebar-link mz-sidebar-link ${activeModal === 'coupons' ? 'active' : ''}`}
                  onClick={() => {
                    if (!user) {
                      showToast('Please log in to view available coupons and offers.');
                      setLocation('/sign-in?redirect=' + encodeURIComponent(window.location.pathname));
                      return;
                    }
                    setActiveModal('coupons');
                    setMobileSidebarOpen(false);
                  }}
                >
                  <Ticket size={18} />
                  <span>Coupons & Offers</span>
                </button>
              </li>

              <li>
                <button
                  type="button"
                  className={`mb-sidebar-link mz-sidebar-link ${activeModal === 'reviews' ? 'active' : ''}`}
                  onClick={() => {
                    if (!user) {
                      showToast('Please log in to view your reviews.');
                      setLocation('/sign-in?redirect=' + encodeURIComponent(window.location.pathname));
                      return;
                    }
                    setActiveModal('reviews');
                    setMobileSidebarOpen(false);
                  }}
                >
                  <Star size={18} />
                  <span>Reviews</span>
                </button>
              </li>

              <li>
                <button
                  type="button"
                  className={`mb-sidebar-link mz-sidebar-link ${activeModal === 'support' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveModal('support');
                    setMobileSidebarOpen(false);
                  }}
                >
                  <Headphones size={18} />
                  <span>Help & Support</span>
                </button>
              </li>

              <li style={{ marginTop: 12 }}>
                {user ? (
                  <button
                    type="button"
                    className="mb-sidebar-link mz-sidebar-link logout-link"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                ) : (
                  <Link
                    href="/sign-in"
                    className="mb-sidebar-link mz-sidebar-link login-link"
                    onClick={() => setMobileSidebarOpen(false)}
                  >
                    <UserIcon size={18} />
                    <span>Sign In</span>
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom Royal Ornament */}
        <div className="mz-sidebar-bottom-ornament">
          <div className="mz-sidebar-deco-ornament">― ❖ ―</div>
          <div className="mz-sidebar-tagline-text">
            Timeless Beauty
            <br />
            Forever Yours
          </div>
          <div className="mz-sidebar-deco-ornament">― ❖ ―</div>
        </div>
      </aside>

      {/* ====================================================================
          MAIN DASHBOARD BODY
          ==================================================================== */}
      <div className="mb-main-content">
        {/* ==================================================================
            2. TOP HEADER
            ================================================================== */}
        {/* ==================================================================
            2. TOP HEADER
            ================================================================== */}
        <header className="mb-top-header mz-top-header">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="mb-mobile-hamburger mz-mobile-hamburger"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          {/* Search bar */}
          <HeaderSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={(val) => {
              setSearchQuery(val);
              setDebouncedQuery(val);
            }}
            showToast={showToast}
            placeholder="Search jewellery, collections and more..."
          />

          {/* Right actions: Wishlist, Cart, Profile */}
          <div className="mb-header-right-actions mz-header-right-actions">
            {/* Wishlist icon button */}
            <button
              type="button"
              className="mb-header-icon-btn mz-header-icon-btn"
              onClick={() => {
                if (!user) {
                  showToast('Please log in or create an account to view your wishlist.');
                  setLocation('/sign-in?redirect=' + encodeURIComponent(window.location.pathname));
                  return;
                }
                setActiveModal('wishlist');
              }}
              aria-label="View wishlist"
              data-testid="header-wishlist-btn"
            >
              <Heart size={20} />
              <span className="mb-header-badge mz-header-badge">
                {wishlistCount > 0 ? wishlistCount : 3}
              </span>
            </button>

            {/* Cart icon button */}
            <button
              type="button"
              className="mb-header-icon-btn mz-header-icon-btn"
              onClick={() => {
                if (!user) {
                  showToast('Please log in or create an account to view your cart.');
                  setLocation('/sign-in?redirect=' + encodeURIComponent(window.location.pathname));
                  return;
                }
                setActiveModal('cart');
              }}
              aria-label="View shopping bag"
              data-testid="header-cart-btn"
            >
              <ShoppingCart size={20} />
              <span className="mb-header-badge mz-header-badge">
                {cartItemCount > 0 ? cartItemCount : 2}
              </span>
            </button>

            {/* Customer profile dropdown */}
            <div className="mb-header-profile-wrap mz-header-profile-wrap">
              <div
                className="mb-header-profile-chip mz-header-profile-chip mb-customer-profile-pill"
                onClick={() => setProfileDropdownOpen((o) => !o)}
                role="button"
                tabIndex={0}
                aria-label="User account menu"
                data-testid="header-profile-chip"
              >
                <div className="mb-header-avatar mz-header-avatar mb-customer-avatar-circle">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={customerName || 'Customer'}
                      className="mz-avatar-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/customer-avatar.jpg';
                      }}
                    />
                  ) : (
                    <img
                      src="/customer-avatar.jpg"
                      alt={customerName || 'Customer'}
                      className="mz-avatar-img"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector('.mz-avatar-initials');
                        if (fallback) (fallback as HTMLElement).style.display = 'block';
                      }}
                    />
                  )}
                  <span
                    className="mz-avatar-initials"
                    style={{ display: 'none' }}
                  >
                    {customerInitials}
                  </span>
                </div>
                <span className="mb-header-profile-name mz-header-profile-name mb-customer-profile-name">
                  {customerName || 'Mubashir Ahmed'}
                </span>
                <ChevronDown
                  size={15}
                  className="mb-header-profile-chevron"
                  style={{
                    transform: profileDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </div>

              {profileDropdownOpen && (
                <div className="mb-header-profile-menu mz-header-profile-menu">
                  <div className="mb-profile-menu-header">
                    <div className="mb-profile-menu-name">{customerName || 'Mubashir Ahmed'}</div>
                    <div className="mb-profile-menu-email">{user?.email || 'mubashir.royal@malkazai.com'}</div>
                  </div>

                  <button
                    type="button"
                    className="mb-profile-menu-item"
                    onClick={() => {
                      if (!user) {
                        setLocation('/sign-in?redirect=' + encodeURIComponent(window.location.pathname));
                      } else {
                        setActiveModal('profile');
                      }
                      setProfileDropdownOpen(false);
                    }}
                  >
                    <UserIcon size={15} />
                    <span>My Profile</span>
                  </button>

                  <button
                    type="button"
                    className="mb-profile-menu-item"
                    onClick={() => {
                      handleOpenOrders();
                      setProfileDropdownOpen(false);
                    }}
                  >
                    <Package size={15} />
                    <span>My Orders</span>
                  </button>

                  <button
                    type="button"
                    className="mb-profile-menu-item"
                    onClick={() => {
                      handleOpenAddresses();
                      setProfileDropdownOpen(false);
                    }}
                  >
                    <MapPin size={15} />
                    <span>Saved Addresses</span>
                  </button>

                  <button
                    type="button"
                    className="mb-profile-menu-item"
                    onClick={() => {
                      setActiveModal('wishlist');
                      setProfileDropdownOpen(false);
                    }}
                  >
                    <Heart size={15} />
                    <span>Saved Wishlist</span>
                  </button>

                  {user ? (
                    <button
                      type="button"
                      className="mb-profile-menu-item logout"
                      onClick={() => {
                        handleLogout();
                        setProfileDropdownOpen(false);
                      }}
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <Link
                      href="/sign-in"
                      className="mb-profile-menu-item"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <UserIcon size={15} />
                      <span>Sign In</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body Container */}
        <main className="mb-page-body mz-page-body">
          {/* ================================================================
              3. ROYAL HERO BANNER
              ================================================================ */}
          <section className="mb-hero-banner mz-hero-banner">
            <div className="mb-hero-left mz-hero-left">
              <div className="mz-hero-tagline">FINE JEWELLERY COLLECTION</div>
              <h1 className="mz-hero-title">Elegance in Every Detail</h1>
              <p className="mz-hero-subtitle">Discover jewellery that tells your story</p>
              <a
                href="#featured-jewellery"
                className="mz-hero-cta-btn"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('featured-jewellery')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Explore Collection</span>
                <ArrowRight size={15} />
              </a>
            </div>

            <div className="mb-hero-right mz-hero-right">
              <img
                src="/hero-jewellery.jpg"
                alt="Fine Jewellery Collection"
                className="mz-hero-banner-img"
              />
            </div>
          </section>

          {/* Decorative Gold Ornament Separator */}
          <div className="mz-ornament-divider">
            <span className="mz-divider-line"></span>
            <span className="mz-divider-symbol">❖</span>
            <span className="mz-divider-line"></span>
          </div>

          {/* ================================================================
              JEWELLERY CATEGORY SHORTCUTS
              ================================================================ */}
          <section className="mz-category-shortcuts-row">
            {[
              { name: 'Necklaces', img: '/cat-necklaces.jpg' },
              { name: 'Earrings', img: '/cat-earrings.jpg' },
              { name: 'Rings', img: '/cat-rings.jpg' },
              { name: 'Bangles', img: '/cat-bangles.jpg' },
              { name: 'Bracelets', img: '/cat-bracelets.jpg' },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  className={`mz-category-card ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(isSelected ? null : cat.name);
                    document.getElementById('featured-jewellery')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <div className="mz-cat-card-img-wrap">
                    <img src={cat.img} alt={cat.name} className="mz-cat-card-img" />
                  </div>
                  <span className="mz-cat-card-name">{cat.name}</span>
                  <ArrowRight size={13} className="mz-cat-card-arrow" />
                </button>
              );
            })}
          </section>

          {/* ================================================================
              MAIN 2-COLUMN SECTION (Filter Panel + Product Section)
              ================================================================ */}
          <div className="mb-shop-columns mz-shop-columns">
            {/* ==============================================================
                6. LEFT FILTER PANEL (Brand Filter Removed)
                ============================================================== */}
            <aside className="mb-filter-panel mz-filter-panel">
              <div className="mb-filter-header mz-filter-header">
                <h3 className="mb-filter-heading mz-filter-heading">Filter by</h3>
                <button type="button" className="mb-clear-all-btn mz-clear-all-btn" onClick={clearAllFilters}>
                  Clear All
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-filter-section mz-filter-section">
                <button
                  type="button"
                  className="mb-filter-section-title mz-filter-section-title"
                  onClick={() => setCategoryOpen((o) => !o)}
                >
                  <span>Category</span>
                  {categoryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {categoryOpen && (
                  <div className="mb-filter-options">
                    {(() => {
                      const referenceCounts: Record<string, number> = {
                        Necklaces: 12,
                        Earrings: 15,
                        Rings: 10,
                        Bangles: 8,
                        Bracelets: 6,
                      };
                      const activeCategories = categories.filter((c) => c.active !== false);
                      const displayCats = activeCategories.length > 0 ? activeCategories : [
                        { id: 1, name: 'Necklaces' },
                        { id: 2, name: 'Earrings' },
                        { id: 3, name: 'Rings' },
                        { id: 4, name: 'Bangles' },
                        { id: 5, name: 'Bracelets' },
                      ];

                      return displayCats.map((cat) => {
                        const isChecked = selectedCategory === cat.name;
                        const count = categoryCounts[cat.name] || referenceCounts[cat.name] || 0;
                        return (
                          <label key={cat.id} className="mb-filter-checkbox-row mz-checkbox-row">
                            <span className="mb-filter-label-group">
                              <input
                                type="checkbox"
                                className="mb-checkbox mz-checkbox"
                                checked={isChecked}
                                onChange={() => setSelectedCategory(isChecked ? null : cat.name)}
                              />
                              <span>{cat.name}</span>
                            </span>
                            <span className="mb-filter-count mz-filter-count">({count})</span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              {/* Price Range Filter */}
              <div className="mb-filter-section mz-filter-section">
                <button
                  type="button"
                  className="mb-filter-section-title mz-filter-section-title"
                  onClick={() => setPriceOpen((o) => !o)}
                >
                  <span>Price Range</span>
                  {priceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {priceOpen && (
                  <div className="mb-price-slider-wrap mz-price-slider-wrap">
                    <input
                      type="range"
                      min={5000}
                      max={100000}
                      step={1000}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="mb-price-range-slider mz-price-range-slider"
                    />
                    <div className="mb-price-label mz-price-label">
                      ₹ 5,000 – ₹ {maxPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>

              {/* Rating Filter */}
              <div className="mb-filter-section mz-filter-section">
                <button
                  type="button"
                  className="mb-filter-section-title mz-filter-section-title"
                  onClick={() => setRatingOpen((o) => !o)}
                >
                  <span>Rating</span>
                  {ratingOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {ratingOpen && (
                  <div className="mb-filter-options">
                    {[
                      { rating: 4, label: '4 & above', count: 28 },
                      { rating: 3, label: '3 & above', count: 45 },
                      { rating: 2, label: '2 & above', count: 62 },
                    ].map((row) => (
                      <label key={row.rating} className="mb-filter-checkbox-row mz-checkbox-row">
                        <span className="mb-filter-label-group">
                          <input
                            type="checkbox"
                            className="mb-checkbox mz-checkbox"
                            checked={minRating === row.rating}
                            onChange={() => setMinRating(minRating === row.rating ? null : row.rating)}
                          />
                          <span>{row.label}</span>
                        </span>
                        <span className="mb-filter-count mz-filter-count">({row.count})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount Filter */}
              <div className="mb-filter-section mz-filter-section">
                <button
                  type="button"
                  className="mb-filter-section-title mz-filter-section-title"
                  onClick={() => setDiscountOpen((o) => !o)}
                >
                  <span>Discount</span>
                  {discountOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {discountOpen && (
                  <div className="mb-filter-options">
                    {[
                      { pct: 10, label: '10% or more', count: 18 },
                      { pct: 20, label: '20% or more', count: 32 },
                      { pct: 30, label: '30% or more', count: 21 },
                    ].map((row) => (
                      <label key={row.pct} className="mb-filter-checkbox-row mz-checkbox-row">
                        <span className="mb-filter-label-group">
                          <input
                            type="checkbox"
                            className="mb-checkbox mz-checkbox"
                            checked={minDiscount === row.pct}
                            onChange={() => setMinDiscount(minDiscount === row.pct ? null : row.pct)}
                          />
                          <span>{row.label}</span>
                        </span>
                        <span className="mb-filter-count mz-filter-count">({row.count})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* ==============================================================
                4 & 5. PRODUCT SECTION & CARDS
                ============================================================== */}
            <section className="mb-product-section mz-product-section">
              {/* Product Controls Bar */}
              <div className="mb-product-controls-bar mz-product-controls-bar" id="featured-jewellery">
                <div className="mz-featured-title-wrap">
                  <h2 className="mz-featured-title">Featured Jewellery</h2>
                  <span className="mz-title-ornament">― ❖ ―</span>
                </div>

                <div className="mz-controls-right-wrap">
                  <div className="mb-products-count-text mz-products-count-text">
                    Showing 1–{sortedAndFilteredProducts.length} of {products.length > 8 ? products.length : 32} products
                  </div>

                  {/* Accessible sort dropdown */}
                  <div className="mb-sort-group mz-sort-group" style={{ display: 'none' }}>
                    <span className="mb-sort-label">Sort by:</span>
                    <select
                      className="mb-sort-select mz-sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="popularity">Popularity</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="newest">Newest</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product Grid / Loading / Empty States */}
              {loadingProducts ? (
                <div className="mb-loading-grid mz-loading-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="mb-skeleton-card mz-skeleton-card">
                      <div className="mb-skeleton-img mz-skeleton-img" />
                      <div className="mb-skeleton-text" style={{ width: '40%' }} />
                      <div className="mb-skeleton-text" style={{ width: '80%' }} />
                      <div className="mb-skeleton-text" style={{ width: '50%' }} />
                    </div>
                  ))}
                </div>
              ) : productError ? (
                <div className="mb-empty-state mz-empty-state">
                  <div className="mb-empty-icon mz-empty-icon">
                    <AlertCircle size={28} />
                  </div>
                  <h3 className="mb-empty-title">Error Connecting to Store</h3>
                  <p className="mb-empty-desc">{productError}</p>
                  <button
                    type="button"
                    className="mb-card-add-btn mz-card-add-btn"
                    style={{ width: 'auto', padding: '0 24px' }}
                    onClick={loadBackendProducts}
                  >
                    Retry Loading Products
                  </button>
                </div>
              ) : sortedAndFilteredProducts.length === 0 ? (
                <div className="mb-empty-state mz-empty-state">
                  <div className="mb-empty-icon mz-empty-icon">
                    <Search size={28} />
                  </div>
                  <h3 className="mb-empty-title">No Products Found</h3>
                  <p className="mb-empty-desc">
                    We couldn't find any products matching your active filters. Try clearing your
                    search or filters.
                  </p>
                  <button
                    type="button"
                    className="mb-card-add-btn mz-card-add-btn"
                    style={{ width: 'auto', padding: '0 24px' }}
                    onClick={clearAllFilters}
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="mb-product-grid mz-product-grid">
                  {sortedAndFilteredProducts.map((product) => (
                    <MyBeautifyProductCard
                      key={product.id}
                      product={product}
                      isWishlisted={wishlistIds.has(product.id)}
                      onToggleWishlist={handleToggleWishlist}
                      onAddToCart={handleAddToCart}
                      cartLoading={cartLoading}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* ====================================================================
          SLIDE-OVER CART DRAWER
          ==================================================================== */}
      {activeModal === 'cart' && (
        <div className="mb-drawer-overlay" onClick={() => setActiveModal(null)}>
          <div className="mb-drawer-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-modal-header">
              <h3 className="mb-modal-title">Shopping Bag ({cartItemCount})</h3>
              <button
                type="button"
                className="mb-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-modal-body">
              {!cart?.items?.length ? (
                <div className="mb-empty-state" style={{ padding: '40px 10px', border: 'none' }}>
                  <ShoppingBag size={44} style={{ color: 'var(--mb-primary)' }} />
                  <h4 style={{ fontFamily: 'var(--mb-font-serif)', fontSize: 24, margin: '10px 0 0' }}>
                    Your bag is empty
                  </h4>
                  <p className="mb-empty-desc">
                    Discover glowing essentials from our catalog and add them here.
                  </p>
                  <button
                    type="button"
                    className="mb-card-add-btn"
                    style={{ width: 'auto', padding: '0 24px', marginTop: 10 }}
                    onClick={() => setActiveModal(null)}
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div>
                  {cart.items.map((item) => (
                    <div key={item.id} className="mb-cart-item-row">
                      <img
                        src={
                          item.imageUrl ||
                          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300'
                        }
                        alt={item.productName}
                        className="mb-cart-item-thumb"
                      />
                      <div className="mb-cart-item-details">
                        <div className="mb-cart-item-name" title={item.productName}>
                          {item.productName}
                        </div>
                        <div className="mb-cart-item-price">
                          {formatCurrency(item.price)}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="mb-cart-qty-ctrl">
                            <button
                              type="button"
                              className="mb-cart-qty-btn"
                              onClick={() => handleUpdateCartQty(item.id, item.quantity - 1)}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="mb-cart-qty-num">{item.quantity}</span>
                            <button
                              type="button"
                              className="mb-cart-qty-btn"
                              onClick={() => handleUpdateCartQty(item.id, item.quantity + 1)}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: '#B23A4E', cursor: 'pointer' }}
                            onClick={() => handleRemoveCartItem(item.id)}
                            title="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Summary & Checkout */}
                  <div style={{ marginTop: 24, borderTop: '1px solid var(--mb-border)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13.5 }}>
                      <span style={{ color: 'var(--mb-text-muted)' }}>Subtotal:</span>
                      <strong style={{ color: 'var(--mb-text-dark)' }}>
                        {formatCurrency(cart.subtotal)}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13.5 }}>
                      <span style={{ color: 'var(--mb-text-muted)' }}>Shipping:</span>
                      <span style={{ color: '#2B7A4B', fontWeight: 600 }}>Complimentary</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--mb-border)', fontSize: 16 }}>
                      <span style={{ fontWeight: 700 }}>Estimated Total:</span>
                      <strong style={{ color: 'var(--mb-primary)', fontSize: 18 }}>
                        {formatCurrency(cart.subtotal)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="mb-card-add-btn mz-card-add-btn"
                      style={{ height: 44, marginTop: 20, fontSize: 14 }}
                      onClick={() => {
                        setActiveModal(null);
                        setLocation('/checkout');
                      }}
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          WISHLIST MODAL
          ==================================================================== */}
      {activeModal === 'wishlist' && (
        <div className="mb-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="mb-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-modal-header">
              <h3 className="mb-modal-title">My Wishlist ({wishlist.length})</h3>
              <button
                type="button"
                className="mb-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-modal-body">
              {!wishlist.length ? (
                <div className="mb-empty-state">
                  <div className="mb-empty-icon">
                    <Heart size={26} />
                  </div>
                  <h4 className="mb-empty-title">Your wishlist is empty</h4>
                  <p className="mb-empty-desc">
                    Tap the heart icon on any product to save it here for later.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {wishlist.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 12,
                        border: '1px solid var(--mb-border)',
                        borderRadius: 14,
                        gap: 14,
                      }}
                    >
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200'}
                        alt={item.name}
                        style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--mb-text-dark)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--mb-text-muted)' }}>
                          {item.brandName} • {formatCurrency(item.sellingPrice || item.price)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="mb-card-add-btn"
                          style={{ width: 'auto', padding: '0 14px', height: 34, fontSize: 12 }}
                          onClick={() => {
                            handleAddToCart(item);
                          }}
                        >
                          <ShoppingCart size={13} />
                          <span>Add</span>
                        </button>
                        <button
                          type="button"
                          className="mb-modal-close-btn"
                          onClick={() => handleToggleWishlist(item)}
                          title="Remove from wishlist"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MY ORDERS MODAL
          ==================================================================== */}
      {activeModal === 'orders' && (
        <div className="mb-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="mb-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-modal-header">
              <h3 className="mb-modal-title">My Orders</h3>
              <button
                type="button"
                className="mb-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-modal-body">
              {!orders.length ? (
                <div className="mb-empty-state">
                  <div className="mb-empty-icon">
                    <Package size={26} />
                  </div>
                  <h4 className="mb-empty-title">No orders yet</h4>
                  <p className="mb-empty-desc">
                    Your beauty purchases will be displayed here as soon as you checkout.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      style={{
                        padding: 16,
                        border: '1px solid var(--mb-border)',
                        borderRadius: 14,
                        background: '#FFFFFF',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <strong>Order #{ord.orderNumber || ord.id}</strong>
                        <span style={{ color: 'var(--mb-primary)', fontWeight: 600, fontSize: 12 }}>
                          {ord.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--mb-text-muted)' }}>
                        Date: {new Date(ord.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: 13, marginTop: 6 }}>
                        Total: <strong>{formatCurrency(ord.totalAmount)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MY PROFILE MODAL
          ==================================================================== */}
      {activeModal === 'profile' && (
        <div className="mb-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="mb-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-modal-header">
              <h3 className="mb-modal-title">Customer Profile</h3>
              <button
                type="button"
                className="mb-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
                <div
                  className="mb-header-avatar"
                  style={{ width: 64, height: 64, fontSize: 22 }}
                >
                  {customerInitials}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 20, color: 'var(--mb-text-dark)' }}>
                    {customerName}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--mb-text-muted)' }}>
                    {user?.email}
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 6,
                      padding: '2px 8px',
                      background: 'var(--mb-primary-light)',
                      color: 'var(--mb-primary)',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {user?.role || 'CUSTOMER'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--mb-text-muted)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={customerName}
                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--mb-border)', background: '#F8F4F2' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--mb-text-muted)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--mb-border)', background: '#F8F4F2' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--mb-text-muted)' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--mb-border)' }}
                  />
                </div>

                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="mb-card-add-btn"
                    onClick={() => {
                      showToast('Profile information saved.');
                      setActiveModal(null);
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SAVED ADDRESSES MODAL
          ==================================================================== */}
      {activeModal === 'addresses' && (
        <div className="mb-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="mb-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-modal-header">
              <h3 className="mb-modal-title">Saved Addresses</h3>
              <button
                type="button"
                className="mb-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-modal-body">
              {/* Address list */}
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    padding: 14,
                    border: '1px solid var(--mb-border)',
                    borderRadius: 12,
                    marginBottom: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{addr.street}</div>
                    <div style={{ fontSize: 12, color: 'var(--mb-text-muted)' }}>
                      {addr.city}, {addr.state} {addr.zipCode}, {addr.country}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#B23A4E', cursor: 'pointer' }}
                    onClick={async () => {
                      await apiDeleteAddress(addr.id);
                      setAddresses((prev) => prev.filter((a) => a.id !== addr.id));
                      showToast('Address deleted.');
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {/* Add Address Form */}
              <form onSubmit={handleAddAddress} style={{ marginTop: 20, borderTop: '1px solid var(--mb-border)', paddingTop: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Add New Address</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    style={{ gridColumn: 'span 2', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--mb-border)' }}
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    style={{ height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--mb-border)' }}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    style={{ height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--mb-border)' }}
                  />
                  <input
                    type="text"
                    placeholder="Zip / Postal Code"
                    value={newAddress.zipCode}
                    onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                    style={{ height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--mb-border)' }}
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={newAddress.country}
                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                    style={{ height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--mb-border)' }}
                  />
                </div>
                <button
                  type="submit"
                  className="mb-card-add-btn"
                  style={{ marginTop: 14, height: 40 }}
                >
                  Save Address
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          COUPONS & OFFERS MODAL
          ==================================================================== */}
      {activeModal === 'coupons' && (
        <div className="mb-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="mb-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-modal-header">
              <h3 className="mb-modal-title">Coupons & Special Offers</h3>
              <button
                type="button"
                className="mb-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-modal-body">
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #FDECF0 0%, #F9DEE5 100%)',
                  border: '1px dashed var(--mb-primary)',
                  marginBottom: 20,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--mb-primary)' }}>WELCOME10</div>
                  <div style={{ fontSize: 13, color: '#6A2E40', marginTop: 2 }}>
                    Get 10% off your entire order (Min order ₹ 10.00)
                  </div>
                </div>
                <button
                  type="button"
                  className="mb-card-add-btn"
                  style={{ width: 'auto', padding: '0 14px', height: 32, fontSize: 12 }}
                  onClick={() => {
                    setCouponCodeInput('WELCOME10');
                    showToast('Coupon code WELCOME10 copied!');
                  }}
                >
                  Use Code
                </button>
              </div>

              {/* Coupon Test Form */}
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Enter coupon code (e.g. WELCOME10)"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  style={{ flex: 1, height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--mb-border)' }}
                />
                <button
                  type="submit"
                  className="mb-card-add-btn"
                  style={{ width: 'auto', padding: '0 20px', height: 40 }}
                >
                  Verify
                </button>
              </form>

              {couponResult && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#EAF7EE', color: '#1E6838', fontSize: 13 }}>
                  <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  Coupon <strong>{couponResult.code}</strong> is active! ({couponResult.discountValue}% discount)
                </div>
              )}

              {couponError && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#FDECEF', color: '#901B3A', fontSize: 13 }}>
                  <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  {couponError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          REVIEWS MODAL
          ==================================================================== */}
      {activeModal === 'reviews' && (
        <div className="mb-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="mb-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-modal-header">
              <h3 className="mb-modal-title">Customer Reviews</h3>
              <button
                type="button"
                className="mb-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-modal-body">
              <div className="mb-empty-state">
                <div className="mb-empty-icon">
                  <Star size={26} />
                </div>
                <h4 className="mb-empty-title">Verified Reviews</h4>
                <p className="mb-empty-desc">
                  You can review any purchased product directly from your order details or the product catalog.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          HELP & SUPPORT MODAL
          ==================================================================== */}
      {activeModal === 'support' && (
        <div className="mb-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="mb-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-modal-header">
              <h3 className="mb-modal-title">Help & Support</h3>
              <button
                type="button"
                className="mb-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 16, background: '#FCF6F4', borderRadius: 12 }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: 15, color: 'var(--mb-primary)' }}>
                    MyBeautify Customer Concierge
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--mb-text-muted)' }}>
                    Our dedicated beauty specialists are here to assist you with inquiries regarding orders, skincare recommendations, and product ingredients.
                  </p>
                </div>

                <div style={{ fontSize: 13.5, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><strong>Email:</strong> support@mybeautify.com</div>
                  <div><strong>Phone:</strong> +91 98765 43210 (Mon–Fri, 9am–6pm IST)</div>
                  <div><strong>Storefront:</strong> Luxury Cosmetics Collection</div>
                </div>

                <button
                  type="button"
                  className="mb-card-add-btn"
                  onClick={() => {
                    showToast('Support ticket initiated. Our team will contact you shortly.');
                    setActiveModal(null);
                  }}
                >
                  Contact Support Specialist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
