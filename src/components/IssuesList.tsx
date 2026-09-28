import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  GitPullRequest,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GitHubIssue, fetchRepoIssues } from '../services/github';

interface IssuesListProps {
  owner: string;
  repo: string;
}

export const IssuesList: React.FC<IssuesListProps> = ({ owner, repo }) => {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [typeFilter, setTypeFilter] = useState<'all' | 'issues' | 'pulls'>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRepoIssues(owner, repo, stateFilter);
        if (!cancelled) {
          setIssues(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load issues.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [owner, repo, stateFilter]);

  const filtered = issues.filter((item) => {
    if (typeFilter === 'issues') return !item.pull_request;
    if (typeFilter === 'pulls') return !!item.pull_request;
    return true;
  });

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-xl">
      {/* Header & Filter Controls */}
      <div className="p-4 bg-[#161b22] border-b border-[#30363d] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* State Filter */}
          <div className="flex bg-[#0d1117] p-1 rounded-lg border border-[#30363d] text-xs">
            <button
              onClick={() => setStateFilter('open')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 font-medium ${
                stateFilter === 'open'
                  ? 'bg-[#238636] text-white'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Open
            </button>
            <button
              onClick={() => setStateFilter('closed')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 font-medium ${
                stateFilter === 'closed'
                  ? 'bg-[#8957e5] text-white'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Closed
            </button>
            <button
              onClick={() => setStateFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors font-medium ${
                stateFilter === 'all'
                  ? 'bg-[#30363d] text-white'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              All
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex bg-[#0d1117] p-1 rounded-lg border border-[#30363d] text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                typeFilter === 'all' ? 'bg-[#21262d] text-white font-medium' : 'text-[#8b949e]'
              }`}
            >
              Everything
            </button>
            <button
              onClick={() => setTypeFilter('issues')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                typeFilter === 'issues' ? 'bg-[#21262d] text-white font-medium' : 'text-[#8b949e]'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              Issues
            </button>
            <button
              onClick={() => setTypeFilter('pulls')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                typeFilter === 'pulls' ? 'bg-[#21262d] text-white font-medium' : 'text-[#8b949e]'
              }`}
            >
              <GitPullRequest className="w-3 h-3" />
              PRs
            </button>
          </div>
        </div>

        <span className="text-xs text-[#8b949e]">
          Showing {filtered.length} {stateFilter} items
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-[#58a6ff] animate-spin mb-3" />
          <p className="text-sm text-[#8b949e]">Loading issues and pull requests...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-red-400">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center text-sm text-[#8b949e]">
          No matching issues or pull requests found.
        </div>
      ) : (
        <div className="divide-y divide-[#21262d]">
          {filtered.map((item) => {
            const isPr = !!item.pull_request;
            const isClosed = item.state === 'closed';
            const isExpanded = expandedId === item.id;

            return (
              <div key={item.id} className="p-4 hover:bg-[#161b22] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="mt-1">
                      {isPr ? (
                        <GitPullRequest
                          className={`w-4 h-4 ${isClosed ? 'text-[#8957e5]' : 'text-emerald-400'}`}
                        />
                      ) : (
                        <AlertCircle
                          className={`w-4 h-4 ${isClosed ? 'text-[#8957e5]' : 'text-emerald-400'}`}
                        />
                      )}
                    </span>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="text-sm font-semibold text-[#e6edf3] hover:text-[#58a6ff] text-left"
                        >
                          {item.title}
                        </button>

                        {/* Labels */}
                        {item.labels.map((lbl) => (
                          <span
                            key={lbl.id}
                            className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: `#${lbl.color}25`,
                              color: `#${lbl.color}`,
                              border: `1px solid #${lbl.color}60`,
                            }}
                          >
                            {lbl.name}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                        <span className="font-mono text-[#58a6ff]">#{item.number}</span>
                        <span>opened by</span>
                        <span className="text-[#c9d1d9] font-medium">{item.user.login}</span>
                        <span>on {new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {item.comments > 0 && (
                      <span className="flex items-center gap-1 text-xs text-[#8b949e]">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {item.comments}
                      </span>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-1 rounded text-[#8b949e] hover:text-white"
                      title={isExpanded ? 'Collapse' : 'Expand description'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <a
                      href={item.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                      title="Open on GitHub"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {isExpanded && item.body && (
                  <div className="mt-3 p-4 bg-[#0d1117] rounded-lg border border-[#30363d] text-xs text-[#c9d1d9] whitespace-pre-wrap font-sans max-h-80 overflow-y-auto">
                    {item.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
