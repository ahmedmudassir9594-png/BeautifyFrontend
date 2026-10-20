import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { useGetCart } from '@workspace/api-client-react';
import { BrandMark } from '@/components/common/BrandMark';
import { toArray } from '@/utils/array';
import { hasAdminRole } from '@/utils/auth';
import { STORAGE_KEYS } from '@/constants';

export interface SiteLayoutProps {
  children: ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  const [location] = useLocation();
  const [menu, setMenu] = useState(false);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
    } catch {
      return null;
    }
  })();

  const cart = useGetCart();
  const count = toArray<{ quantity?: number }>(cart.data?.items).reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const nav = [
    ['Shop', '/shop'],
    ['Categories', '/categories'],
    ['Brands', '/brands'],
    ['Our edit', '/#edit'],
  ];

  return (
    <div className="site-shell">
      <div className="topline">
        Complimentary shipping on orders over $75 · A considered edit for everyday rituals
      </div>
      <header className="nav">
        <BrandMark />
        <nav className={`navlinks ${menu ? 'show' : ''}`}>
          {nav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={location === href ? 'active' : ''}
              data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          {hasAdminRole(currentUser?.role) && (
            <Link
              href="/admin"
              className="button secondary small"
              data-testid="link-admin-dashboard"
            >
              Admin
            </Link>
          )}
          <Link href="/shop" className="icon-button" aria-label="Search products" data-testid="link-search">
            <Search size={18} />
          </Link>
          <Link href="/account" className="icon-button" aria-label="Account" data-testid="link-account">
            <UserRound size={18} />
          </Link>
          <Link href="/cart" className="icon-button" aria-label="Shopping bag" data-testid="link-cart">
            <ShoppingBag size={18} />
            {count > 0 && (
              <span className="cart-count" data-testid="text-cart-count">
                {count}
              </span>
            )}
          </Link>
          <button
            className="icon-button mobile-menu"
            onClick={() => setMenu((open) => !open)}
            aria-label="Toggle menu"
            data-testid="button-mobile-menu"
          >
            {menu ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>
      {children}
      <footer className="footer">
        <BrandMark href="/" testId="link-footer-home" />
        <span>Small rituals, beautifully chosen.</span>
        <nav>
          <Link href="/shop" data-testid="link-footer-shop">
            Shop
          </Link>{' '}
          &nbsp;·&nbsp;{' '}
          <Link href="/account" data-testid="link-footer-account">
            Account
          </Link>{' '}
          &nbsp;·&nbsp;{' '}
          <Link href="/wishlist" data-testid="link-footer-wishlist">
            Saved items
          </Link>
        </nav>
      </footer>
    </div>
  );
}

export default SiteLayout;
