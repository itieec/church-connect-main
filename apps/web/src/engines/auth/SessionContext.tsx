import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  hasPermission,
  resolvePermissions,
  type Person,
  type PermissionOverride,
  type RoleAssignment,
  type RoleTemplate,
  type UserAccount,
} from '@ieec/shared';
import { getDb, getFirebaseAuth, isFirebaseConfigured } from '../../lib/firebase';

export interface SessionState {
  loading: boolean;
  configured: boolean;
  user: User | null;
  account: UserAccount | null;
  person: Person | null;
  permissions: string[];
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  can: (permission: string) => boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

async function loadSession(user: User) {
  const db = getDb();
  const accountSnap = await getDoc(doc(db, 'userAccounts', user.uid));
  if (!accountSnap.exists()) {
    throw new Error(
      'No userAccounts record for this login. Run bootstrap seed after creating Auth user.',
    );
  }

  const account = accountSnap.data() as UserAccount;
  if (account.accountStatus !== 'active') {
    throw new Error(`Account status is "${account.accountStatus}". Sign-in blocked.`);
  }

  const personSnap = await getDoc(doc(db, 'people', account.personId));
  if (!personSnap.exists()) {
    throw new Error('Linked Person record is missing.');
  }
  const person = { id: personSnap.id, ...(personSnap.data() as Omit<Person, 'id'>) };

  if (person.recordStatus === 'archived') {
    throw new Error('Person record is archived. Contact an administrator.');
  }

  const [assignmentsSnap, overridesSnap, templatesSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, 'roleAssignments'),
        where('organizationId', '==', account.organizationId),
        where('personId', '==', account.personId),
        where('active', '==', true),
      ),
    ),
    getDocs(
      query(
        collection(db, 'permissionOverrides'),
        where('organizationId', '==', account.organizationId),
        where('personId', '==', account.personId),
        where('active', '==', true),
      ),
    ),
    getDocs(
      query(
        collection(db, 'roleTemplates'),
        where('organizationId', '==', account.organizationId),
      ),
    ),
  ]);

  const assignments: RoleAssignment[] = assignmentsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<RoleAssignment, 'id'>),
  }));
  const overrides: PermissionOverride[] = overridesSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<PermissionOverride, 'id'>),
  }));
  const templatesById: Record<string, RoleTemplate> = {};
  for (const d of templatesSnap.docs) {
    templatesById[d.id] = { id: d.id, ...(d.data() as Omit<RoleTemplate, 'id'>) };
  }

  let permissions = [
    ...resolvePermissions({ assignments, templatesById, overrides }).effective,
  ];

  if (account.isSuperAdmin) {
    permissions = Array.from(new Set([...permissions, 'platform.admin', 'org.admin']));
  }

  await updateDoc(doc(db, 'userAccounts', user.uid), {
    lastLoginAt: serverTimestamp(),
    emailVerified: user.emailVerified,
  });

  return { account, person, permissions };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const hydrate = async (nextUser: User | null) => {
    if (!nextUser) {
      setUser(null);
      setAccount(null);
      setPerson(null);
      setPermissions([]);
      return;
    }
    const session = await loadSession(nextUser);
    setUser(nextUser);
    setAccount(session.account);
    setPerson(session.person);
    setPermissions(session.permissions);
  };

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      setError(
        'Firebase web config missing. Add keys to apps/web/.env.local (see .env.example).',
      );
      return;
    }

    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setError(null);
      try {
        await hydrate(nextUser);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
        setUser(nextUser);
        setAccount(null);
        setPerson(null);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, [configured]);

  const value = useMemo<SessionState>(
    () => ({
      loading,
      configured,
      user,
      account,
      person,
      permissions,
      error,
      signIn: async (email, password) => {
        setError(null);
        await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      },
      signOutUser: async () => {
        await signOut(getFirebaseAuth());
      },
      can: (permission) => hasPermission(permissions, permission),
      refresh: async () => {
        const current = getFirebaseAuth().currentUser;
        await hydrate(current);
      },
    }),
    [loading, configured, user, account, person, permissions, error],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
