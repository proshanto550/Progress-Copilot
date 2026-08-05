import { useEffect, useRef, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * ProfileDropdown — glassmorphism menu anchored under the navbar avatar.
 *
 * Sections (matches Phase 3 spec):
 *   • Header: rounded avatar + fullName + email
 *   • "View Profile" button
 *   • Theme toggle (Light/Dark text + sun/moon icon)
 *   • Links: AI Assistant, Settings
 *   • Footer: Logout
 *
 * Click-outside + Escape closes the menu; the parent passes `onClose`.
 */
export function ProfileDropdown({
  onClose,
  ignoreRef,
}: {
  onClose: () => void;
  /** Clicking on this element should NOT close the dropdown — we let the
   *  element's own onClick toggle the open state instead. Used for the
   *  avatar button so a second click closes the menu instead of reopening. */
  ignoreRef?: RefObject<HTMLElement>;
}) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const target = e.target as Node;
      // Click is "outside" the menu — unless it's on the trigger that owns
      // the open state, in which case the trigger handles its own toggle.
      if (panelRef.current.contains(target)) return;
      if (ignoreRef?.current?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, ignoreRef]);

  const fullName = user?.fullName || 'Progress user';
  const email = user?.email || '';
  const avatar = user?.avatar || '';
  const initial = fullName.trim().charAt(0).toUpperCase();

  const go = (path: string) => () => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    onClose();
    try {
      await logout();
    } finally {
      // Per spec: after logout the user is gone, so the session theme
      // preference should fall back to the default (dark). This wipes the
      // prior user's stored theme so the next login lands on a clean slate.
      setTheme('dark');
      // Per spec: landing page (`/`) is the post-logout destination —
      // not /login — so the guest UI (Login + Get Demo) renders immediately.
      navigate('/', { replace: true });
    }
  };

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-label="Profile menu"
      className={[
        // Outer shell — owns the gradient border (padded, background clips to padding).
        'absolute right-4 top-[calc(100%+10px)] w-[19rem] rounded-2xl z-50',
        'p-[1.5px]',
        // Gradient ring: solid purple → translucent purple (horizontal).
        'bg-gradient-to-r from-purple-600 to-purple-500/30',
        // Soft drop shadow so the gradient ring reads as floating glass.
        'shadow-[0_30px_80px_-12px_rgba(76,29,149,0.45),0_8px_24px_-6px_rgba(0,0,0,0.35)]',
        // Entry animation.
        'animate-in fade-in zoom-in-95 duration-200',
      ].join(' ')}
      style={{ transformOrigin: 'top right' }}
    >
      {/* Inner panel — receives the glass effect + bg gradient + blur(140px). */}
      <div
        className={[
          'relative w-full h-full rounded-[14px] overflow-hidden',
          // Soft gradient inside the panel so the glass has a tint of color
          // without painting a solid bg (still semi-transparent for blur).
          'bg-[linear-gradient(180deg,rgba(250,250,250,0.22)_0%,rgba(255,255,255,0.06)_100%)]',
          'dark:bg-[linear-gradient(180deg,rgba(250,250,250,0.10)_0%,rgba(250,250,250,0.02)_100%)]',
          'text-slate-900 dark:text-white',
          // Tailwind utility in addition to inline style for older WebKit.
          'backdrop-blur-3xl backdrop-saturate-200',
          // Top sheen — subtle white gradient simulates light catching glass.
          'after:content-[""] after:absolute after:inset-0 after:rounded-[14px] after:pointer-events-none',
          'after:bg-[linear-gradient(180deg,rgba(250,250,250,0.35)_0%,rgba(250,250,250,0)_40%)]',
        ].join(' ')}
        style={{
          backdropFilter: 'blur(140px) saturate(200%)',
          WebkitBackdropFilter: 'blur(140px) saturate(200%)',
        }}
      >
        {/* ───── Header ───── */}
        <div className="relative px-5 pt-5 pb-4">
          <div className="flex flex-col items-center text-center">
            <div className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden ring-[3px] ring-white/70 dark:ring-white/25 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)]">
              {avatar ? (
                <img src={avatar} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 text-white font-extrabold text-xl">
                  {initial}
                </div>
              )}
            </div>
            <div className="mt-3 min-w-0">
              <div className="font-extrabold text-[15px] text-slate-900 dark:text-white truncate">
                {fullName}
              </div>
              <div className="text-xs text-slate-700 dark:text-white/75 truncate mt-0.5">
                {email}
              </div>
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={go('/dashboard/profile')}
              className="mt-4 w-full h-10 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white text-sm font-bold tracking-wide shadow-[0_8px_20px_-4px_rgba(168,85,247,0.6)] hover:brightness-110 active:scale-[0.98] transition"
            >
              View Profile
            </button>
          </div>
        </div>

        <Divider />

        {/* ───── Theme toggle ───── */}
        <div className="px-2 py-1.5">
          <button
            type="button"
            role="menuitemradio"
            aria-checked={theme === 'dark'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-800 dark:text-white/90 hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span
                className={[
                  'inline-flex h-7 w-7 items-center justify-center rounded-full',
                  'bg-white/40 dark:bg-white/15 text-slate-800 dark:text-white',
                ].join(' ')}
              >
                {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
              </span>
              <span className="font-semibold">
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </span>
            </span>
            <span
              className={[
                'relative inline-flex h-6 w-11 rounded-full transition-colors',
                theme === 'dark' ? 'bg-fuchsia-500' : 'bg-slate-400/60',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform',
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
              />
            </span>
          </button>
        </div>

        <Divider />

        {/* ───── Links ───── */}
        <div className="px-2 py-1.5">
          <MenuItem onClick={go('/dashboard')} icon={<HomeIcon />}>
            Dashboard
          </MenuItem>
          <MenuItem onClick={go('/dashboard/ai-assistant')} icon={<SparkIcon />}>
            Edith AI Assistant
          </MenuItem>
          <MenuItem onClick={go('/dashboard/settings')} icon={<GearIcon />}>
            Settings
          </MenuItem>
        </div>

        <Divider />

        {/* ───── Logout ───── */}
        <div className="px-2 py-1.5 pb-2">
          <MenuItem
            onClick={handleLogout}
            icon={<LogoutIcon />}
            tone="danger"
          >
            Logout
          </MenuItem>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────── Local helpers ────────────────────── */

function Divider() {
  return <hr className="mx-4 border-slate-900/15 dark:border-white/20" />;
}

function MenuItem({
  children,
  onClick,
  icon,
  tone = 'default',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-rose-700 hover:bg-rose-500/15 hover:text-rose-800 dark:text-pink-200 dark:hover:bg-pink-500/20 dark:hover:text-white'
      : 'text-slate-800 hover:bg-white/40 hover:text-slate-900 dark:text-white/90 dark:hover:bg-white/10 dark:hover:text-white';
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ' +
        toneClass
      }
    >
      {icon && (
        <span
          aria-hidden
          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/40 dark:bg-white/10 text-slate-800 dark:text-white"
        >
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </button>
  );
}

/* ────────────────────── Icons ────────────────────── */

function svg(d: string, size = 16) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ height: size, width: size }}
    >
      {d.split('|').map((seg, i) => (
        <path key={i} d={seg} />
      ))}
    </svg>
  );
}

const HomeIcon = () => svg('M3 11.5 12 4l9 7.5|M5 10v10h14V10', 15);
const SparkIcon = () =>
  svg(
    'M12 3v4|M12 17v4|M5 12H1|M23 12h-4|M6.34 6.34 4.22 4.22|M19.78 19.78l-2.12-2.12|M6.34 17.66l-2.12 2.12|M19.78 4.22l-2.12 2.12',
    15,
  );
const GearIcon = () =>
  svg(
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z',
    15,
  );
const LogoutIcon = () =>
  svg('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9', 15);
const SunIcon = () =>
  svg(
    'M12 4V2|M12 22v-2|M4 12H2|M22 12h-2|M5.6 5.6 4.2 4.2|M19.8 19.8l-1.4-1.4|M5.6 18.4l-1.4 1.4|M19.8 4.2l-1.4 1.4|M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
    15,
  );
const MoonIcon = () =>
  svg('M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z', 15);