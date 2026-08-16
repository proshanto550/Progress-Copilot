import { MyProgressScreen } from './MyProgressScreen';
import { AIAssistantPage as RealAIAssistantPage } from './AIAssistantPage';
import { default as RealProfilePage } from './ProfilePage';
import { NotesPage as RealNotesPage } from './NotesPage';
import { CoursesPage as RealCoursesPage } from './CoursesPage';
import { ProjectsPage as RealProjectsPage } from './ProjectsPage';
import { LifePathPage as RealLifePathPage } from './LifePathPage';
import { ReportsPage as RealReportsPage } from './ReportsPage';
import { RemindersPage as RealRemindersPage } from './RemindersPage';
import { SettingsPage as RealSettingsPage } from './SettingsPage';

/**
 * DashboardPlaceholderPage — the public re-export module for routes.
 * Real pages are re-exported from their own modules.
 */
export { MyProgressScreen as MyProgressPage };
export { RealAIAssistantPage as AIAssistantPage };
export { RealProfilePage as ProfilePage };
export { RealNotesPage as NotesPage };
export { RealCoursesPage as CoursesPage };
export { RealProjectsPage as ProjectsPage };
export { RealLifePathPage as LifePathPage };
export { RealReportsPage as ReportsPage };
export { RealRemindersPage as RemindersPage };
export { RealSettingsPage as SettingsPage };