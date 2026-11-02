import { Link } from 'wouter';

export interface BrandMarkProps {
  href?: string;
  testId?: string;
}

export function BrandMark({ href = '/', testId = 'link-home' }: BrandMarkProps) {
  return (
    <Link
      href={href}
      className="brand-lockup"
      data-testid={testId}
      aria-label="MALKAZ home"
    >
      <span className="brand-wordmark">
        <span className="brand-name">MALKAZ</span>
      </span>
    </Link>
  );
}

export default BrandMark;
