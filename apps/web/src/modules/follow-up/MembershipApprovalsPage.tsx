import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MembershipRecommendation } from '@ieec/shared';
import { useSession } from '../../engines/auth/SessionContext';
import {
  decideMembershipRecommendation,
  getPerson,
  listMembershipRecommendations,
} from './api';

export function MembershipApprovalsPage() {
  const { account, person, can } = useSession();
  const [rows, setRows] = useState<
    Array<{ rec: MembershipRecommendation; name: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const allowed =
    can('follow_up.membership_review.start') ||
    can('platform.admin') ||
    can('org.admin');

  async function reload() {
    if (!account) return;
    const list = await listMembershipRecommendations(account.organizationId);
    const enriched = await Promise.all(
      list.map(async (rec) => {
        const p = await getPerson(rec.personId);
        return {
          rec,
          name: p ? `${p.firstName} ${p.lastName}` : rec.personId,
        };
      }),
    );
    setRows(enriched);
  }

  useEffect(() => {
    if (!account || !allowed) return;
    void reload().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load'),
    );
  }, [account, allowed]);

  if (!allowed) {
    return (
      <div className="app-shell">
        <div className="banner error">Missing membership review permission.</div>
        <Link to="/app">Back</Link>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="brand-mark">IEEC YA Connect</p>
          <h1>Membership approvals</h1>
        </div>
        <Link to="/app">← Back</Link>
      </header>
      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner warn">{message}</div>}
      <section className="panel">
        <p className="lede">
          Configurable workflow MVP: leader approve/reject/return. Approved →
          Person becomes Member; journey `transitioned_to_member`; assignments
          ended. Never auto-promote by time alone.
        </p>
        <div className="table">
          {rows.map(({ rec, name }) => (
            <article key={rec.id}>
              <h3>{name}</h3>
              <p className="muted">{rec.participationSummary}</p>
              <p className="muted">Willingness: {rec.willingness}</p>
              <div className="cta-row">
                {(
                  [
                    ['approved', 'Approve → Member'],
                    ['rejected', 'Reject'],
                    ['returned_for_correction', 'Return'],
                  ] as const
                ).map(([decision, label]) => (
                  <button
                    key={decision}
                    type="button"
                    className={decision === 'approved' ? undefined : 'ghost'}
                    onClick={() =>
                      void (async () => {
                        if (!account || !person) return;
                        await decideMembershipRecommendation({
                          organizationId: account.organizationId,
                          recommendation: rec,
                          actorPersonId: person.id,
                          decision,
                        });
                        setMessage(`${name}: ${decision}`);
                        await reload();
                      })()
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </article>
          ))}
          {rows.length === 0 && (
            <p className="muted">No submitted recommendations.</p>
          )}
        </div>
      </section>
    </div>
  );
}
