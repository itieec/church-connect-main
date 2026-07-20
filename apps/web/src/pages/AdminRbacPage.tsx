import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import type { RoleAssignment, RoleTemplate } from '@ieec/shared';
import { useSession } from '../engines/auth/SessionContext';
import { getDb } from '../lib/firebase';

export function AdminRbacPage() {
  const { can, account, loading } = useSession();
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const allowed =
    can('rbac.templates.manage') ||
    can('rbac.assignments.manage') ||
    can('platform.admin') ||
    can('org.admin');

  useEffect(() => {
    if (!account || !allowed) return;
    const orgId = account.organizationId;
    void (async () => {
      try {
        const [tSnap, aSnap] = await Promise.all([
          getDocs(
            query(
              collection(getDb(), 'roleTemplates'),
              where('organizationId', '==', orgId),
            ),
          ),
          getDocs(
            query(
              collection(getDb(), 'roleAssignments'),
              where('organizationId', '==', orgId),
            ),
          ),
        ]);
        setTemplates(
          tSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RoleTemplate, 'id'>),
          })),
        );
        setAssignments(
          aSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RoleAssignment, 'id'>),
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load RBAC data');
      }
    })();
  }, [account, allowed]);

  if (!loading && !allowed) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="brand-mark">IEEC YA Connect</p>
          <h1>RBAC admin</h1>
        </div>
        <Link to="/app">← Back</Link>
      </header>

      {error && <div className="banner error">{error}</div>}

      <section className="panel">
        <h2>Role templates</h2>
        <p className="lede">
          Roles are live permission templates (ADR-RBAC-001/002). Assigning a role
          grants all template permissions in scope.
        </p>
        <div className="table">
          {templates.map((t) => (
            <article key={t.id}>
              <h3>{t.name}</h3>
              <p className="muted">
                <code>{t.key}</code> · {t.permissions.length} permissions
              </p>
              <ul className="perm-list compact">
                {t.permissions.map((p) => (
                  <li key={p}>
                    <code>{p}</code>
                  </li>
                ))}
              </ul>
            </article>
          ))}
          {templates.length === 0 && (
            <p className="muted">No templates yet. Run bootstrap seed.</p>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Assignments</h2>
        <div className="table">
          {assignments.map((a) => (
            <article key={a.id}>
              <h3>
                Person <code>{a.personId}</code>
              </h3>
              <p className="muted">
                Template <code>{a.roleTemplateId}</code> · scope {a.scope.type}
                {a.active ? ' · active' : ' · inactive'}
              </p>
            </article>
          ))}
          {assignments.length === 0 && (
            <p className="muted">No assignments yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
