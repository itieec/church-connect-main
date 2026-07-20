import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DEFAULT_WEEKLY_REPORT_FIELDS,
  type FollowUpAssignment,
  type FollowUpReport,
} from '@ieec/shared';
import { useSession } from '../../engines/auth/SessionContext';
import {
  getAssignment,
  getPerson,
  listReportsForAssignment,
  submitWeeklyReport,
} from './api';

export function WeeklyReportPage() {
  const { assignmentId = '' } = useParams();
  const { account, person, can } = useSession();
  const [assignment, setAssignment] = useState<FollowUpAssignment | null>(null);
  const [name, setName] = useState('');
  const [reports, setReports] = useState<FollowUpReport[]>([]);
  const [contactMade, setContactMade] = useState(true);
  const [expectedToAttend, setExpectedToAttend] = useState('unknown');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!account || !assignmentId) return;
    void (async () => {
      try {
        const a = await getAssignment(assignmentId);
        setAssignment(a);
        if (a) {
          const p = await getPerson(a.newcomerPersonId);
          setName(p ? `${p.firstName} ${p.lastName}` : a.newcomerPersonId);
          setReports(
            await listReportsForAssignment(account.organizationId, a.id),
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
  }, [account, assignmentId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!account || !person || !assignment) return;
    if (!can('follow_up.reports.submit') && !can('platform.admin')) {
      setError('Missing follow_up.reports.submit permission.');
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const id = await submitWeeklyReport({
        organizationId: account.organizationId,
        assignment,
        actorPersonId: person.id,
        contactMade,
        expectedToAttend,
        dynamicResponses: responses,
        canEditLocked: can('follow_up.reports.edit_locked'),
      });
      setMessage(`Report saved (${id}). Attendance is recorded separately.`);
      setReports(
        await listReportsForAssignment(account.organizationId, assignment.id),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="brand-mark">IEEC YA Connect</p>
          <h1>Weekly report</h1>
          <p className="lede">{name}</p>
        </div>
        <Link to={`/app/follow-up/newcomers/${assignmentId}`}>← Profile</Link>
      </header>

      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner warn">{message}</div>}

      <section className="panel">
        <p className="lede">
          Report ≠ attendance. Due Friday (org timezone); Saturday+ is late. Edit
          window: 7 days.
        </p>
        <form className="stack" onSubmit={onSubmit}>
          <label>
            Contact made this week?
            <select
              value={contactMade ? 'yes' : 'no'}
              onChange={(e) => setContactMade(e.target.value === 'yes')}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label>
            Expected to attend Saturday?
            <select
              value={expectedToAttend}
              onChange={(e) => setExpectedToAttend(e.target.value)}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="maybe">Maybe</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          {DEFAULT_WEEKLY_REPORT_FIELDS.map((field) => (
            <label key={field.key}>
              {field.label}
              <textarea
                required={field.required}
                value={responses[field.key] ?? ''}
                onChange={(e) =>
                  setResponses((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
              />
            </label>
          ))}
          <button type="submit">Submit weekly report</button>
        </form>
      </section>

      <section className="panel">
        <h2>Prior reports</h2>
        <ul className="perm-list">
          {reports.map((r) => (
            <li key={r.id}>
              <code>
                {r.id} · {r.reportStatus}
              </code>
            </li>
          ))}
          {reports.length === 0 && <li className="muted">None yet</li>}
        </ul>
      </section>
    </div>
  );
}
