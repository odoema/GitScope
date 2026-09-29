import React, { useState, useEffect, useCallback } from 'react';
import {
  GitHubRepo,
  GitHubBranch,
  RateLimitState,
  fetchRepository,
  fetchRepoBranches,
  fetchRepoReadme,
  subscribeRateLimit,
  getStoredToken,
} from './services/github';
import { Header } from './components/Header';
import { RepoHeader } from './components/RepoHeader';
import { RepoNavTabs, RepoTabType } from './components/RepoNavTabs';
import { FileExplorer } from './components/FileExplorer';
import { CommitList } from './components/CommitList';
import { IssuesList } from './components/IssuesList';
import { ReleasesList } from './components/ReleasesList';
import { InsightsView } from './components/InsightsView';
import { RepoDiscovery } from './components/RepoDiscovery';
import { TokenModal } from './components/TokenModal';
import { MyGitHub } from './components/MyGitHub';
import { CloneModal } from './components/CloneModal';
import { CommandPalette } from './components/CommandPalette';
import { AIChatDrawer } from './components/AIChatDrawer';
import { AIImageStudio } from './components/AIImageStudio';
import { SupabaseStudio } from './components/SupabaseStudio';
import { Loader2, AlertCircle, ArrowLeft, RefreshCw, Key, Sparkles, Database } from 'lucide-react';

const RECENT_KEY = 'gitscope_recent_repos';

