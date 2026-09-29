import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return <main className="page" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
    <section className="empty-state" style={{ maxWidth: 600, width: '100%' }}>
      <div className="eyebrow">A small wrong turn</div>
      <Compass size={34} style={{ margin: '18px auto', color: 'hsl(var(--accent))' }} />
      <h1 className="page-title">This page wandered off.</h1>
      <p>The beauty edit you were looking for is not here, but there are plenty of good places to begin again.</p>
      <Link href="/" className="button" data-testid="link-404-home"><ArrowLeft size={15} /> Back to the edit</Link>
    </section>
  </main>;
}