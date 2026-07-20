import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import type {
  FollowUpAssignment,
  FollowUpReport,
  NewcomerAttendance,
  NewcomerBioEntry,
  NewcomerJourney,
  Person,
} from '@ieec/shared';
import { useSession } from '../../engines/auth/SessionContext';
import {
  addBioEntry,
  getAssignment,
  getJourney,
  getPerson,
  listAttendanceForPerson,
  listBioEntries,
  listReportsForAssignment,
} from './api';

export function NewcomerProfilePage() {
  const { assignmentId = '' } = useParams();
  const { account, person, can } = useSession();
  const [assignment, setAssignment] = useState<FollowUpAssignment | null>(null);
  const [newcomer, setNewcomer] = useState<Person | null>(null);
  const [journey, setJourney] = useState<NewcomerJourney | null>(null);
  const [reports, setReports] = useState<FollowUpReport[]>([]);
  const [attendance, setAttendance] = useState<NewcomerAttendance[]>([]);
  const [bio, setBio] = useState<NewcomerBioEntry[]>([]);
  const [bioText, setBioText] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function reload(a: FollowUpAssignment, organizationId: string) {
    const [p, j, r, att, b] = await Promise.all([
      getPerson(a.newcomerPersonId),
      getJourney(a.journeyId),
      listReportsForAssignment(organizationId, a.id),
      listAttendanceForPerson(organizationId, a.newcomerPersonId),
      listBioEntries(a.newcomerPersonId),
    ]);
    setNewcomer(p);
    setJourney(j);
    setReports(r);
    setAttendance(att);
    setBio(b);
  }

  useEffect(() => {
    if (!account || !assignmentId) return;
    void (async () => {
      try {
        const a = await getAssignment(assignmentId);
        setAssignment(a);
        if (a) await reload(a, account.organizationId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      }
    })();
  }, [account, assignmentId]);

  async function onAddBio(event: FormEvent) {
    event.preventDefault();
    if (!account || !person || !assignment || !bioText.trim()) return;
    if (!can('follow_up.bio.add') && !can('platform.admin')) {
      setError('Missing follow_up.bio.add permission.');
      return;
    }
    await addBioEntry({
      organizationId: account.organizationId,
      personId: assignment.newcomerPersonId,
      journeyId: assignment.journeyId,
      actorPersonId: person.id,
      content: bioText.trim(),
    });
    setBioText('');
    await reload(assignment, account.organizationId);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="brand-mark">IEEC YA Connect</p>
          <h1>
            {newcomer
              ? `${newcomer.firstName} ${newcomer.lastName}`
              : 'Newcomer profile'}
          </h1>
        </div>
        <Link to="/app/follow-up">← Assignments</Link>
      </header>

      {error && <div className="banner error">{error}</div>}

      <section className="panel">
        <h2>Basics</h2>
        <dl className="meta-grid">
          <div>
            <dt>Ministry status</dt>
            <dd>{newcomer?.currentMinistryStatus ?? '—'}</dd>
          </div>
          <div>
            <dt>Journey</dt>
            <dd>{journey?.journeyStatus ?? '—'}</dd>
          </div>
          <div>
            <dt>Assignment</dt>
            <dd>{assignment?.assignmentType ?? '—'}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{newcomer?.phone?.display ?? '—'}</dd>
          </div>
        </dl>
        <p className="cta-row">
          <Link
            className="button"
            to={`/app/follow-up/newcomers/${assignmentId}/report`}
          >
            Weekly report
          </Link>
          <Link
            className="button ghost"
            to={`/app/follow-up/newcomers/${assignmentId}/attendance`}
          >
            Saturday attendance
          </Link>
        </p>
      </section>

      <section className="panel">
        <h2>Reports</h2>
        <ul className="perm-list">
          {reports.map((r) => (
            <li key={r.id}>
              <code>
                {r.reportStatus} · contact {String(r.contactMade)}
              </code>
            </li>
          ))}
          {reports.length === 0 && <li className="muted">None yet</li>}
        </ul>
      </section>

      <section className="panel">
        <h2>Attendance</h2>
        <ul className="perm-list">
          {attendance.map((a) => (
            <li key={a.id}>
              <code>
                {a.attendanceStatus} · event {a.calendarEventId}
              </code>
            </li>
          ))}
          {attendance.length === 0 && <li className="muted">None yet</li>}
        </ul>
      </section>

      <section className="panel">
        <h2>Bio</h2>
        <ul className="stack">
          {bio.map((entry) => (
            <li key={entry.id}>{entry.content}</li>
          ))}
          {bio.length === 0 && <li className="muted">No bio entries</li>}
        </ul>
        <form className="stack" onSubmit={onAddBio}>
          <label>
            Add bio note
            <textarea
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              required
            />
          </label>
          <button type="submit">Add entry</button>
        </form>
      </section>
    </div>
  );
}
