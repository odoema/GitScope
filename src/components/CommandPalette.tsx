import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileCode, CornerDownLeft, Sparkles, Loader2 } from 'lucide-react';
import { GitHubTreeItem, fetchRepoGitTree } from '../services/github';
import { getFileIcon, formatFileSize } from '../utils/fileIcons';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
  branch: string;
  onSelectFile: (path: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  owner,
  repo,
  branch,
  onSelectFile,
}) => {
  const [query, setQuery] = useState('');
  const [treeItems, setTreeItems] = useState<GitHubTreeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recursive tree once per repo/branch
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadTree = async () => {
      setLoading(true);
      try {
        const res = await fetchRepoGitTree(owner, repo, branch);
        if (!cancelled) {
          // Keep only blob files (not tree folders)
          const files = res.tree.filter((item) => item.type === 'blob');
          setTreeItems(files);
        }
      } catch {
        // Fallback or rate limit
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadTree();
    return () => {
      cancelled = true;
    };
  }, [isOpen, owner, repo, branch]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const filtered = query.trim()
    ? treeItems
        .filter((item) => item.path.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 50)
    : treeItems.slice(0, 30);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      onSelectFile(filtered[selectedIndex].path);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[#30363d] bg-[#161b22] shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#30363d] bg-[#0d1117]">
          <Search className="w-5 h-5 text-[#8b949e] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Search all files in ${repo} (${branch})...`}
            className="w-full bg-transparent text-sm text-white placeholder:text-[#484f58] focus:outline-none font-mono"
          />
          {loading && <Loader2 className="w-4 h-4 text-[#58a6ff] animate-spin shrink-0" />}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-[#8b949e] bg-[#21262d] rounded border border-[#30363d]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto flex-1 divide-y divide-[#21262d] max-h-96">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#8b949e]">
              {loading ? 'Indexing codebase files...' : 'No files matched your query.'}
            </div>
          ) : (
            filtered.map((item, index) => {
              const filename = item.path.split('/').pop() || item.path;
              const dir = item.path.includes('/') ? item.path.substring(0, item.path.lastIndexOf('/')) : '';
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onSelectFile(item.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs transition-colors ${
                    isSelected ? 'bg-[#21262d]' : 'hover:bg-[#161b22]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {getFileIcon(filename, false)}
                    <div className="truncate font-mono">
                      <span className="text-white font-medium">{filename}</span>
                      {dir && <span className="text-[#8b949e] ml-2 font-normal">in {dir}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.size !== undefined && (
                      <span className="text-[11px] font-mono text-[#8b949e] tabular-nums">
                        {formatFileSize(item.size)}
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[#58a6ff] flex items-center gap-0.5 text-[10px] font-mono">
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#0d1117] border-t border-[#30363d] flex items-center justify-between text-[11px] text-[#8b949e]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-[#21262d] rounded border border-[#30363d] text-[10px]">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-[#21262d] rounded border border-[#30363d] text-[10px]">↓</kbd> navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-[#21262d] rounded border border-[#30363d] text-[10px]">↵</kbd> open
            </span>
          </div>
          <span>{treeItems.length} total files indexed</span>
        </div>
      </div>
    </div>
  );
};
