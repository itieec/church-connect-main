import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FollowUpAssignment, Person } from '@ieec/shared';
import { useSession } from '../../engines/auth/SessionContext';
import { getPerson, listMyAssignments } from './api';

export function AssignedNewcomersPage() {
  const { account, person, can } = useSession();
  const [rows, setRows] = useState<
    Array<{ assignment: FollowUpAssignment; newcomer: Person | null }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account || !person) return;
    if (!can('follow_up.view') && !can('platform.admin') && !can('org.admin')) {
      setLoading(false);
      setError('Missing follow_up.view permission.');
      return;
    }
    void (async () => {
      try {
        const assignments = await listMyAssignments(
          account.organizationId,
          person.id,
        );
        const enriched = await Promise.all(
          assignments.map(async (assignment) => ({
            assignment,
            newcomer: await getPerson(assignment.newcomerPersonId),
          })),
        );
        setRows(enriched);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignments');
      } finally {
        setLoading(false);
      }
    })();
  }, [account, person, can]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="brand-mark">IEEC YA Connect</p>
          <h1>My assigned newcomers</h1>
        </div>
        <Link to="/app">← Back</Link>
      </header>

      {loading && <p>Loading…</p>}
      {error && <div className="banner error">{error}</div>}

      <section className="panel">
        <p className="lede">
          Assignments scoped to your Person record. Weekly report and Saturday
          attendance are separate actions.
        </p>
        <div className="table">
          {rows.map(({ assignment, newcomer }) => (
            <article key={assignment.id}>
              <h3>
                {newcomer
                  ? `${newcomer.firstName} ${newcomer.lastName}`
                  : assignment.newcomerPersonId}
              </h3>
              <p className="muted">
                {assignment.assignmentType} · journey{' '}
                <code>{assignment.journeyId}</code>
              </p>
              <p className="cta-row">
                <Link
                  className="button"
                  to={`/app/follow-up/newcomers/${assignment.id}`}
                >
                  Open profile
                </Link>
                <Link
                  className="button ghost"
                  to={`/app/follow-up/newcomers/${assignment.id}/report`}
                >
                  Weekly report
                </Link>
                <Link
                  className="button ghost"
                  to={`/app/follow-up/newcomers/${assignment.id}/attendance`}
                >
                  Saturday attendance
                </Link>
              </p>
            </article>
          ))}
          {!loading && rows.length === 0 && (
            <p className="muted">No active assignments.</p>
          )}
        </div>
      </section>
    </div>
  );
}