export default function App() {
  const [currentSlug, setCurrentSlug] = useState<{ owner: string; repo: string } | null>(null);
  const [repoData, setRepoData] = useState<GitHubRepo | null>(null);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [readmeContent, setReadmeContent] = useState<{ content: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<RepoTabType>('code');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  // Bumped whenever the GitHub connection changes so token-dependent UI re-renders
  const [authVersion, setAuthVersion] = useState(0);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [activeAiFile, setActiveAiFile] = useState<{ name: string; content?: string } | null>(null);
  const [externalSelectedFile, setExternalSelectedFile] = useState<string | null>(null);

  // Rate limit
  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    limit: 60,
    remaining: 60,
    reset: Math.floor(Date.now() / 1000) + 3600,
  });

  // Recent repos
  const [recentRepos, setRecentRepos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      return saved ? JSON.parse(saved) : ['odoema/niletropical', 'facebook/react', 'torvalds/linux'];
    } catch {
      return ['odoema/niletropical', 'facebook/react', 'torvalds/linux'];
    }
  });

  // Global keyboard shortcuts (Cmd+K / Ctrl+K for search, Cmd+I / Ctrl+I for AI Copilot)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (repoData) {
          setCommandPaletteOpen((prev) => !prev);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        setAiChatOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [repoData]);

  // Subscribe to rate limit changes
  useEffect(() => {
    const unsubscribe = subscribeRateLimit((state) => {
      setRateLimit(state);
    });
    return unsubscribe;
  }, []);

  // Save recent repos
  const addRecentRepo = (slug: string) => {
    setRecentRepos((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== slug.toLowerCase());
      const updated = [slug, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Check URL query parameters or hash on initial load, or default to odoema/niletropical
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const repoParam = params.get('repo');
    if (repoParam && repoParam.includes('/')) {
      const [o, r] = repoParam.split('/');
      loadRepository(o, r);
    } else if (!getStoredToken()) {
      loadRepository('odoema', 'niletropical');
    }
    // Connected users with no ?repo land on the "My GitHub" home
  }, []);

  // Load a repository
  const loadRepository = useCallback(async (owner: string, repo: string, branchName?: string) => {
    setLoading(true);
    setError(null);
    setCurrentSlug({ owner, repo });
    setActiveTab('code');

    try {
      // 1. Fetch Repository Details
      const data = await fetchRepository(owner, repo);
      setRepoData(data);

      const slug = `${data.owner.login}/${data.name}`;
      addRecentRepo(slug);

      // Update URL search param for easy sharing
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('repo', slug);
      window.history.replaceState({}, '', newUrl.toString());

      // 2. Fetch Branches
      let branchToUse = branchName || data.default_branch;
      try {
        const branchList = await fetchRepoBranches(owner, repo);
        setBranches(branchList);
        if (branchList.length > 0 && !branchList.some((b) => b.name === branchToUse)) {
          branchToUse = branchList[0].name;
        }
      } catch {
        setBranches([{ name: branchToUse, commit: { sha: '', url: '' }, protected: false }]);
      }
      setSelectedBranch(branchToUse);

      // 3. Fetch Readme
      try {
        const rm = await fetchRepoReadme(owner, repo, branchToUse);
        setReadmeContent(rm);
      } catch {
        setReadmeContent(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to inspect repository.');
      setRepoData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBranchChange = async (newBranch: string) => {
    if (!currentSlug) return;
    setSelectedBranch(newBranch);
    try {
      const rm = await fetchRepoReadme(currentSlug.owner, currentSlug.repo, newBranch);
      setReadmeContent(rm);
    } catch {
      // ignore
    }
  };

  const handleGoHome = () => {
    setCurrentSlug(null);
    setRepoData(null);
    setError(null);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('repo');
    window.history.replaceState({}, '', newUrl.toString());
  };

  const handleOpenFileFromPalette = (filePath: string) => {
    setActiveTab('code');
    setExternalSelectedFile(filePath);
  };

  const handleAskAIOnFile = (filename: string, code: string) => {
    setActiveAiFile({ name: filename, content: code });
    setAiChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#c9d1d9] flex flex-col font-sans">
      {/* Top Navbar */}
      <Header
        onSearchRepo={loadRepository}
        onOpenTokenModal={() => setTokenModalOpen(true)}
        onGoHome={handleGoHome}
        onOpenAIChat={() => setAiChatOpen(true)}
        onOpenSupabase={() => setActiveTab('supabase')}
        rateLimit={rateLimit}
        currentRepoSlug={currentSlug ? `${currentSlug.owner}/${currentSlug.repo}` : undefined}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#30363d] border-t-[#58a6ff] animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-base font-semibold text-white">Connecting to GitHub...</h2>
              <p className="text-xs text-[#8b949e]">
                Inspecting repository structures, metadata, and branches
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="max-w-2xl mx-auto my-12 p-6 rounded-2xl border border-rose-900/50 bg-rose-950/20 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-900/30 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">Unable to Inspect Repository</h3>
              <p className="text-sm text-rose-300">{error}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setTokenModalOpen(true)}
                className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                Configure Token / Check Limits
              </button>

              {currentSlug && (
                <button
                  onClick={() => loadRepository(currentSlug.owner, currentSlug.repo)}
                  className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 border border-[#30363d]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              )}

              <button
                onClick={handleGoHome}
                className="px-4 py-2 text-xs text-[#8b949e] hover:text-white transition-colors"
              >
                Return to Explore
              </button>
            </div>
          </div>
        )}

        {/* Home / Discovery View */}
        {!loading && !error && !repoData && (
          <div className="space-y-10">
            {getStoredToken() && (
              <MyGitHub
                key={authVersion}
                onSelectRepo={loadRepository}
                onOpenTokenModal={() => setTokenModalOpen(true)}
              />
            )}
            <RepoDiscovery onSelectRepo={loadRepository} recentRepos={recentRepos} />
          </div>
        )}

        {/* Active Repository Inspector View */}
        {!loading && !error && repoData && (
          <div className="space-y-6">
            {/* Back button & Meta */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleGoHome}
                className="inline-flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#161b22]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Explore & Presets</span>
              </button>

              <span className="text-xs text-[#8b949e] font-mono tabular-nums">
                Updated {new Date(repoData.updated_at).toLocaleDateString()}
              </span>
            </div>

            {/* Repo Header & Identity */}
            <RepoHeader
              repo={repoData}
              branches={branches}
              selectedBranch={selectedBranch}
              onSelectBranch={handleBranchChange}
              onOpenClone={() => setCloneModalOpen(true)}
            />

            {/* Sub-navigation tabs */}
            <RepoNavTabs
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              openIssuesCount={repoData.open_issues_count}
            />

            {/* Active Sub-View */}
            <div>
              {activeTab === 'code' && (
                <FileExplorer
                  owner={repoData.owner.login}
                  repo={repoData.name}
                  branch={selectedBranch}
                  defaultBranch={repoData.default_branch}
                  readmeContent={readmeContent}
                  onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                  externalSelectedFile={externalSelectedFile}
                  onClearExternalFile={() => setExternalSelectedFile(null)}
                  onAskAI={handleAskAIOnFile}
                  onOpenSupabaseStudio={() => setActiveTab('supabase')}
                />
              )}

              {activeTab === 'commits' && (
                <CommitList
                  owner={repoData.owner.login}
                  repo={repoData.name}
                  branch={selectedBranch}
                />
              )}

              {activeTab === 'issues' && (
                <IssuesList owner={repoData.owner.login} repo={repoData.name} />
              )}

              {activeTab === 'releases' && (
                <ReleasesList owner={repoData.owner.login} repo={repoData.name} />
              )}

              {activeTab === 'insights' && <InsightsView repo={repoData} />}

              {activeTab === 'studio' && (
                <AIImageStudio
                  repoName={repoData.name}
                  techStacks={repoData.language ? [repoData.language] : []}
                />
              )}

              {activeTab === 'supabase' && (
                <SupabaseStudio
                  owner={repoData.owner.login}
                  repo={repoData.name}
                  onOpenMigration={(filePath) => handleOpenFileFromPalette(filePath)}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Copilot Trigger */}
      <button
        onClick={() => setAiChatOpen(true)}
        className="fixed bottom-5 right-5 z-40 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/25 text-white flex items-center gap-2 group cursor-pointer border border-blue-400/30"
        title="Open GitScope AI Copilot (Ctrl+I)"
      >
        <Sparkles className="w-4 h-4 text-white" />
        <span className="text-xs font-semibold tracking-wide hidden sm:inline">Ask AI</span>
        <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] bg-black/25 rounded font-mono">
          Ctrl+I
        </kbd>
      </button>

      {/* Footer */}
      <footer className="border-t border-[#30363d]/80 bg-[#0d1117] py-6 px-4 mt-12 text-center text-xs text-[#8b949e]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-2">
            <span className="font-semibold text-white">GitScope</span>
            <span>·</span>
            <span>GitHub & Supabase Developer Workbench</span>
          </p>
          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              onClick={() => setTokenModalOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              PAT Token & Rate Limits
            </button>
            <span>·</span>
            <a
              href="https://niletropicaluganda.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#58a6ff] hover:underline"
            >
              niletropicaluganda.com
            </a>
          </div>
        </div>
      </footer>

      {/* Modals & Command Palette */}
      <TokenModal
        isOpen={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        rateLimit={rateLimit}
        onTokenChanged={() => {
          setAuthVersion((v) => v + 1);
          if (currentSlug && repoData) {
            loadRepository(currentSlug.owner, currentSlug.repo, selectedBranch);
          } else if (currentSlug) {
            // A previous load failed (e.g. private repo) - retry now that the token changed
            loadRepository(currentSlug.owner, currentSlug.repo, selectedBranch);
          }
        }}
      />

      {repoData && (
        <>
          <CloneModal
            isOpen={cloneModalOpen}
            onClose={() => setCloneModalOpen(false)}
            repo={repoData}
          />

          <CommandPalette
            isOpen={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            owner={repoData.owner.login}
            repo={repoData.name}
            branch={selectedBranch}
            onSelectFile={handleOpenFileFromPalette}
          />
        </>
      )}

      {/* Gemini AI Multi-turn Chat Copilot with Google Search Grounding */}
      <AIChatDrawer
        isOpen={aiChatOpen}
        onClose={() => {
          setAiChatOpen(false);
          setActiveAiFile(null);
        }}
        repoSlug={currentSlug ? `${currentSlug.owner}/${currentSlug.repo}` : undefined}
        activeFile={activeAiFile}
        techStacks={repoData?.language ? [repoData.language] : []}
      />
    </div>
  );
}
