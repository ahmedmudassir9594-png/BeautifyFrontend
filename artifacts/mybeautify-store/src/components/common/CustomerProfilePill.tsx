import React, { useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { ChevronDown, Lock, PackageCheck, User as UserIcon } from 'lucide-react';
import type { UserResponse } from '@/types/auth.types';

interface CustomerProfilePillProps {
  user: UserResponse | null;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
}

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 16px',
  border: 0,
  background: 'transparent',
  color: '#063B2F',
  fontSize: 13,
  textAlign: 'left',
  textDecoration: 'none',
  cursor: 'pointer',
};

export function CustomerProfilePill({
  user,
  isOpen,
  onToggle,
  onClose,
  onLogout,
}: CustomerProfilePillProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const displayName = user?.fullName || user?.email || 'Sign in';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="mb-customer-profile-pill"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: '#F8F4EB',
          border: '1px solid #E8DEC8',
          borderRadius: 999,
          padding: '4px 12px 4px 5px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
      >
        <div
          className="mb-customer-avatar-circle"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#063B2F',
            color: '#D4AF63',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <UserIcon size={16} aria-hidden="true" />
        </div>

        <span
          className="mb-customer-profile-name"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#063B2F',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </span>

        <ChevronDown size={14} style={{ color: '#806A3E' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '115%',
            background: '#FFFFFF',
            border: '1px solid #E8DEC8',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(6, 59, 47, 0.12)',
            minWidth: 180,
            zIndex: 60,
            padding: '6px 0',
          }}
        >
          {user ? (
            <>
              <Link
                href="/orders"
                style={menuItemStyle}
                onClick={onClose}
              >
                <PackageCheck size={16} />
                <span>My Orders</span>
              </Link>
              <Link
                href="/account"
                style={menuItemStyle}
                onClick={onClose}
              >
                <UserIcon size={16} />
                <span>My Profile</span>
              </Link>
              <button
                type="button"
                style={{ ...menuItemStyle, color: '#9A4D3F' }}
                onClick={() => {
                  onClose();
                  onLogout();
                }}
              >
                <Lock size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link href="/sign-in" style={menuItemStyle} onClick={onClose}>
              <UserIcon size={16} />
              <span>Sign in to your account</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
export default CustomerProfilePill;
