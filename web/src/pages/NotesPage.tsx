import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit3,
  Trash2,
  FileText,
  Save,
  Loader2,
  ArrowLeft,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { useNotes } from '../modules/notes/useNotes';
import type { Note } from '../modules/notes/notesApi';
import { useToast } from '../context/ToastContext';

export function NotesPage() {
  const { notes, loading, error, createNote, updateNote, deleteNote, saving } = useNotes();
  const { addToast } = useToast();

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [pageMode, setPageMode] = useState<'list' | 'create' | 'view' | 'edit'>('list');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const openCreate = () => {
    setTitle('');
    setContent('');
    setSelectedNote(null);
    setPageMode('create');
  };

  const openReader = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setPageMode('view');
  };

  const openEditor = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setPageMode('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (pageMode === 'create') {
      const created = await createNote({ title: title.trim(), content: content.trim() });
      addToast({
        type: 'success',
        title: 'Note Created',
        message: `"${title}" has been saved.`,
      });
      setSelectedNote(created);
      setPageMode('view');
    } else if (pageMode === 'edit' && selectedNote) {
      const updated = await updateNote({
        id: selectedNote.id,
        data: { title: title.trim(), content: content.trim() },
      });
      addToast({
        type: 'success',
        title: 'Note Updated',
        message: 'Changes saved successfully.',
      });
      setSelectedNote(updated);
      setPageMode('view');
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(id);
      addToast({
        type: 'info',
        title: 'Note Deleted',
        message: 'The note was removed.',
      });
      setPageMode('list');
      setSelectedNote(null);
    }
  };

  /* ──────────────── Full Sub-page Reader View ──────────────── */
  if (pageMode === 'view' && selectedNote) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-purple-200/80 dark:border-cardBorder">
          <button
            type="button"
            onClick={() => setPageMode('list')}
            className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-fuchsia-300 font-bold text-sm transition inline-flex items-center gap-2 border border-purple-500/20"
          >
            <ArrowLeft size={16} /> Back to Notes
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openEditor(selectedNote)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition inline-flex items-center gap-2"
            >
              <Edit3 size={15} /> Edit Note
            </button>
            <button
              type="button"
              onClick={() => handleDelete(selectedNote.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition"
              title="Delete Note"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <article className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-6 sm:p-10 shadow-md">
          <header className="mb-8 pb-6 border-b border-purple-200/60 dark:border-cardBorder/50">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-fuchsia-300 font-semibold text-xs mb-3 border border-purple-500/20">
              <BookOpen size={13} /> Reader Mode
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              {selectedNote.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-violet-300/70 mt-3 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} /> Created {new Date(selectedNote.createdAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <span>Updated {new Date(selectedNote.updatedAt || selectedNote.createdAt).toLocaleDateString()}</span>
            </div>
          </header>

          <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-violet-100 leading-relaxed sm:text-lg whitespace-pre-wrap font-normal">
            {selectedNote.content || (
              <p className="italic text-slate-400 dark:text-violet-400/50">This note has no written content yet.</p>
            )}
          </div>
        </article>
      </motion.div>
    );
  }

  /* ──────────────── Full Sub-page Editor & Creator View ──────────────── */
  if (pageMode === 'create' || pageMode === 'edit') {
    const isCreating = pageMode === 'create';

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-purple-200/80 dark:border-cardBorder">
          <button
            type="button"
            onClick={() => setPageMode(selectedNote ? 'view' : 'list')}
            className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-fuchsia-300 font-bold text-sm transition inline-flex items-center gap-2 border border-purple-500/20"
          >
            <ArrowLeft size={16} /> {selectedNote ? 'Cancel & View' : 'Back to Notes'}
          </button>

          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-fuchsia-400">
            {isCreating ? 'Creating New Note' : 'Editing Note'}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-6 sm:p-8 shadow-md space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-violet-300/80 mb-2">
                Note Title
              </label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your note a meaningful title..."
                className="w-full rounded-2xl bg-white/90 dark:bg-[#0c0a17] border border-purple-300 dark:border-cardBorder px-5 py-3.5 text-lg sm:text-xl font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-violet-300/40 focus:border-purple-500 focus:outline-none transition shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-violet-300/80 mb-2">
                Note Content
              </label>
              <textarea
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your study notes, code summaries, guides, or thoughts here in full detail..."
                className="w-full rounded-2xl bg-white/90 dark:bg-[#0c0a17] border border-purple-300 dark:border-cardBorder p-5 text-base sm:text-lg leading-relaxed text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-violet-300/40 focus:border-purple-500 focus:outline-none transition shadow-inner"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-200/60 dark:border-cardBorder/40">
              <button
                type="button"
                onClick={() => setPageMode(selectedNote ? 'view' : 'list')}
                className="px-5 py-2.5 rounded-xl border border-purple-300 dark:border-cardBorder text-slate-700 dark:text-violet-200 text-sm font-semibold hover:bg-purple-500/10 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-bold tracking-wide shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-50 inline-flex items-center gap-2 transition"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                <Save size={16} /> {isCreating ? 'Publish Note' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    );
  }

  /* ──────────────── Grid List View ──────────────── */
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 sm:p-6 shadow-md dark:shadow-glow-purple">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-purple-600 dark:text-fuchsia-400" size={26} /> My Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-violet-300/80 mt-1">
            Capture quick thoughts, study guides, and full documentation notes.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
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
            Click "+ New Note" above to open the full page note editor.
          </p>
        </div>
      )}

      {/* Notes Grid */}
      {!loading && notes.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => openReader(note)}
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
                        openEditor(note);
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
                <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
                <span className="text-purple-600 dark:text-fuchsia-400 font-bold group-hover:underline inline-flex items-center gap-1">
                  Read Note →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
