import React, { useState } from 'react';
import {
  Star,
  GitFork,
  Eye,
  AlertCircle,
  GitBranch,
  ExternalLink,
  ChevronDown,
  Check,
  Lock,
  Globe,
  Share2,
} from 'lucide-react';
import { GitHubRepo, GitHubBranch } from '../services/github';

interface RepoHeaderProps {
  repo: GitHubRepo;
  branches: GitHubBranch[];
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
  onOpenClone: () => void;
}

export const RepoHeader: React.FC<RepoHeaderProps> = ({
  repo,
  branches,
  selectedBranch,
  onSelectBranch,
  onOpenClone,
}) => {
  const [branchOpen, setBranchOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-[#30363d]/80 bg-[#161b22] p-5 shadow-sm space-y-4">
      {/* Top Title and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Repo Identity */}
        <div className="flex items-start gap-3.5 min-w-0">
          <img
            src={repo.owner.avatar_url}
            alt={repo.owner.login}
            className="w-11 h-11 rounded-xl ring-1 ring-[#30363d] bg-[#0d1117] shrink-0 mt-0.5"
          />

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={repo.owner.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#58a6ff] hover:underline"
              >
                {repo.owner.login}
              </a>
              <span className="text-[#484f58]">/</span>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">{repo.name}</h1>

              <span className="text-xs text-[#8b949e] flex items-center gap-1 font-mono">
                {repo.private ? (
                  <>
                    <Lock className="w-3 h-3 text-amber-400" /> Private
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3 text-[#58a6ff]" /> Public
                  </>
                )}
              </span>

              {repo.fork && (
                <span className="text-xs text-purple-400 flex items-center gap-1 font-mono">
                  <GitFork className="w-3 h-3" /> Forked
                </span>
              )}
            </div>

            {repo.description && (
              <p className="text-xs md:text-sm text-[#8b949e] max-w-3xl line-clamp-2 leading-relaxed">
                {repo.description}
              </p>
            )}

            {repo.homepage && (
              <a
                href={repo.homepage.startsWith('http') ? repo.homepage : `https://${repo.homepage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#58a6ff] hover:underline inline-flex items-center gap-1 font-medium font-mono"
              >
                {repo.homepage} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Action metrics: Stars, Forks, Watchers */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center rounded-lg bg-[#21262d] border border-[#30363d] text-xs font-mono tabular-nums overflow-hidden">
            <div className="px-2.5 py-1.5 flex items-center gap-1.5 text-white">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span>{repo.stargazers_count.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center rounded-lg bg-[#21262d] border border-[#30363d] text-xs font-mono tabular-nums overflow-hidden">
            <div className="px-2.5 py-1.5 flex items-center gap-1.5 text-white">
              <GitFork className="w-3.5 h-3.5 text-[#8b949e]" />
              <span>{repo.forks_count.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center rounded-lg bg-[#21262d] border border-[#30363d] text-xs font-mono tabular-nums overflow-hidden">
            <div className="px-2.5 py-1.5 flex items-center gap-1.5 text-white">
              <Eye className="w-3.5 h-3.5 text-[#8b949e]" />
              <span>{repo.watchers_count.toLocaleString()}</span>
            </div>
          </div>

          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white transition-colors cursor-pointer"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#8b949e]" />
          </a>
        </div>
      </div>

      {/* Topics */}
      {repo.topics && repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 text-xs text-[#8b949e]">
          {repo.topics.map((t, idx) => (
            <span key={t} className="inline-flex items-center font-mono">
              <span className="text-[#58a6ff] hover:underline cursor-default">#{t}</span>
              {idx < repo.topics!.length - 1 && <span className="text-[#484f58] ml-2">·</span>}
            </span>
          ))}
        </div>
      )}

      {/* Branch selector & Clone Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#21262d]">
        {/* Branch dropdown */}
        <div className="relative">
          <button
            onClick={() => setBranchOpen(!branchOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-mono text-[#c9d1d9] rounded-xl transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span className="font-semibold text-white">{selectedBranch}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8b949e]" />
          </button>

          {branchOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-[#21262d]">
              <div className="p-3 text-xs font-semibold text-white bg-[#0d1117] flex items-center justify-between">
                <span>Select Branch</span>
                <span className="text-[10px] text-[#8b949e] font-mono tabular-nums">
                  {branches.length} available
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {branches.length === 0 ? (
                  <div className="p-3 text-xs text-[#8b949e] text-center">Loading branches...</div>
                ) : (
                  branches.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => {
                        onSelectBranch(b.name);
                        setBranchOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between hover:bg-[#21262d] transition-colors"
                    >
                      <span className={b.name === selectedBranch ? 'text-[#58a6ff] font-bold' : 'text-[#c9d1d9]'}>
                        {b.name}
                      </span>
                      {b.name === selectedBranch && <Check className="w-3.5 h-3.5 text-[#58a6ff]" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clone & Share actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenClone}
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] hover:text-white transition-colors flex items-center gap-1.5"
          >
            <GitFork className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>Clone</span>
          </button>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] hover:text-white transition-colors flex items-center gap-1.5"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Link</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
