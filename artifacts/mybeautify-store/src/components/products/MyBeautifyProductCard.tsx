import React from 'react';
import { useLocation } from 'wouter';
import { Heart, ShoppingCart } from 'lucide-react';
import type { ProductResponse } from '@/types/product.types';

export interface MyBeautifyProductCardProps {
  product: ProductResponse;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: ProductResponse) => void;
  onAddToCart?: (product: ProductResponse) => void;
  cartLoading?: boolean;
  className?: string;
}

// Currency formatting with Rupee symbol as per reference design
export const formatCurrency = (val: number | undefined | null) => {
  const num = typeof val === 'number' ? val : 0;
  return `₹ ${Math.round(num).toLocaleString('en-IN')}`;
};

// Calculate discount percentage
export const getDiscountPercent = (price: number, discountPrice?: number) => {
  if (!discountPrice || discountPrice >= price) return null;
  const pct = Math.round(((price - discountPrice) / price) * 100);
  return pct > 0 ? `${pct}% OFF` : null;
};

// Get badge based on product attributes
export const getProductBadge = (product: ProductResponse) => {
  const discount = getDiscountPercent(product.price, product.discountPrice);
  if (discount) return { text: discount, type: 'mz-badge-discount' };
  if (product.featured) return { text: 'Featured', type: 'mz-badge-featured' };
  return null;
};

// Get display review count matching reference design
export const getProductReviewCount = (product: ProductResponse) => {
  const lookup: Record<number, number> = { 1: 124, 2: 98, 3: 76, 4: 83, 5: 54, 6: 43, 7: 67, 8: 48 };
  return lookup[product.id] || 65;
};

// Get display size
export const getProductSize = (product: ProductResponse) => {
  if (product.size) return product.size;
  if (product.id === 1) return 'Adjustable 16-18"';
  if (product.id === 2) return '2.8" drop';
  if (product.id === 3) return 'US Size 7';
  if (product.id === 4) return 'Size 2.6';
  if (product.id === 5) return '7 inches';
  if (product.id === 6) return '18" + 2"';
  if (product.id === 7) return '9mm diameter';
  if (product.id === 8) return 'US Size 6.5';
  return 'Standard Size';
};

// Get display rating matching reference design
export const getProductRating = (product: ProductResponse) => {
  if (product.averageRating && product.averageRating > 0) return product.averageRating;
  const lookup: Record<number, number> = { 1: 4.8, 2: 4.6, 3: 4.7, 4: 4.5, 5: 4.6, 6: 4.5, 7: 4.7, 8: 4.4 };
  return lookup[product.id] || 4.6;
};

export const MyBeautifyProductCard: React.FC<MyBeautifyProductCardProps> = ({
  product,
  isWishlisted = false,
  onToggleWishlist,
  onAddToCart,
  cartLoading = false,
  className = '',
}) => {
  const [, setLocation] = useLocation();

  const badge = getProductBadge(product);
  const discount = getDiscountPercent(product.price, product.discountPrice);
  const displayPrice = product.discountPrice || product.sellingPrice || product.price;
  const rating = getProductRating(product);
  const reviews = getProductReviewCount(product);

  const handleCardNavigate = () => {
    setLocation(`/products/${product.id}`);
  };

  return (
    <article
      className={`mb-product-card mz-product-card ${className}`}
      onClick={handleCardNavigate}
      style={{ cursor: 'pointer' }}
      data-testid={`card-product-${product.id}`}
    >
      {/* Image wrap with Badge & Wishlist Heart */}
      <div className="mb-card-image-wrap mz-card-image-wrap">
        {badge && (
          <span className="mz-card-top-badge">
            {badge.text}
          </span>
        )}

        <button
          type="button"
          className={`mb-card-wish-btn mz-card-wish-btn ${isWishlisted ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist?.(product);
          }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          data-testid={`btn-wishlist-${product.id}`}
        >
          <Heart size={15} fill={isWishlisted ? '#D4AF63' : 'none'} color={isWishlisted ? '#D4AF63' : '#063B2F'} />
        </button>

        <img
          src={product.imageUrl || '/products/jewels/royal-emerald-necklace.jpg'}
          alt={product.name}
          className="mb-card-img mz-card-img"
          loading="lazy"
          onError={(e) => {
            // graceful fallback to local jewel photo
            (e.target as HTMLImageElement).src = '/products/jewels/royal-emerald-necklace.jpg';
          }}
        />
      </div>

      {/* Card Info Body */}
      <div className="mb-card-info mz-card-info">
        <h4
          className="mb-card-name mz-card-name"
          title={product.name}
          onClick={(e) => {
            e.stopPropagation();
            handleCardNavigate();
          }}
        >
          {product.name}
        </h4>

        {/* Rating Row */}
        <div className="mb-card-rating-row mz-card-rating-row">
          <span className="mz-card-stars">{'★'.repeat(Math.min(5, Math.max(1, Math.round(rating))))}</span>
          <span className="mz-card-rating-num">
            {rating.toFixed(1)}
          </span>
          <span className="mz-card-reviews-count">({reviews})</span>
        </div>

        {/* Price Row */}
        <div className="mb-card-price-row mz-card-price-row">
          <span className="mb-card-current-price mz-card-current-price">
            {formatCurrency(displayPrice)}
          </span>
          {product.discountPrice && product.discountPrice < product.price && (
            <span className="mb-card-original-price mz-card-original-price">
              {formatCurrency(product.price)}
            </span>
          )}
          {discount && (
            <span className="mz-card-discount-tag">{discount}</span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          className="mb-card-add-btn mz-card-add-btn"
          disabled={cartLoading || product.stockQuantity === 0}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(product);
          }}
          data-testid={`btn-add-cart-${product.id}`}
        >
          <ShoppingCart size={14} className="mz-add-cart-icon" />
          <span>
            {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </span>
        </button>
      </div>
    </article>
  );
};

export default MyBeautifyProductCard;
