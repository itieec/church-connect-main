import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../engines/auth/SessionContext';

export function SignInPage() {
  const { signIn, user, account, loading, error, configured } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!loading && user && account) {
    return <Navigate to="/app" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <p className="brand-mark">IEEC YA Connect</p>
        <h1>Sign in</h1>
        <p className="lede">
          Ministry operations for Young Adult shepherding — secure Firebase Auth
          session.
        </p>

        {!configured && (
          <div className="banner warn">
            Firebase is not configured yet. Add production web keys to{' '}
            <code>apps/web/.env.local</code>, then redeploy.
          </div>
        )}

        <form onSubmit={onSubmit} className="stack">
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!configured || submitting}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!configured || submitting}
            />
          </label>
          {(localError || error) && (
            <div className="banner error">{localError || error}</div>
          )}
          <button type="submit" disabled={!configured || submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
      <div className="auth-visual" aria-hidden="true" />
    </div>
  );
}
