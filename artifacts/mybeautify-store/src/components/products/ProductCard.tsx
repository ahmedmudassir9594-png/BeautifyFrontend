import { Heart, Loader2, ShoppingCart } from 'lucide-react';
import { Link } from 'wouter';
import type { Product } from '@workspace/api-client-react';
import { imageFor } from '@/utils/image';
import { money } from '@/utils/format';
import { animateProductToCart } from '@/lib/cart-animations';

export interface ProductCardProps {
  product: Product;
  saved?: boolean;
  adding?: boolean;
  onSave?: (product: Product) => void;
  onAdd?: (product: Product) => void;
}

export function ProductCard({
  product,
  saved = false,
  adding = false,
  onSave,
  onAdd,
}: ProductCardProps) {
  return (
    <article className="product-card" data-testid={`card-product-${product.id}`}>
      <div className="product-image">
        {product.badge && <span className="badge">{product.badge}</span>}
        {onSave && (
          <button
            className="heart-button"
            onClick={() => onSave(product)}
            aria-label={saved ? 'Remove from saved items' : 'Save product'}
            data-testid={`button-save-${product.id}`}
          >
            <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>
        )}
        <Link href={`/product/${product.id}`} data-testid={`link-product-${product.id}`}>
          <img src={imageFor(product.image)} alt={product.name} />
        </Link>
        {onAdd && (
          <button
            type="button"
            className="button product-card-add"
            onClick={(event) => {
              event.stopPropagation();
              animateProductToCart(event.currentTarget);
              onAdd(product);
            }}
            disabled={adding || product.stock === 0}
            aria-label={product.stock === 0 ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
            title={product.stock === 0 ? 'Out of stock' : 'Add to cart'}
            data-testid={`button-add-${product.id}`}
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
          </button>
        )}
        {onAdd && (
          <div className="product-overlay">
            <Link
              href={`/product/${product.id}`}
              className="button small secondary"
              data-testid={`link-view-${product.id}`}
            >
              View
            </Link>
          </div>
        )}
      </div>
      <div className="product-info">
        <div className="product-brand">{product.brand}</div>
        <Link
          href={`/product/${product.id}`}
          className="product-name"
          data-testid={`text-product-name-${product.id}`}
        >
          {product.name}
        </Link>
        <div className="product-meta">
          <span className="stars">
            {'★'.repeat(Math.min(5, Math.round(product.rating || 0)))}{' '}
            <small>({product.reviews || 0})</small>
          </span>
          <span>
            {money(product.price)}
            {product.compareAtPrice && (
              <span className="price-old">{money(product.compareAtPrice)}</span>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
