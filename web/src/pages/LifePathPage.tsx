import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Compass, CheckCircle2, Clock, Flag, Target as TargetIcon, Edit3, Save, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export function LifePathPage() {
  const queryClient = useQueryClient();
  const [editingFutureGoal, setEditingFutureGoal] = useState(false);
  const [futureGoalTitle, setFutureGoalTitle] = useState('');

  // Fetch targets & future goal
  const { data: targetsData, isLoading: targetsLoading } = useQuery({
    queryKey: ['targets'],
    queryFn: async () => {
      const { data } = await api.get('/api/targets');
      return data.targets || [];
    },
  });

  const { data: futureGoalData, isLoading: futureGoalLoading } = useQuery({
    queryKey: ['futureGoal'],
    queryFn: async () => {
      const { data } = await api.get('/api/future-goal');
      return data.futureGoal || { title: 'My Ultimate Career & Life Milestone' };
    },
  });

  const futureGoalMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data } = await api.post('/api/future-goal', { title });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['futureGoal'] });
      setEditingFutureGoal(false);
    },
  });

  const handleFutureGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!futureGoalTitle.trim()) return;
    futureGoalMutation.mutate(futureGoalTitle.trim());
  };

  const targets = targetsData ?? [];
  const futureGoal = futureGoalData;

  const isLoading = targetsLoading || futureGoalLoading;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 sm:p-6 shadow-md dark:shadow-glow-purple">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="text-purple-600 dark:text-fuchsia-400" size={26} /> Life Path & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-violet-300/80 mt-1">
            Vertical journey timeline mapping your target progression to your ultimate Future Goal.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-6 py-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="relative py-4">
          {/* Vertical Center Connector Line */}
          <div className="absolute left-6 sm:left-1/2 top-8 bottom-8 w-1 bg-gradient-to-b from-purple-500 via-indigo-500 to-fuchsia-500 -translate-x-1/2 rounded-full opacity-40 dark:opacity-60" />

          {/* Timeline Nodes */}
          <div className="space-y-10 relative">
            {targets.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/60 dark:bg-cardBg/40 rounded-2xl border border-dashed border-purple-300 dark:border-purple-500/30 p-6">
                <TargetIcon className="mx-auto text-purple-400 mb-2" size={32} />
                <p className="text-sm font-semibold text-slate-700 dark:text-white">No active targets set in Target Feature yet.</p>
                <p className="text-xs text-slate-500 dark:text-violet-300/70 mt-1">Add targets in the Target section to see them automatically line up on your Life Path.</p>
              </div>
            ) : (
              targets.map((target: any, index: number) => {
                const isDone = target.status === 'COMPLETED';
                const isLeft = index % 2 === 0;

                return (
                  <motion.div
                    key={target.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`flex flex-col sm:flex-row items-center gap-6 ${
                      isLeft ? 'sm:flex-row-reverse' : ''
                    }`}
                  >
                    {/* Content Card */}
                    <div className="w-full sm:w-[calc(50%-2rem)] pl-12 sm:pl-0">
                      <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 shadow-md hover:shadow-lg transition">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-fuchsia-400">
                            Target {index + 1}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              target.priority === 'HIGH'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : target.priority === 'MEDIUM'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {target.priority}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                          {target.title}
                        </h3>

                        {target.description && (
                          <p className="text-xs text-slate-600 dark:text-violet-200/80 mb-3 line-clamp-2">
                            {target.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-purple-200/60 dark:border-cardBorder/40">
                          <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-violet-300">
                            {isDone ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 size={14} /> Completed
                              </span>
                            ) : (
                              <span className="text-purple-600 dark:text-fuchsia-400 flex items-center gap-1">
                                <Clock size={14} /> In Progress
                              </span>
                            )}
                          </span>

                          {target.deadline && (
                            <span className="text-slate-500 dark:text-violet-300/60">
                              Deadline: {new Date(target.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timeline Node Badge */}
                    <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
                      <div
                        className={`w-10 h-10 rounded-full border-4 flex items-center justify-center shadow-lg transition-all ${
                          isDone
                            ? 'bg-emerald-500 border-white dark:border-[#110b24] text-white shadow-emerald-500/50'
                            : 'bg-purple-600 border-white dark:border-[#110b24] text-white shadow-purple-500/50 animate-pulse'
                        }`}
                      >
                        {isDone ? <CheckCircle2 size={18} /> : <TargetIcon size={18} />}
                      </div>
                    </div>

                    {/* Spacer for two-column alignment */}
                    <div className="hidden sm:block sm:w-[calc(50%-2rem)]" />
                  </motion.div>
                );
              })
            )}

            {/* End Milestone: Ultimate Future Goal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: targets.length * 0.1 }}
              className="relative pt-6"
            >
              {/* Flag Badge Node */}
              <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 top-0 z-10 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-sky-500 text-white flex items-center justify-center shadow-xl border-4 border-white dark:border-[#110b24]">
                  <Flag size={22} />
                </div>
              </div>

              <div className="rounded-2xl border-2 border-fuchsia-500/40 bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-fuchsia-900/40 backdrop-blur-xl p-6 sm:p-8 shadow-2xl text-center mt-6">
                <span className="text-xs uppercase tracking-widest font-black text-fuchsia-400 bg-fuchsia-500/20 px-3 py-1 rounded-full border border-fuchsia-500/30 inline-block mb-3">
                  Ultimate Milestone
                </span>

                {!editingFutureGoal ? (
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {futureGoal?.title || 'My Ultimate Career & Life Milestone'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setFutureGoalTitle(futureGoal?.title || '');
                        setEditingFutureGoal(true);
                      }}
                      className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold tracking-wide transition inline-flex items-center gap-1.5 border border-white/20"
                    >
                      <Edit3 size={14} /> Edit Future Goal
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFutureGoalSubmit} className="max-w-md mx-auto space-y-3">
                    <input
                      type="text"
                      required
                      value={futureGoalTitle}
                      onChange={(e) => setFutureGoalTitle(e.target.value)}
                      placeholder="e.g. Become a Senior Software Engineer & Build My Product"
                      className="w-full rounded-xl bg-[#0c0a17] border border-fuchsia-500/50 px-4 py-2.5 text-white text-center font-bold text-lg focus:outline-none"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingFutureGoal(false)}
                        className="px-4 py-1.5 rounded-lg border border-white/20 text-white text-xs font-semibold hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={futureGoalMutation.isPending || !futureGoalTitle.trim()}
                        className="px-5 py-1.5 rounded-lg bg-fuchsia-600 text-white text-xs font-bold hover:bg-fuchsia-500 disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        {futureGoalMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                        <Save size={14} /> Save Goal
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
