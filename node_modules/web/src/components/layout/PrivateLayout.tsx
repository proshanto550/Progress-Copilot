import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

/**
 * PrivateLayout — chrome for every authenticated route.
 *
 *  ┌──────────┬──────────────────────────────┐
 *  │ Sidebar  │  TopNavbar                    │
 *  │ (fixed)  ├──────────────────────────────┤
 *  │          │  <Outlet />  (page content)   │
 *  └──────────┴──────────────────────────────┘
 *
 * The sidebar rail is fixed on md+ and reports its collapsed state up to
 * this layout, so the main column's left padding can animate in lockstep
 * with the rail's width. The transition duration is shared (`duration-300`)
 * so the navbar never appears to slide past the sidebar boundary.
 *
 * ThemeProvider is mounted at the App root (App.tsx) so it covers the
 * landing/auth pages too — no flicker, and any nested component can
 * call useTheme() freely.
 */
export function PrivateLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0b0717] dark:text-white">
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />

      {/* Main column offset to the sidebar's width. The padding-left
          transitions to match the rail's width transition. */}
      <div
        className={
          'md:transition-[padding] md:duration-300 md:ease-[cubic-bezier(0.22,1,0.36,1)] ' +
          'min-h-screen flex flex-col ' +
          (collapsed ? 'md:pl-[78px]' : 'md:pl-64')
        }
      >
        <TopNavbar />

        <main className="flex-1 px-4 sm:px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}