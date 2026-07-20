import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  hasPermission,
  resolvePermissions,
  type Person,
  type PermissionOverride,
  type RoleAssignment,
  type RoleTemplate,
  type UserAccount,
} from '@ieec/shared';

export interface SessionState {
  loading: boolean;
  user: FirebaseAuthTypes.User | null;
  account: UserAccount | null;
  person: Person | null;
  permissions: string[];
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  can: (permission: string) => boolean;
}

const SessionContext = createContext<SessionState | null>(null);

async function loadSession(user: FirebaseAuthTypes.User) {
  const accountSnap = await firestore()
    .collection('userAccounts')
    .doc(user.uid)
    .get();
  if (!accountSnap.exists()) {
    throw new Error(
      'No userAccounts record for this login. Seed bootstrap on web first.',
    );
  }
  const account = accountSnap.data() as UserAccount;
  if (account.accountStatus !== 'active') {
    throw new Error(`Account status is "${account.accountStatus}".`);
  }

  const personSnap = await firestore()
    .collection('people')
    .doc(account.personId)
    .get();
  if (!personSnap.exists()) {
    throw new Error('Linked Person record is missing.');
  }
  const person = {
    id: personSnap.id,
    ...(personSnap.data() as Omit<Person, 'id'>),
  };

  const [assignmentsSnap, overridesSnap, templatesSnap] = await Promise.all([
    firestore()
      .collection('roleAssignments')
      .where('organizationId', '==', account.organizationId)
      .where('personId', '==', account.personId)
      .where('active', '==', true)
      .get(),
    firestore()
      .collection('permissionOverrides')
      .where('organizationId', '==', account.organizationId)
      .where('personId', '==', account.personId)
      .where('active', '==', true)
      .get(),
    firestore()
      .collection('roleTemplates')
      .where('organizationId', '==', account.organizationId)
      .get(),
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
    templatesById[d.id] = {
      id: d.id,
      ...(d.data() as Omit<RoleTemplate, 'id'>),
    };
  }

  let permissions = [
    ...resolvePermissions({ assignments, templatesById, overrides }).effective,
  ];
  if (account.isSuperAdmin) {
    permissions = Array.from(
      new Set([...permissions, 'platform.admin', 'org.admin']),
    );
  }

  await firestore().collection('userAccounts').doc(user.uid).update({
    lastLoginAt: firestore.FieldValue.serverTimestamp(),
    emailVerified: user.emailVerified,
  });

  return { account, person, permissions };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged(async (nextUser) => {
      setLoading(true);
      setError(null);
      try {
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
      } catch (err) {
        setUser(nextUser);
        setAccount(null);
        setPerson(null);
        setPermissions([]);
        setError(err instanceof Error ? err.message : 'Session failed');
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      loading,
      user,
      account,
      person,
      permissions,
      error,
      signIn: async (email, password) => {
        await auth().signInWithEmailAndPassword(email.trim(), password);
      },
      signOutUser: async () => {
        await auth().signOut();
      },
      can: (permission) => hasPermission(permissions, permission),
    }),
    [loading, user, account, person, permissions, error],
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
