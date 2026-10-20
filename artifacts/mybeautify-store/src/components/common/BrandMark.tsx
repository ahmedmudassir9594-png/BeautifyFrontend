import { Link } from 'wouter';

export interface BrandMarkProps {
  href?: string;
  testId?: string;
}

export function BrandMark({ href = '/', testId = 'link-home' }: BrandMarkProps) {
  return (
    <Link href={href} className="brand-lockup" data-testid={testId} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <img className="brand-mark" src="/malka-zai-emblem.png" alt="Malka Zai" aria-hidden="true" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
      <span className="brand-name" style={{ fontFamily: 'Cinzel, Georgia, serif', fontWeight: 700, letterSpacing: '0.06em', color: '#0A261D', fontSize: 18 }}>MALKA ZAI</span>
    </Link>
  );
}

export default BrandMark;
