import { Link } from 'react-router-dom';

/** Approved horizontal brand lockup (web header). */
export function BrandLockup({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="brand-lockup" aria-label="Availary home">
      <img
        src="/availary-lockup-horizontal.svg"
        alt="Availary"
        className="brand-lockup__img"
      />
    </Link>
  );
}
