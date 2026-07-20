import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { submitPublicRegistration } from './api';

export function PublicRegistrationPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState('text');
  const [preferredTime, setPreferredTime] = useState('');
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await submitPublicRegistration({
        firstName,
        lastName,
        sex: sex || undefined,
        phone: phone || undefined,
        email: email || undefined,
        contactPreferenceMethod: method,
        preferredContactTime: preferredTime || undefined,
        consent,
      });
      setMessage(
        `Registration received (${result.registrationId}). A leader will review duplicates before assignment. No account was created.`,
      );
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setConsent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="brand-mark">IEEC YA Connect</p>
          <h1>Newcomer registration</h1>
        </div>
        <Link to="/">Home</Link>
      </header>
      <section className="panel">
        <p className="lede">
          Public intake only. Internal admin fields are never collected here.
          Duplicate matches are reviewed by leaders — never auto-merged.
        </p>
        {error && <div className="banner error">{error}</div>}
        {message && <div className="banner warn">{message}</div>}
        <form className="stack" onSubmit={onSubmit}>
          <label>
            First name
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </label>
          <label>
            Last name
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </label>
          <label>
            Sex
            <input value={sex} onChange={(e) => setSex(e.target.value)} />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Preferred contact
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="text">Text</option>
              <option value="call">Call</option>
            </select>
          </label>
          <label>
            Preferred time
            <input
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
            />{' '}
            I consent to be contacted by IEEC YA Follow-Up.
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit registration'}
          </button>
        </form>
      </section>
    </div>
  );
}
