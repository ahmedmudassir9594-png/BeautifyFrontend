import React, { useMemo, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { ChevronDown, PackageCheck, User as UserIcon, Lock } from 'lucide-react';
import type { UserResponse } from '@/types/auth.types';

interface CustomerProfilePillProps {
  user: UserResponse | null;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
}

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

  // Compute initials dynamically based on real user data
  const initials = useMemo(() => {
    if (!user || !user.fullName) {
      if (user?.email) return user.email.substring(0, 2).toUpperCase();
      return 'MB';
    }
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.fullName.substring(0, 2).toUpperCase();
  }, [user]);

  const displayName = user?.fullName || user?.email || 'Customer';

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
          background: '#FFF0F4',
          border: '1px solid #F5D3DC',
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
            background: '#D8899E',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <span
          className="mb-customer-profile-name"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#4A1525',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </span>

        <ChevronDown size={14} style={{ color: '#8C5A67' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '115%',
            background: '#FFFFFF',
            border: '1px solid #ECE0E3',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(70, 20, 35, 0.12)',
            minWidth: 180,
            zIndex: 60,
            padding: '6px 0',
          }}
        >
          <Link
            href="/orders"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              fontSize: 13,
              color: '#4A1525',
              textDecoration: 'none',
              transition: 'background 0.15s ease',
            }}
            onClick={onClose}
          >
            <PackageCheck size={16} />
            <span>My Orders</span>
          </Link>

          <Link
            href="/account"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              fontSize: 13,
              color: '#4A1525',
              textDecoration: 'none',
              transition: 'background 0.15s ease',
            }}
            onClick={onClose}
          >
            <UserIcon size={16} />
            <span>My Profile</span>
          </Link>

          <button
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              fontSize: 13,
              color: '#A01548',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <Lock size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
export default CustomerProfilePill;
