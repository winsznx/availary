import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLockup } from './BrandLockup';
import { GitHubIcon, XIcon } from './BrandIcons';
import { DEMO_PATH, PRIMARY_APP_PATH, RADAR_PATH, SIGN_IN_PATH } from '../domain/routes';

/**
 * Immersive footer: a full-width image section with a dark overlay, carrying the
 * closing CTA, the link columns and the base line.
 *
 * Follow and contact destinations have no approved URL or address yet, so they
 * stay visibly non-final. Icons are used for recognition; nothing is invented.
 */
const CONTACT_EMAIL = 'hello@availary.app';

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__media" aria-hidden="true">
        <img src="/images/lower-cta.jpg" alt="" width={736} height={736} loading="lazy" />
      </div>
      <div className="footer__scrim" aria-hidden="true" />

      <div className="footer__inner">
        <div className="footer__cta">
          <h2 className="footer__cta-title">Ready when you are.</h2>
          <p className="footer__cta-lede">
            Start with the providers you already trust, and see when care opens
            up.
          </p>
          <div className="footer__cta-actions">
            <Link
              to={SIGN_IN_PATH}
              state={{ from: PRIMARY_APP_PATH }}
              className="btn btn--primary"
            >
              Build my shortlist
            </Link>
            <Link to={DEMO_PATH} className="btn btn--on-dark">
              See live demo
            </Link>
          </div>
        </div>

        <div className="footer__grid">
          <div className="footer__brand">
            <BrandLockup />
            <p className="footer__tagline">
              See when care opens up, with evidence you can understand.
            </p>
            <p className="footer__tbc-note">
              Follow and contact links are pending approval.
            </p>
          </div>

          <nav className="footer__col" aria-label="Product">
            <h2 className="footer__h2">Product</h2>
            <ul>
              <li>
                <Link to="/#product">Product</Link>
              </li>
              <li>
                <Link to={RADAR_PATH}>Radar</Link>
              </li>
              <li>
                <Link to="/providers">Providers</Link>
              </li>
              <li>
                <Link to="/start">Care need</Link>
              </li>
              <li>
                <Link to="/demo">Demo</Link>
              </li>
            </ul>
          </nav>

          <nav className="footer__col" aria-label="Legal">
            <h2 className="footer__h2">Legal</h2>
            <ul>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms">Terms of Service</Link>
              </li>
            </ul>
          </nav>

          <nav className="footer__col" aria-label="Follow">
            <h2 className="footer__h2">Follow (TBC)</h2>
            <ul className="footer__icons">
              <li>
                <a
                  href="#"
                  data-placeholder="true"
                  className="footer__icon"
                  title="Link to be confirmed"
                  aria-label="GitHub, link to be confirmed"
                >
                  <GitHubIcon size={18} />
                  <span className="sr-only">GitHub</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  data-placeholder="true"
                  className="footer__icon"
                  title="Link to be confirmed"
                  aria-label="X, link to be confirmed"
                >
                  <XIcon size={18} />
                  <span className="sr-only">X</span>
                </a>
              </li>
            </ul>
          </nav>

          <nav className="footer__col" aria-label="Contact">
            <h2 className="footer__h2">Contact (TBC)</h2>
            <ul className="footer__icons">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="footer__icon"
                  title="Address to be confirmed"
                  aria-label={`Email ${CONTACT_EMAIL}, to be confirmed`}
                >
                  <Mail size={18} aria-hidden="true" />
                  <span className="sr-only">Email</span>
                </a>
              </li>
            </ul>
            <ul>
              <li>
                <Link to={SIGN_IN_PATH}>Sign in</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="footer__base">
        <p>© 2026 Availary. Prototype data is illustrative.</p>
        <p className="footer__disclosure">
          Demo data is synthetic. Live calls require explicit approval and never
          happen automatically.
        </p>
      </div>
    </footer>
  );
}
