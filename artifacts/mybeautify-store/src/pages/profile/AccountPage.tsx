import { useState } from 'react';
import { Link } from 'wouter';
import { UserRound } from 'lucide-react';
import { useGetOrders, type Order } from '@workspace/api-client-react';
import { SiteLayout as Layout } from '@/layouts/SiteLayout';
import { ErrorState } from '@/components/common/ErrorState';
import { hasAdminRole } from '@/utils/auth';
import { money, initials } from '@/utils/format';
import { toArray } from '@/utils/array';
import { STORAGE_KEYS } from '@/constants';

export function AccountPage() {
  const orders = useGetOrders();
  const orderList = toArray<Order>(orders.data);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
    } catch {
      return null;
    }
  });

  return (
    <Layout>
      <main className="page">
        <div className="catalog-head">
          <div>
            <div className="eyebrow">Your space</div>
            <h1>
              The account
              <br />
              edit.
            </h1>
          </div>
          <p className="section-copy">
            Order history and a little more context for your next ritual.
          </p>
        </div>

        {user ? (
          <div className="account-layout">
            <nav className="account-nav">
              <a className="active" href="#profile" data-testid="link-account-profile">
                Profile
              </a>
              <a href="#orders" data-testid="link-account-orders">
                Order history
              </a>
              {hasAdminRole(user.role) && (
                <Link
                  href="/admin"
                  className="button secondary small"
                  data-testid="link-account-admin"
                >
                  Admin dashboard
                </Link>
              )}
              <button
                className="button secondary small"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEYS.USER);
                  sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
                  setUser(null);
                }}
                data-testid="button-sign-out"
              >
                Sign out
              </button>
            </nav>

            <section>
              <div className="profile-card" id="profile">
                <div>
                  <div className="eyebrow">Welcome back</div>
                  <h2 style={{ font: '32px var(--app-font-serif)', margin: '7px 0' }}>
                    {user.name || user.fullName}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {user.email}
                  </p>
                </div>
                <div className="avatar">{initials(user.name || user.fullName)}</div>
              </div>

              <div id="orders" style={{ marginTop: 45 }}>
                <div className="section-head">
                  <h2 className="section-title" style={{ fontSize: 35 }}>
                    Order history
                  </h2>
                </div>
                {orders.isLoading ? (
                  <div className="skeleton line" />
                ) : orders.isError ? (
                  <ErrorState retry={() => orders.refetch()} />
                ) : orderList.length ? (
                  <div>
                    {orderList.map((order) => (
                      <div
                        className="order-row"
                        key={order.id}
                        data-testid={`row-order-${order.id}`}
                      >
                        <span>{order.id}</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="status">{order.status}</span>
                        <strong>{money(order.total)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <h2>No orders yet.</h2>
                    <p>Your considered purchases will appear here.</p>
                    <Link href="/shop" className="button small" data-testid="link-account-shop">
                      Start shopping
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <UserRound size={25} />
            <h2>Your space is waiting.</h2>
            <p>Sign in to see orders, save products, and make your next visit easier.</p>
            <Link href="/sign-in" className="button" data-testid="link-account-sign-in">
              Sign in
            </Link>
          </div>
        )}
      </main>
    </Layout>
  );
}

export default AccountPage;
