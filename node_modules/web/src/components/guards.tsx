import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PublicOnly({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/dashboard" replace state={{ from: location }} />;
  return children;
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  // Per spec: unauthenticated users should land on the landing page (`/`)
  // — not the login page — so the auth-aware header (Login + Get Demo)
  // can render immediately. The user can still navigate to /login from
  // the header if they want to sign in.
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#08060d] text-white">
      <div className="flex items-center gap-3 text-sm text-white/70">
        <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
        Loading Progress Copilot…
      </div>
    </div>
  );
}