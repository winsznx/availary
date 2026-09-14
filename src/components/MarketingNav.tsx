import { Link } from 'react-router-dom';
import { BrandLockup } from './BrandLockup';
import { PRIMARY_APP_PATH, SIGN_IN_PATH } from '../domain/routes';

const LINKS = [
  { to: '/#product', label: 'Product' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/#safety', label: 'Safety & privacy' },
  { to: '/demo', label: 'Demo' },
];

/**
 * Fixed marketing navigation. It sits over the hero image at the top of the
 * page and stays put while scrolling, with a restrained translucent treatment.
 * One DOM copy of the links: inline on desktop, a compact disclosure menu on
 * mobile.
 */
export function MarketingNav() {
  return (
    <header className="mnav">
      <div className="mnav__inner">
        <BrandLockup />
        <details className="mnav__menu">
          <summary className="mnav__summary">Menu</summary>
          <nav className="mnav__links" aria-label="Marketing">
            {LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="mnav__link">
                {link.label}
              </Link>
            ))}
          </nav>
        </details>
        <Link
          to={SIGN_IN_PATH}
          state={{ from: PRIMARY_APP_PATH }}
          className="btn btn--primary mnav__cta"
        >
          Build my shortlist
        </Link>
      </div>
    </header>
  );
}
