import { useLocation } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { titleForPath } from './navItems';
import { ProfileDropdown } from './ProfileDropdown';

/**
 * TopNavbar — header bar for the private layout.
 *
 * Left: dynamic page title (derived from the active sidebar route).
 * Right: daily-streak chip, points chip, notifications bell,
 *        rounded avatar that opens the ProfileDropdown.
 */
export function TopNavbar() {
  const { user } = useAuth();
  const location = useLocation();
  const title = titleForPath(location.pathname);

  const [profileOpen, setProfileOpen] = useState(false);
  const [bellPulse] = useState(true); // visual: dot stays on once
  const avatarBtnRef = useRef<HTMLButtonElement>(null);

  const streak = user?.dailyStreak ?? 0;
  const points = user?.points ?? 0;
  const avatar = user?.avatar || '';
  const initial = (user?.fullName || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <header
      className={
        'sticky top-0 z-20 h-16 border-b border-black/10 dark:border-white/10 ' +
        'bg-white/70 dark:bg-[#0b0717]/70 backdrop-blur-xl ' +
        'text-gray-900 dark:text-white ' +
        'flex items-center justify-between gap-4 px-4 sm:px-6 ' +
        'transition-colors duration-300'
      }
    >
      {/* ────── Left: page title ────── */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-lg sm:text-xl font-extrabold tracking-tight truncate text-gray-900 dark:text-white">
          {title}
        </h1>
      </div>

      {/* ────── Right: streak • points • bell • avatar ────── */}
      <div className="flex items-center gap-2 sm:gap-3">
        <StatChip
          icon={<FireIcon />}
          value={streak}
          tone="orange"
          label="daily streak"
        />
        <StatChip
          icon={<StarIcon />}
          value={points}
          tone="yellow"
          label="points"
        />

        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <BellIcon />
          {bellPulse && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0b0717]" />
          )}
        </button>

        {/* Avatar trigger — clicking it again toggles the dropdown closed. */}
        <button
          ref={avatarBtnRef}
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          aria-label="Open profile menu"
          className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-black/10 dark:ring-white/10 hover:ring-purple-500/60 transition-all"
        >
          {avatar ? (
            <img
              src={avatar}
              alt={user?.fullName || 'avatar'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 text-white font-bold">
              {initial}
            </div>
          )}
        </button>

        {profileOpen && (
          <ProfileDropdown
            onClose={() => setProfileOpen(false)}
            ignoreRef={avatarBtnRef}
          />
        )}
      </div>
    </header>
  );
}

/* ────────────────────── Stat chip ────────────────────── */

function StatChip({
  icon,
  value,
  label,
  tone,
}: {
  icon: JSX.Element;
  value: number;
  label: string;
  tone: 'orange' | 'yellow';
}) {
  const toneClass =
    tone === 'orange'
      ? 'from-orange-500/20 to-rose-500/10 text-orange-700 dark:text-orange-300 ring-orange-500/30'
      : 'from-yellow-500/20 to-amber-500/10 text-yellow-700 dark:text-yellow-300 ring-yellow-500/30';

  return (
    <div
      title={`${value} ${label}`}
      className={
        'hidden sm:inline-flex items-center gap-2 px-3 h-10 rounded-full ' +
        'bg-gradient-to-r ring-1 ' +
        toneClass
      }
    >
      <span aria-hidden className="h-5 w-5 flex items-center justify-center">
        {icon}
      </span>
      <span className="font-bold text-sm tabular-nums">{value}</span>
    </div>
  );
}

/* ────────────────────── Icons ────────────────────── */

function FireIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M12.5 1.5c.4 1.7-.4 3.4-1.7 4.6-1.4 1.2-3.2 2-3.6 4.1-.4 2.1.9 4.2 2.8 5.1-1.2-.5-2-1.6-2.2-2.9 1.6 1 3.7.8 5-.6 1.3-1.4 1.5-3.5.4-5.1.7.3 1.6.9 2.4 1.8C18.4 11.2 19 14 18 16.3c-1 2.3-3.4 3.7-5.9 3.7-3.5 0-6.4-2.8-6.5-6.3-.1-3.5 2-6.2 4.5-7.8 1.5-1 2.2-2.6 2.4-4.4Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M12 2.5l2.95 6.0 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.1 1.13-6.58L2.45 9.46l6.6-.96L12 2.5Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}