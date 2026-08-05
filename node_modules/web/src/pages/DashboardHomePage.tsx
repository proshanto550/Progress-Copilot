import { useAuth } from '../context/AuthContext';

/**
 * DashboardPage — landing page inside the private layout.
 * Real widgets (Today's Tasks, Goal Progress, AI Suggestions, etc.)
 * ship in later phases. For now we show a friendly welcome that uses
 * the live `user` payload from /api/auth/me so we can confirm end-to-end.
 */
export function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/30">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 text-white font-black">
          {(user?.fullName || 'P').charAt(0).toUpperCase()}
        </span>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}.
          </h2>
          <p className="text-sm text-gray-400">
            Here's your progress at a glance.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Daily streak" value={user?.dailyStreak ?? 0} tone="orange" />
        <Stat label="Points" value={user?.points ?? 0} tone="yellow" />
        <Stat label="Theme" value={user?.theme === 'light' ? 'Light' : 'Dark'} tone="purple" />
        <Stat label="Member since" value={user?.createdAt ? new Date(user.createdAt).getFullYear() : '—'} tone="slate" />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: 'orange' | 'yellow' | 'purple' | 'slate';
}) {
  const tones: Record<typeof tone, string> = {
    orange: 'from-orange-500/20 to-rose-500/10 ring-orange-400/30 text-orange-300',
    yellow: 'from-yellow-500/20 to-amber-500/10 ring-yellow-400/30 text-yellow-300',
    purple: 'from-purple-500/20 to-fuchsia-500/10 ring-purple-400/30 text-purple-300',
    slate: 'from-slate-500/20 to-slate-700/10 ring-slate-400/30 text-slate-200',
  } as const;
  return (
    <div
      className={
        'rounded-xl bg-gradient-to-br ring-1 p-4 ' + tones[tone]
      }
    >
      <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
        {label}
      </div>
      <div className="mt-1 text-xl font-extrabold tabular-nums">{value}</div>
    </div>
  );
}