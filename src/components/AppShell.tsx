import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { MarketingNav } from './MarketingNav';
import { SiteFooter } from './SiteFooter';
import { RADAR_PATH } from '../domain/routes';
import { useAuth } from '../services/auth/AuthContext';

const PRODUCT_LINKS = [
  { to: RADAR_PATH, label: 'Radar' },
  { to: '/providers', label: 'Providers' },
  { to: '/start', label: 'Care need' },
];

const MARKETING_ROUTES = ['/', '/privacy', '/terms'];

/** Auth pages are standalone: no marketing nav, no landing footer. */
const BARE_ROUTES = ['/signin'];

export function AppShell() {
  const { pathname } = useLocation();
  const { session } = useAuth();
  const showDemoBadge = pathname.startsWith('/demo');

  if (BARE_ROUTES.includes(pathname)) {
    return (
      <div className="app-shell app-shell--bare">
        <main className="bare-main">
          <Outlet />
        </main>
      </div>
    );
  }

  if (MARKETING_ROUTES.includes(pathname)) {
    // The landing hero is full screen and the fixed nav overlays it, so the
    // landing main needs no top offset; the legal pages do.
    const isLanding = pathname === '/';
    return (
      <div className="app-shell app-shell--marketing">
        <MarketingNav />
        <main
          className={`marketing-main${
            isLanding ? ' marketing-main--overlay' : ''
          }`}
        >
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topnav">
        <div className="topnav__inner">
          <NavLink to="/" className="topnav__brand" aria-label="Availary home">
            <img
              src="/availary-lockup-horizontal.svg"
              alt="Availary"
              className="topnav__brand-img"
            />
          </NavLink>
          <nav className="topnav__links" aria-label="Product">
            {PRODUCT_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `topnav__link${isActive ? ' topnav__link--active' : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="topnav__meta">
            {showDemoBadge ? <span className="demo-badge">Demo data</span> : null}
            {session ? (
              <NavLink to="/settings" className="topnav__link topnav__link--quiet">
                Account
              </NavLink>
            ) : (
              <NavLink to="/signin" className="topnav__link">
                Sign in
              </NavLink>
            )}
          </div>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
