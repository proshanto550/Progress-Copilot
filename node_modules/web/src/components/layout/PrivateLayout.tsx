import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { ReminderAlertModal } from './ReminderAlertModal';

export function PrivateLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0b0717] dark:text-white">
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />

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
        <ReminderAlertModal />
      </div>
    </div>
  );
}
