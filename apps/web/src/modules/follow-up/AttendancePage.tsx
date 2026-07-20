import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { AttendanceStatus, FollowUpAssignment } from '@ieec/shared';
import { useSession } from '../../engines/auth/SessionContext';
import { getAssignment, getPerson, recordAttendance } from './api';

const STATUSES: AttendanceStatus[] = [
  'attended',
  'did_not_attend',
  'unknown',
];

export function AttendancePage() {
  const { assignmentId = '' } = useParams();
  const { account, person, can } = useSession();
  const [assignment, setAssignment] = useState<FollowUpAssignment | null>(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<AttendanceStatus>('unknown');
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

  async function save() {
    if (!account || !person || !assignment) return;
    if (
      !can('follow_up.attendance.record_assigned') &&
      !can('platform.admin')
    ) {
      setError('Missing follow_up.attendance.record_assigned permission.');
      return;
    }
    setError(null);
    try {
      const id = await recordAttendance({
        organizationId: account.organizationId,
        assignment,
        actorPersonId: person.id,
        attendanceStatus: status,
      });
      setMessage(
        `Attendance saved (${id}). This is not part of the weekly report.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="brand-mark">IEEC YA Connect</p>
          <h1>Saturday attendance</h1>
          <p className="lede">
            {name} · program 6:30 PM–9:30 PM
          </p>
        </div>
        <Link to={`/app/follow-up/newcomers/${assignmentId}`}>← Profile</Link>
      </header>

      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner warn">{message}</div>}

      <section className="panel stack">
        <p className="lede">
          Unique per person + calendar event. Never stored inside the weekly
          report.
        </p>
        <div className="cta-row">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={status === s ? undefined : 'ghost'}
              onClick={() => setStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void save()}>
          Save attendance
        </button>
      </section>
    </div>
  );
}
