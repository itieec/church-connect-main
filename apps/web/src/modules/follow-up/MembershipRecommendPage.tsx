import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { FollowUpAssignment } from '@ieec/shared';
import { useSession } from '../../engines/auth/SessionContext';
import { getAssignment, getPerson, submitMembershipRecommendation } from './api';

export function MembershipRecommendPage() {
  const { assignmentId = '' } = useParams();
  const { account, person, can } = useSession();
  const [assignment, setAssignment] = useState<FollowUpAssignment | null>(null);
  const [name, setName] = useState('');
  const [form, setForm] = useState({
    participationSummary: '',
    attendanceSummary: '',
    followUpSummary: '',
    willingness: '',
    concerns: '',
    comments: '',
    nextSteps: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignmentId) return;
    void (async () => {
      const a = await getAssignment(assignmentId);
      setAssignment(a);
      if (a) {
        const p = await getPerson(a.newcomerPersonId);
        setName(p ? `${p.firstName} ${p.lastName}` : a.newcomerPersonId);
      }
    })();
  }, [assignmentId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!account || !person || !assignment) return;
    if (
      !can('membership.recommendations.submit') &&
      !can('platform.admin')
    ) {
      setError('Missing membership.recommendations.submit');
      return;
    }
    try {
      const id = await submitMembershipRecommendation({
        organizationId: account.organizationId,
        assignment,
        actorPersonId: person.id,
        ...form,
      });
      setMessage(
        `Recommendation ${id} submitted. Journey moved to membership_approval_in_progress. Attendance alone never decides membership.`,
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
          <h1>Membership recommendation</h1>
          <p className="lede">{name}</p>
        </div>
        <Link to={`/app/follow-up/newcomers/${assignmentId}`}>← Profile</Link>
      </header>
      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner warn">{message}</div>}
      <section className="panel">
        <form className="stack" onSubmit={onSubmit}>
          {(
            [
              ['participationSummary', 'Participation summary'],
              ['attendanceSummary', 'Attendance summary'],
              ['followUpSummary', 'Follow-up summary'],
              ['willingness', 'Willingness to continue'],
              ['concerns', 'Concerns'],
              ['comments', 'Comments'],
              ['nextSteps', 'Next steps'],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <textarea
                required={
                  key === 'participationSummary' ||
                  key === 'attendanceSummary' ||
                  key === 'followUpSummary' ||
                  key === 'willingness'
                }
                value={form[key]}
                onChange={(e) =>
                  setForm((s) => ({ ...s, [key]: e.target.value }))
                }
              />
            </label>
          ))}
          <button type="submit">Submit recommendation</button>
        </form>
      </section>
    </div>
  );
}
