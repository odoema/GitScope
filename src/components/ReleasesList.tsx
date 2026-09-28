import React, { useState, useEffect } from 'react';
import { Tag, Download, Calendar, ExternalLink, Loader2, Package } from 'lucide-react';
import { GitHubRelease, fetchRepoReleases } from '../services/github';
import { formatFileSize } from '../utils/fileIcons';

interface ReleasesListProps {
  owner: string;
  repo: string;
}

export const ReleasesList: React.FC<ReleasesListProps> = ({ owner, repo }) => {
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRepoReleases(owner, repo);
        if (!cancelled) setReleases(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load releases.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [owner, repo]);

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-xl">
      <div className="p-4 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-medium text-sm">
          <Tag className="w-4 h-4 text-[#58a6ff]" />
          <span>Releases & Distribution</span>
        </div>
        <span className="text-xs text-[#8b949e]">{releases.length} releases</span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-[#58a6ff] animate-spin mb-3" />
          <p className="text-sm text-[#8b949e]">Loading releases...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-red-400">{error}</div>
      ) : releases.length === 0 ? (
        <div className="p-10 text-center text-sm text-[#8b949e]">
          No published releases found for this repository.
        </div>
      ) : (
        <div className="divide-y divide-[#21262d]">
          {releases.map((rel) => (
            <div key={rel.id} className="p-5 hover:bg-[#161b22] transition-colors space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-white bg-[#21262d] px-2.5 py-1 rounded-md border border-[#30363d]">
                    {rel.tag_name}
                  </span>
                  <h3 className="text-base font-semibold text-[#e6edf3]">
                    {rel.name || rel.tag_name}
                  </h3>
                  {rel.prerelease && (
                    <span className="text-[10px] font-semibold uppercase bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full">
                      Pre-release
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-[#8b949e]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(rel.published_at).toLocaleDateString()}
                  </span>
                  <a
                    href={rel.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-[#8b949e] hover:text-white"
                    title="View on GitHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {rel.body && (
                <div className="p-3 bg-[#0d1117] rounded-lg border border-[#21262d] text-xs text-[#c9d1d9] whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                  {rel.body}
                </div>
              )}

              {/* Assets */}
              {rel.assets.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Assets ({rel.assets.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rel.assets.map((asset) => (
                      <a
                        key={asset.id}
                        href={asset.browser_download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded bg-[#0d1117] border border-[#21262d] hover:border-[#58a6ff] text-xs text-[#58a6ff] transition-colors"
                      >
                        <span className="truncate mr-2 font-mono">{asset.name}</span>
                        <div className="flex items-center gap-2 shrink-0 text-[#8b949e]">
                          <span>{formatFileSize(asset.size)}</span>
                          <Download className="w-3.5 h-3.5" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
