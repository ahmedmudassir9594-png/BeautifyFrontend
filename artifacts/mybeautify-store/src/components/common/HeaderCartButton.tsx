import React from 'react';
import { Link } from 'wouter';
import { ShoppingCart } from 'lucide-react';

interface HeaderCartButtonProps {
  count: number;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

export function HeaderCartButton({
  count,
  href = '/cart',
  onClick,
  ariaLabel = 'Shopping Cart',
}: HeaderCartButtonProps) {
  const content = (
    <>
      <ShoppingCart size={20} />
      {count > 0 && (
        <span
          className="mb-orders-badge-pill"
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            background: '#D81B60',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 700,
            minWidth: 18,
            height: 18,
            padding: '0 4px',
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            boxSizing: 'border-box',
          }}
        >
          {count}
        </span>
      )}
    </>
  );

  const buttonStyle: React.CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: '50%',
    border: 'none',
    background: '#FFFFFF',
    color: '#6A3B49',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    boxShadow: '0 1px 4px rgba(70, 20, 35, 0.04)',
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    boxSizing: 'border-box',
  };

  if (onClick) {
    return (
      <button
        type="button"
        className="mb-orders-icon-btn"
        style={buttonStyle}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="mb-orders-icon-btn"
      style={buttonStyle}
      aria-label={ariaLabel}
    >
      {content}
    </Link>
  );
}

export default HeaderCartButton;
