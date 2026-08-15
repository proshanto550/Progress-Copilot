import { DashboardPlaceholder } from '../components/layout/DashboardPlaceholder';
import { MyProgressScreen } from './MyProgressScreen';
import { AIAssistantPage as RealAIAssistantPage } from './AIAssistantPage';
import { default as RealProfilePage } from './ProfilePage';

/**
 * DashboardPlaceholderPage — the public re-export module for every
 * "to be filled in later" route. Real pages are re-exported from their
 * own files; the rest remain placeholders until their phase.
 */
export { MyProgressScreen as MyProgressPage };
export { RealAIAssistantPage as AIAssistantPage };
export { RealProfilePage as ProfilePage };

export function RemindersPage() {
  return (
    <DashboardPlaceholder
      title="Reminders"
      subtitle="Smart reminders and gentle nudges."
    />
  );
}

export function NotesPage() {
  return (
    <DashboardPlaceholder
      title="Notes"
      subtitle="Quick capture and long-form notes."
    />
  );
}

export function CoursesPage() {
  return (
    <DashboardPlaceholder
      title="Courses"
      subtitle="Learning tracks and progress."
    />
  );
}

export function ProjectsPage() {
  return (
    <DashboardPlaceholder
      title="Projects"
      subtitle="Multi-target bodies of work."
    />
  );
}

export function LifePathPage() {
  return (
    <DashboardPlaceholder
      title="Life Path"
      subtitle="Your long-term timeline and milestones."
    />
  );
}

export function ReportsPage() {
  return (
    <DashboardPlaceholder
      title="Reports"
      subtitle="Charts and insights about your progress."
    />
  );
}

export function SettingsPage() {
  return (
    <DashboardPlaceholder
      title="Settings"
      subtitle="Profile, theme, notifications, account."
    />
  );
}

// ProfilePage re-exported above from ./ProfilePage.