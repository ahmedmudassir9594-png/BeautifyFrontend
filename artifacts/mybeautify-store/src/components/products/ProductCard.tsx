import { Heart } from 'lucide-react';
import { Link } from 'wouter';
import type { Product } from '@workspace/api-client-react';
import { imageFor } from '@/utils/image';
import { money } from '@/utils/format';

export interface ProductCardProps {
  product: Product;
  saved?: boolean;
  onSave?: (product: Product) => void;
  onAdd?: (product: Product) => void;
}

export function ProductCard({
  product,
  saved = false,
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
          <div className="product-overlay">
            <button
              className="button small"
              onClick={() => onAdd(product)}
              data-testid={`button-add-${product.id}`}
            >
              Add to bag
            </button>
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
