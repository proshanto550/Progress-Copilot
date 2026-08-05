import { Link } from 'react-router-dom';

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
        <span className="text-white font-black text-xl italic tracking-tighter">P</span>
        <div className="absolute inset-0 bg-purple-500 blur-md opacity-40 rounded-xl -z-10" />
      </div>
      {!compact && (
        <div className="flex flex-col">
          <span className="font-extrabold text-lg leading-none tracking-tight text-white flex items-center gap-1">
            Progress <span className="text-purple-300">Copilot</span>
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400 mt-1">
            A PLATFORM FOR SMARTER PROGRESS
          </span>
        </div>
      )}
    </Link>
  );
}