import { Link } from 'react-router-dom';
import { useSession } from '../engines/auth/SessionContext';

export function DashboardPage() {
  const { person, account, permissions, can, signOutUser } = useSession();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="brand-mark">IEEC YA Connect</p>
          <h1>Operations home</h1>
        </div>
        <button type="button" className="ghost" onClick={() => void signOutUser()}>
          Sign out
        </button>
      </header>

      <section className="panel">
        <h2>Session</h2>
        <dl className="meta-grid">
          <div>
            <dt>Person</dt>
            <dd>
              {person?.firstName} {person?.lastName}
            </dd>
          </div>
          <div>
            <dt>Ministry status</dt>
            <dd>{person?.currentMinistryStatus}</dd>
          </div>
          <div>
            <dt>Organization</dt>
            <dd>{account?.organizationId}</dd>
          </div>
          <div>
            <dt>Account</dt>
            <dd>{account?.accountStatus}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h2>Access</h2>
        <p className="lede">
          Effective permissions resolved from live role templates, assignments,
          and overrides (deny wins).
        </p>
        <ul className="perm-list">
          {permissions.length === 0 && <li>No permissions resolved.</li>}
          {permissions.map((p) => (
            <li key={p}>
              <code>{p}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Follow-Up</h2>
        {can('follow_up.view') || can('platform.admin') || can('org.admin') ? (
          <p>
            <Link to="/app/follow-up">My assigned newcomers</Link>
          </p>
        ) : (
          <p className="muted">No Follow-Up module access.</p>
        )}
      </section>

      <section className="panel">
        <h2>Admin</h2>
        {can('rbac.templates.manage') || can('platform.admin') || can('org.admin') ? (
          <p>
            <Link to="/app/admin/rbac">Manage role templates &amp; assignments</Link>
          </p>
        ) : (
          <p className="muted">You do not have RBAC admin permissions.</p>
        )}
      </section>
    </div>
  );
}
