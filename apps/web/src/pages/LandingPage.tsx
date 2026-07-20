import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-hero">
        <p className="brand-mark">IEEC YA Connect</p>
        <h1>Shepherd people from first visit to ministry leadership.</h1>
        <p className="lede">
          People-centered Young Adult ministry platform on Firebase — web first,
          shared engines for Follow-Up and beyond.
        </p>
        <div className="cta-row">
          <Link className="button" to="/sign-in">
            Sign in
          </Link>
          <a className="button ghost" href="#phase">
            Platform status
          </a>
        </div>
      </header>

      <section id="phase" className="landing-section">
        <h2>Production foundation (Phase A)</h2>
        <p className="lede">
          Auth session, Person ↔ User Account chain, live RBAC templates,
          Firestore rules, and Firebase Hosting are in place. Follow-Up module
          is Phase B.
        </p>
      </section>
    </div>
  );
}
