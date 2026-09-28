import React, { useState, useEffect } from 'react';
import {
  Users,
  PieChart,
  HardDrive,
  Calendar,
  GitBranch,
  Shield,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Terminal,
} from 'lucide-react';
import {
  GitHubRepo,
  GitHubContributor,
  fetchRepoLanguages,
  fetchRepoContributors,
} from '../services/github';
import { formatFileSize } from '../utils/fileIcons';

// Language colors map
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Shell: '#89e051',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
};

interface InsightsViewProps {
  repo: GitHubRepo;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ repo }) => {
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [contributors, setContributors] = useState<GitHubContributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedClone, setCopiedClone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [langs, contribs] = await Promise.allSettled([
          fetchRepoLanguages(repo.owner.login, repo.name),
          fetchRepoContributors(repo.owner.login, repo.name),
        ]);
        if (!cancelled) {
          if (langs.status === 'fulfilled') setLanguages(langs.value);
          if (contribs.status === 'fulfilled') setContributors(contribs.value);
        }
      } catch {
        // error handling
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [repo.owner.login, repo.name]);

  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClone(id);
    setTimeout(() => setCopiedClone(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Languages Card */}
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-medium text-sm">
          <PieChart className="w-4 h-4 text-[#58a6ff]" />
          <span>Languages Breakdown</span>
        </div>

        {totalBytes > 0 && (
          <div className="space-y-3">
            {/* Color progress bar */}
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-[#21262d]">
              {Object.entries(languages).map(([lang, bytes]) => {
                const percent = ((bytes / totalBytes) * 100).toFixed(1);
                const color = LANG_COLORS[lang] || '#8b949e';
                return (
                  <div
                    key={lang}
                    style={{ width: `${percent}%`, backgroundColor: color }}
                    title={`${lang}: ${percent}%`}
                    className="h-full hover:opacity-80 transition-opacity"
                  />
                );
              })}
            </div>

            {/* Badges / legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
              {Object.entries(languages).map(([lang, bytes]) => {
                const percent = ((bytes / totalBytes) * 100).toFixed(1);
                const color = LANG_COLORS[lang] || '#8b949e';
                return (
                  <div key={lang} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-[#c9d1d9]">{lang}</span>
                    <span className="text-[#8b949e]">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Repository Details & Clone URLs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Repo Stats */}
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#58a6ff]" />
            Repository Metadata
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#21262d]">
              <span className="text-[#8b949e]">Default Branch</span>
              <span className="font-mono text-white flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-[#58a6ff]" />
                {repo.default_branch}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#21262d]">
              <span className="text-[#8b949e]">Repository Size</span>
              <span className="font-mono text-white">{formatFileSize(repo.size * 1024)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#21262d]">
              <span className="text-[#8b949e]">License</span>
              <span className="font-mono text-white flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-400" />
                {repo.license ? repo.license.spdx_id || repo.license.name : 'No License specified'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#21262d]">
              <span className="text-[#8b949e]">Created At</span>
              <span className="text-white flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(repo.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-[#8b949e]">Last Pushed</span>
              <span className="text-white flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(repo.pushed_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Clone Commands */}
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#58a6ff]" />
            Clone Repository
          </h3>

          <div className="space-y-3">
            {/* HTTPS */}
            <div>
              <label className="text-[11px] font-medium text-[#8b949e] uppercase block mb-1">
                HTTPS
              </label>
              <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg p-2 font-mono text-xs text-[#c9d1d9]">
                <span className="truncate flex-1">{repo.clone_url}</span>
                <button
                  onClick={() => copyText(repo.clone_url, 'https')}
                  className="p-1 text-[#8b949e] hover:text-white"
                  title="Copy HTTPS"
                >
                  {copiedClone === 'https' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* SSH */}
            <div>
              <label className="text-[11px] font-medium text-[#8b949e] uppercase block mb-1">
                SSH
              </label>
              <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg p-2 font-mono text-xs text-[#c9d1d9]">
                <span className="truncate flex-1">{repo.ssh_url}</span>
                <button
                  onClick={() => copyText(repo.ssh_url, 'ssh')}
                  className="p-1 text-[#8b949e] hover:text-white"
                  title="Copy SSH"
                >
                  {copiedClone === 'ssh' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* CLI */}
            <div>
              <label className="text-[11px] font-medium text-[#8b949e] uppercase block mb-1">
                GitHub CLI
              </label>
              <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg p-2 font-mono text-xs text-[#c9d1d9]">
                <span className="truncate flex-1">gh repo clone {repo.full_name}</span>
                <button
                  onClick={() => copyText(`gh repo clone ${repo.full_name}`, 'cli')}
                  className="p-1 text-[#8b949e] hover:text-white"
                  title="Copy GitHub CLI"
                >
                  {copiedClone === 'cli' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contributors Grid */}
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium text-sm">
            <Users className="w-4 h-4 text-[#58a6ff]" />
            <span>Top Contributors</span>
          </div>
          <span className="text-xs text-[#8b949e]">{contributors.length} contributors</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 text-[#58a6ff] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {contributors.map((c) => (
              <a
                key={c.id}
                href={c.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-3 rounded-xl bg-[#161b22] border border-[#21262d] hover:border-[#58a6ff] transition-all group text-center"
              >
                <img
                  src={c.avatar_url}
                  alt={c.login}
                  className="w-12 h-12 rounded-full mb-2 ring-2 ring-[#30363d] group-hover:ring-[#58a6ff] transition-all"
                />
                <span className="text-xs font-semibold text-[#c9d1d9] group-hover:text-white truncate w-full">
                  {c.login}
                </span>
                <span className="text-[10px] text-[#8b949e]">
                  {c.contributions.toLocaleString()} commits
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
