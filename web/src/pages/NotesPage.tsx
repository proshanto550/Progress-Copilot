import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Edit3, Trash2, FileText, X, Save, Loader2 } from 'lucide-react';
import { useNotes } from '../modules/notes/useNotes';
import type { Note } from '../modules/notes/notesApi';

export function NotesPage() {
  const { notes, loading, error, createNote, updateNote, deleteNote, saving } = useNotes();
  const [activeModal, setActiveModal] = useState<{ mode: 'create' | 'edit'; note?: Note } | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const openCreateModal = () => {
    setTitle('');
    setContent('');
    setActiveModal({ mode: 'create' });
  };

  const openEditModal = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setActiveModal({ mode: 'edit', note });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (activeModal?.mode === 'create') {
      await createNote({ title: title.trim(), content: content.trim() });
    } else if (activeModal?.mode === 'edit' && activeModal.note) {
      await updateNote({
        id: activeModal.note.id,
        data: { title: title.trim(), content: content.trim() },
      });
    }
    setActiveModal(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 sm:p-6 shadow-md dark:shadow-glow-purple">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-purple-600 dark:text-fuchsia-400" size={26} /> My Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-violet-300/80 mt-1">
            Capture quick thoughts, study guides, and important snippets.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-bold tracking-wide shadow-md hover:brightness-110 active:scale-[0.98] transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={18} /> New Note
        </button>
      </div>

      {/* Loading & Error State */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-cardBorder bg-rose-50 dark:bg-cardBg/80 p-6 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && notes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-purple-300 dark:border-purple-500/30 p-12 text-center bg-slate-50/50 dark:bg-cardBg/40">
          <FileText className="mx-auto text-purple-400 dark:text-purple-400/50 mb-3" size={42} />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Notes Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-violet-300/70 mt-1 max-w-sm mx-auto">
            Click "+ New Note" above to start capturing your ideas and study guides.
          </p>
        </div>
      )}

      {/* Notes Grid */}
      {!loading && notes.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => openEditModal(note)}
              className="group rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 shadow-sm hover:shadow-md dark:hover:border-purple-500/50 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-fuchsia-300 transition">
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(note);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-violet-300 hover:text-purple-600 dark:hover:text-white hover:bg-purple-500/10 transition"
                      title="Edit Note"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(note.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-violet-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete Note"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-violet-200/80 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                  {note.content || <span className="italic text-slate-400 dark:text-violet-400/50">Empty content...</span>}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-200/60 dark:border-cardBorder/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-violet-300/60 font-medium">
                <span>Updated {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
                <span className="text-purple-600 dark:text-fuchsia-400 font-bold group-hover:underline">Read / Edit →</span>
              </div>
            </div>
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
              className="w-full max-w-xl rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-[#181033] dark:via-[#120a27] dark:to-[#0b0718] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-purple-200/60 dark:border-cardBorder/40">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="text-purple-600 dark:text-fuchsia-400" size={20} />
                  {activeModal.mode === 'create' ? 'Create New Note' : 'Edit Note'}
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
                    Note Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter note title..."
                    className="w-full rounded-xl bg-slate-100/90 dark:bg-[#0c0a17] border border-purple-200 dark:border-cardBorder px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-violet-300/40 focus:border-purple-500 focus:outline-none transition text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-violet-300/80 mb-1">
                    Content
                  </label>
                  <textarea
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your detailed note here..."
                    className="w-full rounded-xl bg-slate-100/90 dark:bg-[#0c0a17] border border-purple-200 dark:border-cardBorder px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-violet-300/40 focus:border-purple-500 focus:outline-none transition text-sm font-medium leading-relaxed"
                  />
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
                    disabled={saving || !title.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-bold tracking-wide shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-50 inline-flex items-center gap-2 transition"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    <Save size={16} /> Save Note
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
