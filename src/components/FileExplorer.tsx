import React, { useState, useEffect } from 'react';
import {
  Folder,
  ChevronRight,
  ArrowLeft,
  Search,
  Loader2,
  FileCode,
  ExternalLink,
  Download,
  AlertCircle,
  Command,
  FileText,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  GitHubContentItem,
  fetchRepoContents,
  decodeBase64Utf8,
} from '../services/github';
import { getFileIcon, formatFileSize } from '../utils/fileIcons';
import { CodeViewer } from './CodeViewer';
import { ReadmeViewer } from './ReadmeViewer';
import { analyzeRepoStructure, RepoAnalysis } from '../services/analyzer';

interface FileExplorerProps {
  owner: string;
  repo: string;
  branch: string;
  defaultBranch: string;
  readmeContent: { content: string; name: string } | null;
  onOpenCommandPalette: () => void;
  externalSelectedFile?: string | null;
  onClearExternalFile?: () => void;
  onAskAI?: (filename: string, code: string) => void;
  onOpenSupabaseStudio?: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  owner,
  repo,
  branch,
  readmeContent,
  onOpenCommandPalette,
  externalSelectedFile,
  onClearExternalFile,
  onAskAI,
  onOpenSupabaseStudio,
}) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<GitHubContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);

  // Selected file state
  const [selectedFile, setSelectedFile] = useState<{
    item: GitHubContentItem;
    content: string;
    loading: boolean;
  } | null>(null);

  // Handle external file selection (e.g., from CommandPalette or Architecture quick link)
  useEffect(() => {
    if (externalSelectedFile) {
      loadFileFromPath(externalSelectedFile);
      if (onClearExternalFile) onClearExternalFile();
    }
  }, [externalSelectedFile]);

  // Load directory contents
  useEffect(() => {
    let isCancelled = false;

    const loadDirectory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchRepoContents(owner, repo, currentPath, branch);
        if (!isCancelled) {
          if (Array.isArray(res)) {
            // Sort: folders first, then alphabetical
            const sorted = [...res].sort((a, b) => {
              if (a.type === 'dir' && b.type !== 'dir') return -1;
              if (a.type !== 'dir' && b.type === 'dir') return 1;
              return a.name.localeCompare(b.name);
            });
            setItems(sorted);

            // If at root, analyze structure
            if (currentPath === '') {
              const paths = sorted.map((i) => i.path);
              setAnalysis(analyzeRepoStructure(paths));
            }
          } else {
            openFile(res);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load directory contents.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadDirectory();

    return () => {
      isCancelled = true;
    };
  }, [owner, repo, branch, currentPath]);

  const loadFileFromPath = async (filePath: string) => {
    const filename = filePath.split('/').pop() || filePath;
    const dummyItem: GitHubContentItem = {
      name: filename,
      path: filePath,
      sha: '',
      size: 0,
      url: '',
      html_url: `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`,
      git_url: '',
      download_url: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`,
      type: 'file',
    };
    openFile(dummyItem);
  };

  const openFile = async (item: GitHubContentItem) => {
    setSelectedFile({
      item,
      content: '',
      loading: true,
    });

    try {
      let codeContent = '';
      if (item.content && item.encoding) {
        codeContent = decodeBase64Utf8(item.content);
      } else {
        const res = await fetchRepoContents(owner, repo, item.path, branch);
        if (!Array.isArray(res) && res.content) {
          codeContent = decodeBase64Utf8(res.content);
        } else if (item.download_url) {
          const raw = await fetch(item.download_url);
          codeContent = await raw.text();
        }
      }

      setSelectedFile({
        item,
        content: codeContent,
        loading: false,
      });
    } catch (err: any) {
      setSelectedFile({
        item,
        content: `Error loading file contents: ${err.message}`,
        loading: false,
      });
    }
  };

  const handleNavigatePath = (path: string) => {
    setSelectedFile(null);
    setCurrentPath(path);
    setFilterQuery('');
  };

  const handleGoUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    handleNavigatePath(parts.join('/'));
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Architecture & Tech Stack Bar (shown when at root) */}
      {!selectedFile && currentPath === '' && analysis && analysis.techStacks.length > 0 && (
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#58a6ff]" />
              Detected Architecture & Tech Stack
            </span>
            <span className="text-[11px] text-[#8b949e]">Auto-inspected from codebase</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {analysis.techStacks.map((st) => (
              <div
                key={st.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs font-medium text-[#c9d1d9]"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="font-semibold text-white">{st.name}</span>
                <span className="text-[10px] text-[#8b949e]">({st.category})</span>
                {st.name === 'Supabase' && onOpenSupabaseStudio && (
                  <button
                    onClick={onOpenSupabaseStudio}
                    className="ml-1 px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[10px] font-semibold hover:bg-emerald-900 transition-colors"
                  >
                    Open Studio
                  </button>
                )}
                {st.manifestPath && (
                  <button
                    onClick={() => loadFileFromPath(st.manifestPath!)}
                    className="ml-1 text-[10px] font-mono text-[#58a6ff] hover:underline"
                    title={`View ${st.manifestPath}`}
                  >
                    View manifest
                  </button>
                )}
              </div>
            ))}
          </div>

          {analysis.manifestFiles.length > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-[#21262d] text-xs text-[#8b949e]">
              <span>Key Manifests:</span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.manifestFiles.map((m) => (
                  <button
                    key={m}
                    onClick={() => loadFileFromPath(m)}
                    className="font-mono text-xs text-[#58a6ff] hover:underline px-2 py-0.5 rounded bg-[#0d1117] border border-[#21262d]"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top action row: Breadcrumbs, Filter & Quick Open */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161b22] p-3 rounded-2xl border border-[#30363d]">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm overflow-x-auto py-1 scrollbar-none min-w-0">
          <button
            onClick={() => handleNavigatePath('')}
            className={`font-mono px-2 py-1 rounded transition-colors whitespace-nowrap ${
              currentPath === '' && !selectedFile
                ? 'bg-[#21262d] text-white font-semibold'
                : 'text-[#58a6ff] hover:bg-[#21262d]'
            }`}
          >
            {repo}
          </button>

          {pathParts.map((part, index) => {
            const partPath = pathParts.slice(0, index + 1).join('/');
            const isLast = index === pathParts.length - 1 && !selectedFile;
            return (
              <React.Fragment key={partPath}>
                <span className="text-[#484f58]">/</span>
                <button
                  onClick={() => handleNavigatePath(partPath)}
                  className={`font-mono px-2 py-1 rounded transition-colors whitespace-nowrap ${
                    isLast
                      ? 'bg-[#21262d] text-white font-semibold'
                      : 'text-[#58a6ff] hover:bg-[#21262d]'
                  }`}
                >
                  {part}
                </button>
              </React.Fragment>
            );
          })}

          {selectedFile && (
            <>
              <span className="text-[#484f58]">/</span>
              <span className="font-mono px-2 py-1 bg-[#21262d] text-white font-semibold rounded whitespace-nowrap">
                {selectedFile.item.name}
              </span>
            </>
          )}
        </div>

        {/* Right side: Find file shortcut & in-folder filter */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#8b949e] hover:text-white bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] rounded-xl transition-colors font-mono"
            title="Search entire repository tree"
          >
            <Command className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span className="hidden md:inline">Find file</span>
            <kbd className="px-1.5 py-0.2 text-[10px] bg-[#21262d] text-[#c9d1d9] rounded border border-[#30363d]">
              Ctrl+K
            </kbd>
          </button>

          {!selectedFile && (
            <div className="relative min-w-[160px] sm:min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter folder..."
                className="w-full bg-[#0d1117] text-xs text-[#c9d1d9] pl-8 pr-3 py-1.5 rounded-xl border border-[#30363d] focus:outline-none focus:border-[#58a6ff] transition-colors"
              />
            </div>
          )}

          {selectedFile && (
            <button
              onClick={() => setSelectedFile(null)}
              className="flex items-center gap-1.5 text-xs text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] px-3 py-1.5 rounded-xl border border-[#30363d] transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Directory</span>
            </button>
          )}
        </div>
      </div>

      {/* Main content: Either file viewer or directory listing */}
      {selectedFile ? (
        <div>
          {selectedFile.loading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-[#0d1117] rounded-2xl border border-[#30363d]">
              <Loader2 className="w-8 h-8 text-[#58a6ff] animate-spin mb-3" />
              <p className="text-sm text-[#8b949e]">Loading file content...</p>
            </div>
          ) : (
            <CodeViewer
              filename={selectedFile.item.name}
              code={selectedFile.content}
              size={selectedFile.item.size}
              rawUrl={selectedFile.item.download_url}
              htmlUrl={selectedFile.item.html_url}
              onClose={() => setSelectedFile(null)}
              onAskAI={onAskAI}
            />
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-xl">
          {/* Directory Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] text-xs font-semibold text-[#8b949e]">
            <span>File Name</span>
            <div className="flex items-center gap-10 pr-2">
              <span className="hidden sm:inline">Size</span>
              <span>Actions</span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="w-8 h-8 text-[#58a6ff] animate-spin mb-3" />
              <p className="text-sm text-[#8b949e]">Fetching repository contents...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <p className="text-sm text-rose-400 font-medium">{error}</p>
              <button
                onClick={() => handleNavigatePath('')}
                className="mt-3 text-xs text-[#58a6ff] hover:underline"
              >
                Return to repository root
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#21262d]">
              {/* Go Up Row if in a subfolder */}
              {currentPath && (
                <button
                  onClick={handleGoUp}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[#58a6ff] hover:bg-[#161b22] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-[#8b949e]" />
                  <span className="font-mono text-xs">..</span>
                </button>
              )}

              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#8b949e]">
                  {filterQuery ? 'No files match your search filter.' : 'This directory is empty.'}
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.path}
                    className="flex items-center justify-between px-4 py-2 hover:bg-[#161b22] transition-colors group"
                  >
                    {/* Item Name & Icon */}
                    <button
                      onClick={() => {
                        if (item.type === 'dir') {
                          handleNavigatePath(item.path);
                        } else {
                          openFile(item);
                        }
                      }}
                      className="flex items-center gap-2.5 text-left text-sm flex-1 min-w-0 pr-4"
                    >
                      {getFileIcon(item.name, item.type === 'dir')}
                      <span
                        className={`truncate font-mono text-xs sm:text-sm ${
                          item.type === 'dir'
                            ? 'text-[#58a6ff] font-medium hover:underline'
                            : 'text-[#c9d1d9] group-hover:text-white'
                        }`}
                      >
                        {item.name}
                      </span>
                    </button>

                    {/* Meta & Actions */}
                    <div className="flex items-center gap-8 text-xs text-[#8b949e] shrink-0">
                      <span className="hidden sm:inline-block w-16 text-right font-mono tabular-nums">
                        {item.type === 'file' ? formatFileSize(item.size) : '-'}
                      </span>

                      <div className="flex items-center gap-1">
                        {item.download_url && (
                          <a
                            href={item.download_url}
                            download={item.name}
                            className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
                            title="Download raw file"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <a
                          href={item.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
                          title="Open on GitHub"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Render README if at root level and not previewing a file */}
      {!selectedFile && currentPath === '' && readmeContent && (
        <ReadmeViewer content={readmeContent.content} filename={readmeContent.name} />
      )}
    </div>
  );
};
