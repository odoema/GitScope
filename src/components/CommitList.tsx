import React, { useState, useEffect, useMemo } from 'react';
import {
  GitCommit,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Calendar,
  FileDiff,
  Search,
  Plus,
  Minus,
  X,
} from 'lucide-react';
import {
  GitHubCommit,
  fetchRepoCommits,
  fetchCommitDetail,
} from '../services/github';

interface CommitListProps {
  owner: string;
  repo: string;
  branch: string;
}

export const CommitList: React.FC<CommitListProps> = ({ owner, repo, branch }) => {
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCommit, setSelectedCommit] = useState<(GitHubCommit & { files?: any[] }) | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadCommits = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRepoCommits(owner, repo, branch, page);
        if (!cancelled) {
          if (page === 1) {
            setCommits(data);
          } else {
            setCommits((prev) => [...prev, ...data]);
          }
          if (data.length < 30) {
            setHasMore(false);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load commits.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCommits();
    return () => {
      cancelled = true;
    };
  }, [owner, repo, branch, page]);

  const copySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const inspectCommit = async (sha: string) => {
    if (selectedCommit?.sha === sha) {
      setSelectedCommit(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const detail = await fetchCommitDetail(owner, repo, sha);
      setSelectedCommit(detail);
    } catch {
      // fallback
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredCommits = useMemo(() => {
    if (!searchQuery.trim()) return commits;
    const q = searchQuery.toLowerCase();
    return commits.filter(
      (c) =>
        c.commit.message.toLowerCase().includes(q) ||
        c.commit.author.name.toLowerCase().includes(q) ||
        (c.author?.login && c.author.login.toLowerCase().includes(q)) ||
        c.sha.toLowerCase().startsWith(q)
    );
  }, [commits, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Detail inspect modal / drawer if open */}
      {selectedCommit && (
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
            <div className="flex items-center gap-2">
              <FileDiff className="w-4 h-4 text-[#58a6ff]" />
              <h3 className="text-sm font-semibold text-white">
                Commit <span className="font-mono text-[#58a6ff] tabular-nums">{selectedCommit.sha.slice(0, 7)}</span>
              </h3>
            </div>
            <button
              onClick={() => setSelectedCommit(null)}
              className="p-1 text-[#8b949e] hover:text-white rounded-lg hover:bg-[#21262d] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-[#e6edf3] whitespace-pre-wrap font-sans leading-relaxed">
            {selectedCommit.commit.message}
          </p>

          {selectedCommit.files && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8b949e]">
                <span className="font-medium text-white">
                  Changed Files ({selectedCommit.files.length})
                </span>
                <span className="tabular-nums font-mono">
                  +{selectedCommit.files.reduce((a, b) => a + (b.additions || 0), 0)} / -
                  {selectedCommit.files.reduce((a, b) => a + (b.deletions || 0), 0)}
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {selectedCommit.files.map((file, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#0d1117] rounded-xl border border-[#21262d] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-medium truncate mr-2">{file.filename}</span>
                      <div className="flex items-center gap-2 shrink-0 tabular-nums">
                        <span className="text-emerald-400">+{file.additions}</span>
                        <span className="text-rose-400">-{file.deletions}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                            file.status === 'added'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : file.status === 'removed'
                              ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          }`}
                        >
                          {file.status}
                        </span>
                      </div>
                    </div>

                    {file.patch && (
                      <pre className="text-[11px] font-mono p-2.5 rounded-lg bg-[#161b22] text-[#c9d1d9] overflow-x-auto max-h-40 leading-relaxed border border-[#30363d]/60">
                        {file.patch.split('\n').map((line: string, idx: number) => {
                          const isAdd = line.startsWith('+');
                          const isDel = line.startsWith('-');
                          return (
                            <div
                              key={idx}
                              className={
                                isAdd
                                  ? 'text-emerald-400 bg-emerald-950/30'
                                  : isDel
                                  ? 'text-rose-400 bg-rose-950/30'
                                  : 'text-[#8b949e]'
                              }
                            >
                              {line}
                            </div>
                          );
                        })}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Commits List Box */}
      <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-xl">
        {/* Header with Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-[#161b22] border-b border-[#30363d]">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <GitCommit className="w-4 h-4 text-[#58a6ff]" />
            <span>Commit History</span>
            <span className="text-xs text-[#8b949e] font-normal">on {branch}</span>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commit messages or authors..."
              className="w-full bg-[#0d1117] text-xs text-[#c9d1d9] pl-8 pr-3 py-1.5 rounded-xl border border-[#30363d] focus:outline-none focus:border-[#58a6ff] transition-colors"
            />
          </div>
        </div>

        {loading && commits.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-[#58a6ff] animate-spin mb-3" />
            <p className="text-sm text-[#8b949e]">Fetching commit logs...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-400">{error}</div>
        ) : filteredCommits.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8b949e]">
            {searchQuery ? 'No commits matched your search.' : 'No commits found.'}
          </div>
        ) : (
          <div className="divide-y divide-[#21262d]">
            {filteredCommits.map((c) => {
              const msgLines = c.commit.message.split('\n');
              const title = msgLines[0];
              const authorLogin = c.author?.login || c.commit.author.name;
              const avatar = c.author?.avatar_url || `https://github.com/identicons/${encodeURIComponent(authorLogin)}.png`;

              return (
                <div
                  key={c.sha}
                  className="p-4 hover:bg-[#161b22] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#e6edf3] hover:text-[#58a6ff] break-words">
                      {title}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                      <img
                        src={avatar}
                        alt={authorLogin}
                        className="w-4 h-4 rounded-full ring-1 ring-[#30363d]"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="text-[#c9d1d9] font-medium">{authorLogin}</span>
                      <span>·</span>
                      <span className="tabular-nums font-mono">{formatDate(c.commit.author.date)}</span>
                    </div>
                  </div>

                  {/* SHA & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => inspectCommit(c.sha)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-white transition-colors flex items-center gap-1.5 font-medium"
                      title="Inspect commit diffs"
                    >
                      <FileDiff className="w-3.5 h-3.5 text-[#58a6ff]" />
                      <span>Diff</span>
                    </button>

                    <button
                      onClick={() => copySha(c.sha)}
                      className="flex items-center gap-1 px-2.5 py-1 font-mono text-xs rounded-lg bg-[#21262d] text-[#58a6ff] hover:bg-[#30363d] transition-colors tabular-nums"
                      title="Copy full commit SHA"
                    >
                      {copiedSha === c.sha ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#8b949e]" />
                      )}
                      <span>{c.sha.slice(0, 7)}</span>
                    </button>

                    <a
                      href={c.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-xs rounded-lg bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-colors"
                      title="View on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more pagination */}
        {hasMore && !loading && commits.length > 0 && !searchQuery && (
          <div className="p-4 text-center border-t border-[#21262d]">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-xs font-semibold text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] hover:text-white rounded-xl border border-[#30363d] transition-colors"
            >
              Load Older Commits
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
