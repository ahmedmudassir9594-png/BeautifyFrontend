import type { ReactNode } from 'react';
import { Link } from 'wouter';
import {
  Headphones,
  Heart,
  Home,
  LogOut,
  MapPin,
  Package,
  Share2,
  ShoppingBag,
  Star,
  Ticket,
  UserRound,
} from 'lucide-react';
import './MalkazSidebar.css';

export type MalkazSidebarAction =
  | 'wishlist'
  | 'profile'
  | 'addresses'
  | 'coupons'
  | 'reviews'
  | 'support';

interface MalkazSidebarProps {
  activeItem?: string;
  isOpen?: boolean;
  isSignedIn?: boolean;
  onAction?: (action: MalkazSidebarAction) => void;
  onClose?: () => void;
  onLogout?: () => void;
}

interface SidebarItem {
  key: string;
  label: string;
  icon: ReactNode;
  href: string;
  action?: MalkazSidebarAction;
}

export function MalkazSidebar({
  activeItem,
  isOpen = false,
  isSignedIn = false,
  onAction,
  onClose,
  onLogout,
}: MalkazSidebarProps) {
  const items: SidebarItem[] = [
    { key: 'home', label: 'Home', icon: <Home size={18} />, href: '/' },
    { key: 'orders', label: 'My Orders', icon: <Package size={18} />, href: '/orders' },
    {
      key: 'wishlist',
      label: 'Wishlist',
      icon: <Heart size={18} />,
      href: '/account?panel=wishlist',
      action: 'wishlist',
    },
    {
      key: 'profile',
      label: 'My Profile',
      icon: <UserRound size={18} />,
      href: '/account?panel=profile',
      action: 'profile',
    },
    {
      key: 'addresses',
      label: 'Addresses',
      icon: <MapPin size={18} />,
      href: '/account?panel=addresses',
      action: 'addresses',
    },
    {
      key: 'coupons',
      label: 'Coupons & Offers',
      icon: <Ticket size={18} />,
      href: '/account?panel=coupons',
      action: 'coupons',
    },
    { key: 'referral', label: 'Share & Referral', icon: <Share2 size={18} />, href: '/share-referral' },
    {
      key: 'reviews',
      label: 'Reviews',
      icon: <Star size={18} />,
      href: '/account?panel=reviews',
      action: 'reviews',
    },
    {
      key: 'support',
      label: 'Help & Support',
      icon: <Headphones size={18} />,
      href: '/account?panel=support',
      action: 'support',
    },
  ];

  return (
    <>
      <button
        type="button"
        className={`mz-sidebar-backdrop ${isOpen ? 'show' : ''}`}
        onClick={onClose}
        aria-label="Close navigation"
        tabIndex={isOpen ? 0 : -1}
      />
      <aside className={`mz-app-sidebar ${isOpen ? 'open' : ''}`} aria-label="Main navigation">
        <div className="mz-app-sidebar-top">
          <Link
            href="/"
            className="mz-app-sidebar-brand"
            onClick={onClose}
            aria-label="MALKAZ Royal Jewels home"
          >
            <img src="/malka-zai-emblem.png" alt="" width={94} height={82} />
            <span>MALKAZ</span>
            <small>ROYAL JEWELS</small>
          </Link>
          <nav>
            <ul className="mz-app-sidebar-nav">
              {items.map((item) => (
                <li key={item.key}>
                  {item.action && onAction ? (
                    <button
                      type="button"
                      className={`mz-app-sidebar-link ${activeItem === item.key ? 'active' : ''}`}
                      onClick={() => {
                        onAction(item.action!);
                        onClose?.();
                      }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`mz-app-sidebar-link ${activeItem === item.key ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
              <li className="mz-app-sidebar-auth">
                {isSignedIn ? (
                  <button type="button" className="mz-app-sidebar-link logout-link" onClick={onLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                ) : (
                  <Link href="/sign-in" className="mz-app-sidebar-link" onClick={onClose}>
                    <UserRound size={18} />
                    <span>Sign In</span>
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </div>
        <div className="mz-app-sidebar-footer" aria-label="MALKAZ Royal Jewels">
          <span>✦ ❖ ✦</span>
          <p>Timeless Elegance<br />Forever Jewellery</p>
          <span>✦ ❖ ✦</span>
        </div>
      </aside>
    </>
  );
}
