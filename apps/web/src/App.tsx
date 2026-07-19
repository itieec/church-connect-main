import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from './engines/auth/SessionContext';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminRbacPage } from './pages/AdminRbacPage';

function Protected({ children }: { children: ReactNode }) {
  const { loading, user, account, error } = useSession();

  if (loading) {
    return (
      <div className="centered">
        <p>Loading session…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!account) {
    return (
      <div className="centered">
        <div className="banner error">{error || 'Account not linked.'}</div>
        <a href="/sign-in">Back to sign in</a>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route
        path="/app"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/app/admin/rbac"
        element={
          <Protected>
            <AdminRbacPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
