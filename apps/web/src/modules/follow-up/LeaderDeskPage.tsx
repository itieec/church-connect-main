import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { NewcomerJourney, Person, PublicRegistration } from '@ieec/shared';
import { useSession } from '../../engines/auth/SessionContext';
import {
  acceptRegistrationAsNewPerson,
  createAssignment,
  discardRegistration,
  getPerson,
  intakeAndProcessRegistration,
  linkRegistrationToExistingPerson,
  listPendingRegistrations,
  listTeamMembersForAssign,
  listUnassignedJourneys,
} from './api';

export function LeaderDeskPage() {
  const { account, person, can } = useSession();
  const [journeys, setJourneys] = useState<
    Array<{ journey: NewcomerJourney; newcomer: Person | null }>
  >([]);
  const [registrations, setRegistrations] = useState<PublicRegistration[]>([]);
  const [ministers, setMinisters] = useState<Person[]>([]);
  const [assigneeByJourney, setAssigneeByJourney] = useState<
    Record<string, string>
  >({});
  const [intake, setIntake] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowed =
    can('follow_up.assignments.create') ||
    can('follow_up.duplicate.review') ||
    can('follow_up.newcomers.view_unassigned') ||
    can('platform.admin') ||
    can('org.admin');

  async function reload() {
    if (!account) return;
    const [j, regs, team] = await Promise.all([
      listUnassignedJourneys(account.organizationId),
      listPendingRegistrations(account.organizationId),
      listTeamMembersForAssign(account.organizationId),
    ]);
    const enriched = await Promise.all(
      j.map(async (journey) => ({
        journey,
        newcomer: await getPerson(journey.personId),
      })),
    );
    setJourneys(enriched);
    setRegistrations(regs);
    setMinisters(team);
  }

  useEffect(() => {
    if (!account || !allowed) return;
    void reload().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load leader desk'),
    );
  }, [account, allowed]);

  if (!allowed) {
    return (
      <div className="app-shell">
        <div className="banner error">Missing leader Follow-Up permissions.</div>
        <Link to="/app">Back</Link>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="brand-mark">IEEC YA Connect</p>
          <h1>Follow-Up leader desk</h1>
        </div>
        <Link to="/app">← Back</Link>
      </header>

      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner warn">{message}</div>}

      <section className="panel">
        <h2>Staff intake</h2>
        <p className="lede">
          Creates a registration, runs duplicate detection (no auto-merge), then
          either opens review or accepts a new Person + journey.
        </p>
        <div className="stack">
          <label>
            First name
            <input
              value={intake.firstName}
              onChange={(e) =>
                setIntake((s) => ({ ...s, firstName: e.target.value }))
              }
            />
          </label>
          <label>
            Last name
            <input
              value={intake.lastName}
              onChange={(e) =>
                setIntake((s) => ({ ...s, lastName: e.target.value }))
              }
            />
          </label>
          <label>
            Phone
            <input
              value={intake.phone}
              onChange={(e) =>
                setIntake((s) => ({ ...s, phone: e.target.value }))
              }
            />
          </label>
          <label>
            Email
            <input
              value={intake.email}
              onChange={(e) =>
                setIntake((s) => ({ ...s, email: e.target.value }))
              }
            />
          </label>
          <button
            type="button"
            onClick={() =>
              void (async () => {
                if (!account || !person) return;
                try {
                  const result = await intakeAndProcessRegistration({
                    organizationId: account.organizationId,
                    actorPersonId: person.id,
                    ...intake,
                  });
                  setMessage(`Intake ${result.status} (${result.registrationId})`);
                  setIntake({ firstName: '', lastName: '', phone: '', email: '' });
                  await reload();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Intake failed');
                }
              })()
            }
          >
            Process intake
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Duplicate / pending registrations</h2>
        <div className="table">
          {registrations.map((reg) => (
            <article key={reg.id}>
              <h3>
                {reg.firstName} {reg.lastName}
              </h3>
              <p className="muted">
                <code>{reg.status}</code>
                {reg.candidatePersonIds?.length
                  ? ` · candidates: ${reg.candidatePersonIds.join(', ')}`
                  : ''}
              </p>
              <div className="cta-row">
                <button
                  type="button"
                  onClick={() =>
                    void (async () => {
                      if (!account || !person) return;
                      await acceptRegistrationAsNewPerson({
                        organizationId: account.organizationId,
                        registrationId: reg.id,
                        actorPersonId: person.id,
                      });
                      setMessage('Accepted as new Person');
                      await reload();
                    })()
                  }
                >
                  Accept as new
                </button>
                {reg.candidatePersonIds?.[0] && (
                  <button
                    type="button"
                    className="ghost"
                    onClick={() =>
                      void (async () => {
                        if (!account || !person || !reg.candidatePersonIds?.[0])
                          return;
                        await linkRegistrationToExistingPerson({
                          organizationId: account.organizationId,
                          registrationId: reg.id,
                          personId: reg.candidatePersonIds[0],
                          actorPersonId: person.id,
                        });
                        setMessage('Linked to existing Person');
                        await reload();
                      })()
                    }
                  >
                    Link top candidate
                  </button>
                )}
                <button
                  type="button"
                  className="ghost"
                  onClick={() =>
                    void (async () => {
                      if (!account || !person) return;
                      await discardRegistration({
                        organizationId: account.organizationId,
                        registrationId: reg.id,
                        actorPersonId: person.id,
                        notes: 'Marked duplicate / discarded',
                      });
                      setMessage('Registration discarded');
                      await reload();
                    })()
                  }
                >
                  Discard
                </button>
              </div>
            </article>
          ))}
          {registrations.length === 0 && (
            <p className="muted">No pending registrations.</p>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Unassigned queue</h2>
        <div className="table">
          {journeys.map(({ journey, newcomer }) => (
            <article key={journey.id}>
              <h3>
                {newcomer
                  ? `${newcomer.firstName} ${newcomer.lastName}`
                  : journey.personId}
              </h3>
              <p className="muted">
                <code>{journey.journeyStatus}</code>
              </p>
              <label>
                Assign minister
                <select
                  value={assigneeByJourney[journey.id] ?? ''}
                  onChange={(e) =>
                    setAssigneeByJourney((s) => ({
                      ...s,
                      [journey.id]: e.target.value,
                    }))
                  }
                >
                  <option value="">Select…</option>
                  {ministers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() =>
                  void (async () => {
                    if (!account || !person) return;
                    const assignee = assigneeByJourney[journey.id];
                    if (!assignee) {
                      setError('Pick a minister first');
                      return;
                    }
                    const result = await createAssignment({
                      organizationId: account.organizationId,
                      journey,
                      assignedPersonId: assignee,
                      actorPersonId: person.id,
                      replaceExistingPrimary: true,
                    });
                    setMessage(
                      `Assigned ${result.assignmentId}${
                        result.warning ? ` · ${result.warning}` : ''
                      }`,
                    );
                    await reload();
                  })()
                }
              >
                Assign / reassign primary
              </button>
            </article>
          ))}
          {journeys.length === 0 && (
            <p className="muted">No unassigned journeys.</p>
          )}
        </div>
      </section>
    </div>
  );
}
