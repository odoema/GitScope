import React, { useEffect, useMemo, useState } from 'react';
import {
  Lock,
  Globe,
  GitFork,
  Star,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  Building2,
  MapPin,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import {
  GitHubRepo,
  GitHubUser,
  GitHubOrg,
  MyRepoSort,
  fetchAuthenticatedUser,
  fetchMyRepos,
  fetchMyOrgs,
  getCachedUser,
  setCachedUser,
} from '../services/github';

interface MyGitHubProps {
  onSelectRepo: (owner: string, repo: string) => void;
  onOpenTokenModal: () => void;
}

type Visibility = 'all' | 'private' | 'public' | 'forks' | 'sources';

const PAGE_SIZE = 50;

const timeAgo = (iso: string): string => {
  const secs = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const units: Array<[number, string]> = [
    [31536000, 'y'],
    [2592000, 'mo'],
    [86400, 'd'],
    [3600, 'h'],
    [60, 'm'],
  ];
  for (const [size, label] of units) {
    if (secs >= size) return `${Math.floor(secs / size)}${label} ago`;
  }
  return 'just now';
};

export const MyGitHub: React.FC<MyGitHubProps> = ({ onSelectRepo, onOpenTokenModal }) => {
  const [user, setUser] = useState<GitHubUser | null>(getCachedUser());
  const [orgs, setOrgs] = useState<GitHubOrg[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [sort, setSort] = useState<MyRepoSort>('pushed');

  const load = async (nextSort: MyRepoSort = sort) => {
    setLoading(true);
    setError(null);
    try {
      const [me, list, myOrgs] = await Promise.all([
        fetchAuthenticatedUser(),
        fetchMyRepos(1, nextSort, PAGE_SIZE),
        fetchMyOrgs(),
      ]);
      setUser(me);
      setCachedUser(me);
      setRepos(list);
      setOrgs(myOrgs);
      setPage(1);
      setHasMore(list.length === PAGE_SIZE);
    } catch (err: any) {
      setError(err.message || 'Failed to load your GitHub account.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = await fetchMyRepos(page + 1, sort, PAGE_SIZE);
      setRepos((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...next.filter((r) => !seen.has(r.id))];
      });
      setPage((p) => p + 1);
      setHasMore(next.length === PAGE_SIZE);
    } catch (err: any) {
      setError(err.message || 'Failed to load more repositories.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSortChange = (value: MyRepoSort) => {
    setSort(value);
    load(value);
  };

  const owners = useMemo(() => {
    const set = new Set(repos.map((r) => r.owner.login));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [repos]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repos.filter((r) => {
      if (visibility === 'private' && !r.private) return false;
      if (visibility === 'public' && r.private) return false;
      if (visibility === 'forks' && !r.fork) return false;
      if (visibility === 'sources' && r.fork) return false;
      if (ownerFilter !== 'all' && r.owner.login !== ownerFilter) return false;
      if (!q) return true;
      return (
        r.full_name.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.language || '').toLowerCase().includes(q)
      );
    });
  }, [repos, query, visibility, ownerFilter]);

  const privateCount = repos.filter((r) => r.private).length;

  if (loading && !repos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3 text-[#8b949e]">
        <Loader2 className="w-6 h-6 animate-spin text-[#58a6ff]" />
        <p className="text-xs">Loading your GitHub account…</p>
      </div>
    );
  }

  if (error && !repos.length) {
    return (
      <div className="max-w-xl mx-auto p-5 rounded-2xl border border-rose-900/50 bg-rose-950/20 text-center space-y-3">
        <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
        <p className="text-sm text-rose-300">{error}</p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => load()}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
          <button
            onClick={onOpenTokenModal}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white"
          >
            Reconnect GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Profile */}
      {user && (
        <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <img
            src={user.avatar_url}
            alt={user.login}
            className="w-16 h-16 rounded-full border border-[#30363d] shrink-0"
          />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-white truncate">{user.name || user.login}</h2>
              <a
                href={user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#58a6ff] hover:underline inline-flex items-center gap-1 font-mono"
              >
                @{user.login} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {user.bio && <p className="text-xs text-[#8b949e] line-clamp-2">{user.bio}</p>}
            <div className="flex items-center gap-4 text-[11px] text-[#8b949e] flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" /> {user.followers} followers · {user.following} following
              </span>
              {user.company && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {user.company}
                </span>
              )}
              {user.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {user.location}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center shrink-0">
            <div className="rounded-lg bg-[#161b22] border border-[#30363d] px-3 py-2">
              <p className="text-base font-semibold text-white tabular-nums">{repos.length}{hasMore ? '+' : ''}</p>
              <p className="text-[10px] text-[#8b949e]">Accessible repos</p>
            </div>
            <div className="rounded-lg bg-[#161b22] border border-[#30363d] px-3 py-2">
              <p className="text-base font-semibold text-white tabular-nums">{privateCount}</p>
              <p className="text-[10px] text-[#8b949e]">Private</p>
            </div>
            <div className="rounded-lg bg-[#161b22] border border-[#30363d] px-3 py-2">
              <p className="text-base font-semibold text-white tabular-nums">{orgs.length}</p>
              <p className="text-[10px] text-[#8b949e]">Orgs</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter your repositories by name, description, or language…"
            className="w-full bg-[#161b22] border border-[#30363d] focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-[#484f58] focus:outline-none font-mono"
          />
        </div>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as Visibility)}
          className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#c9d1d9] focus:outline-none focus:border-blue-500"
        >
          <option value="all">All visibility</option>
          <option value="private">Private only</option>
          <option value="public">Public only</option>
          <option value="sources">Sources (no forks)</option>
          <option value="forks">Forks only</option>
        </select>
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#c9d1d9] focus:outline-none focus:border-blue-500"
        >
          <option value="all">All owners</option>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as MyRepoSort)}
          className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#c9d1d9] focus:outline-none focus:border-blue-500"
        >
          <option value="pushed">Last pushed</option>
          <option value="updated">Last updated</option>
          <option value="created">Newest</option>
          <option value="full_name">Name (A–Z)</option>
        </select>
      </div>

      {/* Repo list */}
      <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] divide-y divide-[#21262d] overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-xs text-[#8b949e]">
            No repositories match your filters.
          </p>
        ) : (
          filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelectRepo(r.owner.login, r.name)}
              className="w-full text-left px-4 py-3 hover:bg-[#161b22] transition-colors flex items-start gap-3 cursor-pointer"
            >
              <img
                src={r.owner.avatar_url}
                alt=""
                className="w-6 h-6 rounded-full border border-[#30363d] mt-0.5 shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#58a6ff] truncate">{r.full_name}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${
                      r.private
                        ? 'border-amber-700/60 text-amber-400 bg-amber-950/30'
                        : 'border-[#30363d] text-[#8b949e]'
                    }`}
                  >
                    {r.private ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                    {r.private ? 'Private' : 'Public'}
                  </span>
                  {r.fork && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#8b949e]">
                      <GitFork className="w-2.5 h-2.5" /> fork
                    </span>
                  )}
                </div>
                {r.description && <p className="text-xs text-[#8b949e] line-clamp-1">{r.description}</p>}
                <div className="flex items-center gap-3 text-[11px] text-[#8b949e] font-mono">
                  {r.language && <span>{r.language}</span>}
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3 h-3" /> {r.stargazers_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitFork className="w-3 h-3" /> {r.forks_count}
                  </span>
                  <span>pushed {timeAgo(r.pushed_at)}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-xs rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white flex items-center gap-1.5 disabled:opacity-60"
          >
            {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Load more
          </button>
        </div>
      )}
    </section>
  );
};
