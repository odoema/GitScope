import React, { useState } from 'react';
import {
  Search,
  Key,
  Zap,
  Github,
  Compass,
  Check,
  ShieldCheck,
  Sparkles,
  Database,
} from 'lucide-react';
import { RateLimitState, parseGitHubUrlOrSlug, getStoredToken, getCachedUser } from '../services/github';

interface HeaderProps {
  onSearchRepo: (owner: string, repo: string) => void;
  onOpenTokenModal: () => void;
  onGoHome: () => void;
  onOpenAIChat?: () => void;
  onOpenSupabase?: () => void;
  rateLimit: RateLimitState;
  currentRepoSlug?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onSearchRepo,
  onOpenTokenModal,
  onGoHome,
  onOpenAIChat,
  onOpenSupabase,
  rateLimit,
  currentRepoSlug,
}) => {
  const [inputVal, setInputVal] = useState('');
  const hasToken = !!getStoredToken();
  const cachedUser = hasToken ? getCachedUser() : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseGitHubUrlOrSlug(inputVal);
    if (parsed) {
      onSearchRepo(parsed.owner, parsed.repo);
      setInputVal('');
    }
  };

  const isLowRate = rateLimit.remaining < 15;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d1117]/95 backdrop-blur-md border-b border-[#30363d]/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Github className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-white font-sans">
              GitScope
            </span>
          </button>
        </div>

        {/* Global Search Input */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search repository (e.g. odoema/niletropical or react)..."
              className="w-full bg-[#161b22] border border-[#30363d] focus:border-blue-500 rounded-lg pl-9 pr-14 py-1.5 text-xs text-white placeholder:text-[#484f58] focus:outline-none transition-all font-mono"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] text-[#8b949e] bg-[#21262d] border border-[#30363d] rounded font-mono pointer-events-none">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Right side items: Supabase, Ask AI, Explore, Rate Limit, PAT Modal Button */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenSupabase && (
            <button
              onClick={onOpenSupabase}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-700/60 text-emerald-400 text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Connected Supabase Project (ououfhsswyqutcczdtnb)"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline font-semibold">Supabase</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </button>
          )}

          {onOpenAIChat && (
            <button
              onClick={onOpenAIChat}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Open GitScope AI Copilot (Ctrl+I)"
            >
              <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="hidden sm:inline">Ask AI</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] bg-black/25 rounded font-mono">
                Ctrl+I
              </kbd>
            </button>
          )}

          <button
            onClick={onGoHome}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="Explore Repositories"
          >
            <Compass className="w-3.5 h-3.5 text-[#58a6ff] shrink-0" />
            <span className="hidden sm:inline">Explore</span>
          </button>

          {/* Rate Limit Badge Button */}
          <button
            onClick={onOpenTokenModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono tabular-nums transition-colors whitespace-nowrap cursor-pointer ${
              isLowRate
                ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
            title="GitHub Rate Limit Status. Click to configure PAT."
          >
            <Zap className={`w-3.5 h-3.5 shrink-0 ${isLowRate ? 'text-rose-400' : 'text-amber-400'}`} />
            <span className="font-semibold text-white">{rateLimit.remaining}</span>
            <span className="hidden md:inline">/{rateLimit.limit}</span>
          </button>

          {/* PAT Connection Button */}
          <button
            onClick={onOpenTokenModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              hasToken
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-400 hover:bg-emerald-950/70'
                : 'bg-[#238636] hover:bg-[#2ea043] border-transparent text-white shadow'
            }`}
          >
            {hasToken ? (
              <>
                {cachedUser ? (
                  <img src={cachedUser.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{cachedUser ? cachedUser.login : 'Connected'}</span>
              </>
            ) : (
              <>
                <Key className="w-3.5 h-3.5" />
                <span>Connect GitHub</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
