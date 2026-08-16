import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Edit3, Trash2, BookOpen, ExternalLink, X, Save, Loader2, GraduationCap } from 'lucide-react';
import { useCourses } from '../modules/courses/useCourses';
import { useProfile } from '../modules/profile/useProfile';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../modules/courses/coursesApi';

const SEMESTER_OPTIONS = [
  '1st Semester',
  '2nd Semester',
  '3rd Semester',
  '4th Semester',
  '5th Semester',
  '6th Semester',
  '7th Semester',
  '8th Semester',
  'Other / Self Study',
];

export function CoursesPage() {
  const { user } = useAuth();
  const { data: profileData } = useProfile();
  const { courses, loading, error, createCourse, updateCourse, deleteCourse, saving } = useCourses();

  const [activeModal, setActiveModal] = useState<{ mode: 'create' | 'edit'; course?: Course } | null>(null);
  const [title, setTitle] = useState('');
  const [resourceLink, setResourceLink] = useState('');
  const [semester, setSemester] = useState('1st Semester');

  // Education summary from profile
  const edu = profileData?.educations?.[0];
  const eduSummary = useMemo(() => {
    if (!edu) return 'No education info added yet. Update profile to see your degree here.';
    const parts = [];
    if (edu.examDegreeTitle || edu.educationLevel) {
      parts.push(edu.examDegreeTitle || edu.educationLevel);
    }
    if (edu.institutionName) {
      parts.push(`at ${edu.institutionName}`);
    }
    if (edu.currentYear) {
      parts.push(`(${edu.currentYear})`);
    } else if (edu.passingYear) {
      parts.push(`(Passing: ${edu.passingYear})`);
    }
    return parts.join(' ');
  }, [edu]);

  const fullName = profileData?.profile.fullName || user?.fullName || 'Student';
  const avatar = profileData?.profile.avatar || user?.avatar;

  // Group courses by semester
  const groupedCourses = useMemo(() => {
    const map = new Map<string, Course[]>();
    courses.forEach((c) => {
      const sem = c.semester || 'Other / Self Study';
      if (!map.has(sem)) map.set(sem, []);
      map.get(sem)!.push(c);
    });
    return map;
  }, [courses]);

  const openCreateModal = (defaultSem?: string) => {
    setTitle('');
    setResourceLink('');
    setSemester(defaultSem || '1st Semester');
    setActiveModal({ mode: 'create' });
  };

  const openEditModal = (course: Course) => {
    setTitle(course.title);
    setResourceLink(course.resourceLink);
    setSemester(course.semester || '1st Semester');
    setActiveModal({ mode: 'edit', course });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !resourceLink.trim()) return;

    let link = resourceLink.trim();
    if (!/^https?:\/\//i.test(link)) {
      link = 'https://' + link;
    }

    if (activeModal?.mode === 'create') {
      await createCourse({ title: title.trim(), resourceLink: link, semester });
    } else if (activeModal?.mode === 'edit' && activeModal.course) {
      await updateCourse({
        id: activeModal.course.id,
        data: { title: title.trim(), resourceLink: link, semester },
      });
    }
    setActiveModal(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this course card?')) {
      await deleteCourse(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Profile & Education Header ─── */}
      <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 sm:p-6 shadow-md dark:shadow-glow-purple">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {avatar ? (
              <img
                src={avatar}
                alt={fullName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-purple-400 dark:border-cardBorder shadow-md shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-600 to-sky-500 grid place-items-center text-white font-bold text-2xl shadow-md shrink-0">
                {fullName[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                {fullName}
              </h1>
              <p className="text-xs sm:text-sm text-purple-700 dark:text-fuchsia-300 font-semibold mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <GraduationCap size={18} /> {eduSummary}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-bold tracking-wide shadow-md hover:brightness-110 active:scale-[0.98] transition inline-flex items-center gap-2 shrink-0"
          >
            <Plus size={18} /> Add New Course
          </button>
        </div>
      </div>

      {/* Loading & Error */}
      {loading && (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-cardBorder bg-rose-50 dark:bg-cardBg/80 p-6 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && courses.length === 0 && (
        <div className="rounded-2xl border border-dashed border-purple-300 dark:border-purple-500/30 p-12 text-center bg-slate-50/50 dark:bg-cardBg/40">
          <BookOpen className="mx-auto text-purple-400 dark:text-purple-400/50 mb-3" size={42} />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Courses Added Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-violet-300/70 mt-1 max-w-sm mx-auto">
            Click "Add New Course" above to organize your learning links by semester.
          </p>
        </div>
      )}

      {/* Semesters & Courses List */}
      {!loading && groupedCourses.size > 0 && (
        <div className="space-y-8">
          {Array.from(groupedCourses.entries()).map(([semTitle, semesterCourses]) => (
            <section key={semTitle} className="space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200/70 dark:border-cardBorder/50 pb-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="text-purple-600 dark:text-fuchsia-400" size={20} />
                  {semTitle}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-violet-300 font-semibold border border-purple-500/20">
                    {semesterCourses.length} {semesterCourses.length === 1 ? 'Course' : 'Courses'}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => openCreateModal(semTitle)}
                  className="text-xs text-purple-700 dark:text-fuchsia-300 hover:underline font-semibold flex items-center gap-1"
                >
                  + Add to {semTitle}
                </button>
              </div>

              <div className="space-y-3">
                {semesterCourses.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-violet-300/70 truncate mt-0.5">
                        {c.resourceLink}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <a
                        href={c.resourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 text-purple-700 dark:text-fuchsia-300 text-xs font-bold transition inline-flex items-center gap-1.5 border border-purple-500/20"
                      >
                        Resource Link <ExternalLink size={13} />
                      </a>
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-violet-300 hover:text-purple-600 dark:hover:text-white hover:bg-purple-500/10 transition"
                        title="Edit Course"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-violet-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete Course"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-[#181033] dark:via-[#120a27] dark:to-[#0b0718] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-purple-200/60 dark:border-cardBorder/40">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="text-purple-600 dark:text-fuchsia-400" size={20} />
                  {activeModal.mode === 'create' ? 'Add New Course' : 'Edit Course'}
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-violet-300 hover:text-slate-900 dark:hover:text-white hover:bg-purple-500/10 dark:hover:bg-white/10 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-violet-300/80 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Data Structures and Algorithms"
                    className="w-full rounded-xl bg-slate-100/90 dark:bg-[#0c0a17] border border-purple-200 dark:border-cardBorder px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-violet-300/40 focus:border-purple-500 focus:outline-none transition text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-violet-300/80 mb-1">
                    Resource Link (URL)
                  </label>
                  <input
                    type="text"
                    required
                    value={resourceLink}
                    onChange={(e) => setResourceLink(e.target.value)}
                    placeholder="https://drive.google.com/... or course website"
                    className="w-full rounded-xl bg-slate-100/90 dark:bg-[#0c0a17] border border-purple-200 dark:border-cardBorder px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-violet-300/40 focus:border-purple-500 focus:outline-none transition text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-violet-300/80 mb-1">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full rounded-xl bg-slate-100/90 dark:bg-[#0c0a17] border border-purple-200 dark:border-cardBorder px-4 py-2.5 text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none transition text-sm font-medium"
                  >
                    {SEMESTER_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-200/60 dark:border-cardBorder/40">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl border border-purple-300 dark:border-cardBorder text-slate-700 dark:text-violet-200 text-sm font-semibold hover:bg-purple-500/10 dark:hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !title.trim() || !resourceLink.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-bold tracking-wide shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-50 inline-flex items-center gap-2 transition"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    <Save size={16} /> Save Course
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
