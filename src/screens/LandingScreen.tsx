import { Link } from 'react-router-dom';
import { RadarPreview } from '../components/RadarPreview';
import { StateLabel } from '../components/StateLabel';
import { NOT_SHARED } from '../domain/callCopy';
import { DEMO_PATH, PRIMARY_APP_PATH, SIGN_IN_PATH } from '../domain/routes';

/**
 * Long-form landing. The hero and footer are immersive image sections; the
 * middle section is an editorial split. Photos are used as true section
 * backgrounds or full editorial halves, never as small floating cards.
 *
 * Photo alt text is intentionally empty: the image content is not
 * machine-verifiable here, so no descriptive claim is invented.
 */
export function LandingScreen() {
  return (
    <div className="landing-page">
      <section className="hero" id="top">
        <div className="hero__media" aria-hidden="true">
          <img src="/images/hero-childcare.jpg" alt="" width={728} height={1092} />
        </div>
        <div className="hero__scrim" aria-hidden="true" />
        <div className="hero__inner">
          <p className="hero__eyebrow">Live childcare availability</p>
          <h1 className="hero__title">See when care opens up.</h1>
          <p className="hero__lede">
            A living availability diary for your childcare shortlist. Answers
            are dated, so an old waitlist reply never looks current again.
          </p>
          <div className="hero__actions">
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

        <div className="band" aria-hidden="true">
          <span>See when care opens up</span>
          <span>·</span>
          <span>Evidence, not guesses</span>
          <span>·</span>
          <span>Timed and dated</span>
          <span>·</span>
          <span>Your shortlist, kept current</span>
        </div>
      </section>

      <section className="section" id="product">
        <header className="section__head section__head--center">
          <p className="section__eyebrow">The Radar</p>
          <h2 className="section__title">Your Opening Radar</h2>
          <p className="section__lede">
            One dated thread per provider. Availability, compatibility and
            freshness sit together, so you compare by time instead of memory.
          </p>
        </header>
        <div className="device-wrap">
          <div className="device">
            <div className="device__bar" aria-hidden="true">
              <span className="device__dot" />
              <span className="device__dot" />
              <span className="device__dot" />
              <span className="device__pill">availary.app/radar</span>
            </div>
            <div className="device__screen">
              <RadarPreview />
            </div>
          </div>
        </div>
      </section>

      <section className="editorial" id="how-it-works">
        <div className="editorial__media" aria-hidden="true">
          <img src="/images/section-care.jpg" alt="" width={736} height={920} loading="lazy" />
        </div>
        <div className="editorial__copy">
          <p className="section__eyebrow">How it works</p>
          <h2 className="section__title">A waitlist is not a timeline.</h2>
          <p className="section__lede">
            Directories tell you a provider exists. They do not tell you whether
            a place may open for your child, on your weekdays, at the date you
            need. Availary records the timing.
          </p>

          <div className="editorial__blocks">
            <article className="block">
              <h3 className="block__title">An opening needs evidence.</h3>
              <p className="block__body">
                Every state comes from a call you approved, with the answer it
                came from. You can see why a provider reads the way it does.
              </p>
            </article>
            <article className="block">
              <h3 className="block__title">Control before action.</h3>
              <p className="block__body">
                You review the exact question and approve one call. There is no
                automatic repeat and no second call placed for you.
              </p>
            </article>
          </div>

          <div className="editorial__panel">
            <p className="editorial__panel-title">Availability over time</p>
            <ol className="change__rail">
              <li className="change__step">
                <StateLabel state="WAITLIST_ONLY" />
                <span className="change__date tabular">Checked 6 Sep</span>
              </li>
              <li className="change__arrow" aria-hidden="true">
                →
              </li>
              <li className="change__step">
                <StateLabel state="EXPECTED_OPENING" />
                <span className="change__date tabular">Checked 12 Sep</span>
              </li>
              <li className="change__arrow" aria-hidden="true">
                →
              </li>
              <li className="change__step">
                <StateLabel state="OPEN_NOW" />
                <span className="change__date tabular">Checked 28 Sep</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="section" id="safety">
        <header className="section__head">
          <p className="section__eyebrow">Safety and privacy</p>
          <h2 className="section__title">Privacy by default.</h2>
          <p className="section__lede">
            Availary shares only the care facts needed to ask the availability
            question. Everything else stays with you.
          </p>
        </header>
        <ul className="privacy-list">
          {NOT_SHARED.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
