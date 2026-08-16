import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { GitHubCalendar } from 'react-github-calendar';
import {
  ExternalLink,
  Star,
  GitFork,
  Code2,
  Users,
  BookMarked,
  X,
  Plus,
  Loader2,
  CheckCircle2,
  GitCommit,
} from 'lucide-react';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext';

function GithubIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [handleInput, setHandleInput] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['githubData'],
    queryFn: async () => {
      const { data } = await api.get('/api/projects/github');
      return data;
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (username: string) => {
      const { data } = await api.post('/api/projects/github/connect', { username });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['githubData'] });
      setConnectModalOpen(false);
      setHandleInput('');
    },
  });

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleInput.trim()) return;
    connectMutation.mutate(handleInput.trim());
  };

  const profile = data?.profile;
  const repos = data?.repositories ?? [];
  const githubUsername = data?.username || profile?.login;

  return (
    <div className="space-y-6">
      {/* ─── Header Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 sm:p-6 shadow-md dark:shadow-glow-purple">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GithubIcon className="text-purple-600 dark:text-fuchsia-400" size={26} /> GitHub Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-violet-300/80 mt-1">
            Connect your GitHub profile to showcase real-time repositories, commits, and activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConnectModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-bold tracking-wide shadow-md hover:brightness-110 active:scale-[0.98] transition inline-flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <GithubIcon size={18} /> {data?.connected ? 'Change GitHub Handle' : 'Connect GitHub'}
        </button>
      </div>

      {/* Loading & Error */}
      {isLoading && (
        <div className="space-y-6">
          <div className="h-36 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-cardBorder bg-rose-50 dark:bg-cardBg/80 p-6 text-rose-600 dark:text-rose-400 text-sm">
          {(error as Error).message}
        </div>
      )}

      {/* Not Connected State */}
      {!isLoading && !data?.connected && (
        <div className="rounded-2xl border border-dashed border-purple-300 dark:border-purple-500/30 p-12 text-center bg-slate-50/50 dark:bg-cardBg/40">
          <GithubIcon className="mx-auto text-purple-400 dark:text-purple-400/50 mb-3" size={48} />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Connect Your GitHub Account</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-violet-300/70 mt-1 max-w-sm mx-auto">
            Link your username to automatically import public repositories and display your live 365-day contribution calendar.
          </p>
          <button
            type="button"
            onClick={() => setConnectModalOpen(true)}
            className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-sky-600 text-white font-bold text-sm shadow-md hover:brightness-110 transition inline-flex items-center gap-2"
          >
            <Plus size={18} /> Connect Now
          </button>
        </div>
      )}

      {/* Connected State */}
      {!isLoading && data?.connected && profile && (
        <div className="space-y-6">
          {/* GitHub Profile Card */}
          <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-purple-400 shadow-md shrink-0"
              />
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                  {profile.name} <span className="text-xs text-purple-600 dark:text-fuchsia-400 font-semibold">@{profile.login}</span>
                </h2>
                {profile.bio && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-violet-300/80 mt-1 max-w-lg">
                    {profile.bio}
                  </p>
                )}
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-600 dark:text-violet-300 font-medium">
                  <span className="flex items-center gap-1">
                    <BookMarked size={14} className="text-purple-600 dark:text-fuchsia-400" /> {profile.publicRepos} Repos
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} className="text-sky-600 dark:text-sky-400" /> {profile.followers} Followers
                  </span>
                </div>
              </div>
            </div>

            <a
              href={profile.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-700 dark:text-fuchsia-300 text-xs font-bold transition inline-flex items-center gap-1.5 border border-purple-500/20 shrink-0"
            >
              GitHub Profile <ExternalLink size={13} />
            </a>
          </div>

          {/* Real-time GitHub Contribution Calendar */}
          {githubUsername && (
            <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 sm:p-6 shadow-md overflow-x-auto">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <GithubIcon size={18} className="text-purple-600 dark:text-fuchsia-400" /> Real-time GitHub Contribution Calendar
              </h3>
              <div className="py-2 flex justify-center">
                <GitHubCalendar
                  username={githubUsername}
                  colorScheme={theme === 'dark' ? 'dark' : 'light'}
                  fontSize={12}
                  blockSize={12}
                  blockMargin={4}
                />
              </div>
            </div>
          )}

          {/* Repository Cards Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookMarked className="text-purple-600 dark:text-fuchsia-400" size={20} />
              Recent Repositories ({repos.length})
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              {repos.map((repo: any) => (
                <div
                  key={repo.id}
                  className="rounded-xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-4 shadow-sm hover:shadow-md dark:hover:border-purple-500/50 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-base text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-fuchsia-300 transition truncate flex items-center gap-1.5"
                      >
                        {repo.name} <ExternalLink size={13} className="shrink-0 text-slate-400" />
                      </a>
                    </div>
                    
                    {repo.description ? (
                      <p className="text-xs text-slate-600 dark:text-violet-300/80 line-clamp-2 mb-2">
                        {repo.description}
                      </p>
                    ) : null}

                    {/* Commit count display as requested */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-fuchsia-300 font-bold text-xs mb-3 border border-purple-500/15">
                      <GitCommit size={13} /> Total Commit -&gt; {repo.commitCount || 1}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-violet-300/60 pt-2 border-t border-purple-200/60 dark:border-cardBorder/40">
                    <span className="font-semibold flex items-center gap-1 text-slate-700 dark:text-violet-300">
                      <Code2 size={13} className="text-purple-600 dark:text-fuchsia-400" />
                      {repo.language || 'Code'}
                    </span>
                    <div className="flex items-center gap-3 font-medium">
                      <span className="flex items-center gap-1">
                        <Star size={13} className="text-amber-500" /> {repo.stargazersCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork size={13} className="text-sky-500" /> {repo.forksCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Connect Handle Modal */}
      <AnimatePresence>
        {connectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-[#181033] dark:via-[#120a27] dark:to-[#0b0718] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-200/60 dark:border-cardBorder/40">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GithubIcon className="text-purple-600 dark:text-fuchsia-400" size={20} />
                  Connect GitHub Account
                </h2>
                <button
                  type="button"
                  onClick={() => setConnectModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-violet-300 hover:bg-purple-500/10 dark:hover:bg-white/10 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConnectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-violet-300/80 mb-1">
                    GitHub Username / Handle
                  </label>
                  <input
                    type="text"
                    required
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    placeholder="e.g. octocat or proshanto550"
                    className="w-full rounded-xl bg-slate-100/90 dark:bg-[#0c0a17] border border-purple-200 dark:border-cardBorder px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-violet-300/40 focus:border-purple-500 focus:outline-none transition text-sm font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-200/60 dark:border-cardBorder/40">
                  <button
                    type="button"
                    onClick={() => setConnectModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-purple-300 dark:border-cardBorder text-slate-700 dark:text-violet-200 text-sm font-semibold hover:bg-purple-500/10 dark:hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={connectMutation.isPending || !handleInput.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-bold tracking-wide shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-50 inline-flex items-center gap-2 transition"
                  >
                    {connectMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                    <CheckCircle2 size={16} /> Save & Connect
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
