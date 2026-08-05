import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-darkBg text-white px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black">Welcome, {user?.fullName} 👋</h1>
        <p className="text-gray-400 mt-2">Your dashboard will live here. Full layout ships in the next phase.</p>
        <button onClick={onLogout} className="mt-6 px-5 py-2 rounded-full border border-white/10 hover:bg-white/5 text-sm">
          Logout
        </button>
      </div>
    </div>
  );
}