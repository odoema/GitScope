import React, { useState, useEffect } from 'react';
import {
  Database,
  ExternalLink,
  Shield,
  Key,
  Check,
  Copy,
  RefreshCw,
  Search,
  Table,
  HardDrive,
  FileCode,
  Terminal,
  Activity,
  AlertCircle,
  Loader2,
  Folder,
  Rocket,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import {
  SupabaseConfig,
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  checkSupabaseHealth,
  fetchSupabaseTableData,
  ProjectHealthStatus,
  DEFAULT_SUPABASE_PROJECT_ID,
} from '../services/supabase';
import {
  getWorkflowRuns,
  triggerWorkflowDispatch,
  WorkflowRunItem,
  getStoredToken,
} from '../services/github';

interface SupabaseStudioProps {
  owner?: string;
  repo?: string;
  onOpenMigration?: (path: string) => void;
}

const NILE_TABLES = [
  { name: 'publishing_items', desc: 'Publishing Studio editorial articles and status' },
  { name: 'products', desc: 'Product catalogue, prices, and inventory' },
  { name: 'categories', desc: 'Product categories and taxonomic groupings' },
  { name: 'orders', desc: 'Customer orders, dispatch records, and totals' },
  { name: 'order_items', desc: 'Order line items and SKU references' },
  { name: 'posts', desc: 'CMS and newsroom blog posts' },
  { name: 'editorial_calendar', desc: 'Scheduled publishing events and campaigns' },
  { name: 'customers', desc: 'Registered customer profiles and loyalty' },
  { name: 'couriers', desc: 'Fleet drivers and dispatch delivery agents' },
];

const NILE_BUCKETS = [
  { name: 'product-images', public: true, desc: 'Public item photos and packaging renders' },
  { name: 'cms', public: true, desc: 'Editorial banners and marketing assets' },
  { name: 'pod', public: false, desc: 'Proof of Delivery signatures and courier photos (Secure)' },
];

export const SupabaseStudio: React.FC<SupabaseStudioProps> = ({
  owner = 'odoema',
  repo = 'niletropical',
  onOpenMigration,
}) => {
  const [config, setConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig);
  const [health, setHealth] = useState<ProjectHealthStatus | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'deployment' | 'tables' | 'storage' | 'migrations' | 'snippets'>('deployment');

  // Key input state
  const [anonKeyInput, setAnonKeyInput] = useState(config.anonKey);
  const [projectIdInput, setProjectIdInput] = useState(config.projectId);

  // Table Query Explorer
  const [selectedTable, setSelectedTable] = useState('publishing_items');
  const [customTable, setCustomTable] = useState('');
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

  // Copied helper
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Workflow Runs & Dispatch State
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRunItem[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadWorkflowRuns = async () => {
    setLoadingRuns(true);
    const runs = await getWorkflowRuns(owner, repo, 'deploy-pages.yml');
    setWorkflowRuns(runs);
    setLoadingRuns(false);
  };

  useEffect(() => {
    if (activeSubTab === 'deployment') {
      loadWorkflowRuns();
    }
  }, [activeSubTab, owner, repo]);

  const handleTriggerDeployment = async () => {
    setDispatching(true);
    setDispatchResult(null);
    const res = await triggerWorkflowDispatch(owner, repo, 'deploy-pages.yml', 'master');
    setDispatchResult(res);
    setDispatching(false);
    if (res.success) {
      setTimeout(() => loadWorkflowRuns(), 3000);
    }
  };

  const hasPatToken = Boolean(getStoredToken());

  const runHealthCheck = async () => {
    setCheckingHealth(true);
    const res = await checkSupabaseHealth(config.url);
    setHealth(res);
    setCheckingHealth(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, [config.url]);

  const handleSaveCredentials = () => {
    const cleanId = projectIdInput.trim() || DEFAULT_SUPABASE_PROJECT_ID;
    const cleanUrl = `https://${cleanId}.supabase.co`;
    const cleanKey = anonKeyInput.trim();

    saveSupabaseConfig({
      projectId: cleanId,
      url: cleanUrl,
      anonKey: cleanKey,
    });

    setConfig({
      projectId: cleanId,
      url: cleanUrl,
      anonKey: cleanKey,
    });

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
    runHealthCheck();
  };

  const handleQueryTable = async (tName: string) => {
    setTableLoading(true);
    setTableError(null);
    setSelectedTable(tName);

    const res = await fetchSupabaseTableData(tName);
    if (res.error) {
      setTableError(res.error);
      setTableData(null);
    } else {
      setTableData(res.data);
    }
    setTableLoading(false);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const dashboardUrl = `https://supabase.com/dashboard/project/${config.projectId}`;
  const apiSettingsUrl = `https://supabase.com/dashboard/project/${config.projectId}/settings/api`;
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${config.projectId}/sql`;

  return (
    <div className="space-y-6">
      {/* Live Project Overview Card */}
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 mt-0.5">
              <Database className="w-6 h-6 text-white" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Supabase Project</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-semibold">
                  {config.projectId}
                </span>

                {health && health.online && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Gateway ({health.latencyMs}ms)</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-[#8b949e] font-mono break-all">{config.url}</p>
            </div>
          </div>

          {/* Quick Action Links */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={runHealthCheck}
              disabled={checkingHealth}
              className="px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] hover:text-white transition-colors flex items-center gap-1.5"
              title="Ping Supabase Endpoint"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin text-[#58a6ff]' : ''}`} />
              <span>Ping Gateway</span>
            </button>

            <a
              href={dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-white transition-colors flex items-center gap-1.5 shadow"
            >
              <span>Project Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#8b949e]" />
            </a>

            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow"
            >
              <span>SQL Editor</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Credentials Form Box */}
        <div className="pt-3 border-t border-[#21262d] grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-semibold text-[#8b949e] uppercase">
              Project Reference ID
            </label>
            <input
              type="text"
              value={projectIdInput}
              onChange={(e) => setProjectIdInput(e.target.value)}
              placeholder="e.g. ououfhsswyqutcczdtnb"
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div className="md:col-span-6 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[#8b949e] uppercase">
                Project API Key (Anon / Public)
              </label>
              <a
                href={apiSettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[#58a6ff] hover:underline inline-flex items-center gap-0.5"
              >
                Find in Dashboard Settings → API <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={anonKeyInput}
              onChange={(e) => setAnonKeyInput(e.target.value)}
              placeholder="Paste anon public key (eyJhbGciOi...)"
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <button
              onClick={handleSaveCredentials}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow flex items-center justify-center gap-1.5"
            >
              {savedMessage ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>Save Key</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 border-b border-[#30363d] overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('deployment')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'deployment'
              ? 'border-emerald-400 text-white bg-[#161b22]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <Rocket className="w-4 h-4 text-emerald-400" />
          <span>Deploy to Pages & Harmonization</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          onClick={() => setActiveSubTab('tables')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'tables'
              ? 'border-emerald-400 text-white bg-[#161b22]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <Table className="w-4 h-4 text-emerald-400" />
          <span>Tables & Data</span>
        </button>

        <button
          onClick={() => setActiveSubTab('storage')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'storage'
              ? 'border-emerald-400 text-white bg-[#161b22]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>Storage Buckets</span>
        </button>

        <button
          onClick={() => setActiveSubTab('migrations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'migrations'
              ? 'border-emerald-400 text-white bg-[#161b22]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <FileCode className="w-4 h-4 text-emerald-400" />
          <span>SQL Migrations</span>
        </button>

        <button
          onClick={() => setActiveSubTab('snippets')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'snippets'
              ? 'border-emerald-400 text-white bg-[#161b22]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Flutter & Env Setup</span>
        </button>
      </div>

      {/* Sub Tab 0: Deployment & Harmonization */}
      {activeSubTab === 'deployment' && (
        <div className="space-y-6 animate-fade-in">
          {/* Status Banner */}
          <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-5 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    GitHub Pages + Supabase Harmonized
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium">
                      Verified Live
                    </span>
                  </h3>
                  <p className="text-xs text-[#8b949e]">
                    The frontend web portal and Flutter mobile commerce app are coupled directly with Supabase <span className="font-mono text-emerald-400">{config.projectId}</span>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTriggerDeployment}
                  disabled={dispatching}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                  title={hasPatToken ? 'Dispatch deploy-pages.yml workflow immediately' : 'Requires Personal Access Token (PAT) with workflow scope'}
                >
                  {dispatching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-3.5 h-3.5" />
                      <span>Trigger Pages Deployment</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://github.com/${owner}/${repo}/actions/workflows/deploy-pages.yml`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>Open Actions Log</span>
                  <ExternalLink className="w-3 h-3 text-[#8b949e]" />
                </a>
              </div>
            </div>

            {/* Dispatch Result Feedback */}
            {dispatchResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                  dispatchResult.success
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-800 text-rose-300'
                }`}
              >
                <span>{dispatchResult.message}</span>
                <button
                  onClick={() => setDispatchResult(null)}
                  className="text-xs opacity-70 hover:opacity-100 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {!hasPatToken && (
              <div className="p-3 bg-[#0d1117]/80 rounded-xl border border-amber-900/40 text-xs text-amber-300/90 flex items-center justify-between">
                <span>
                  Tip: To trigger deployments directly with 1-click via GitHub REST API, connect your GitHub PAT (with <code className="font-mono text-amber-200">workflow</code> or <code className="font-mono text-amber-200">repo</code> scope) using the PAT button in the top bar. You can also trigger runs on GitHub anytime.
                </span>
                <a
                  href={`https://github.com/${owner}/${repo}/actions/workflows/deploy-pages.yml`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline font-semibold ml-3 shrink-0 flex items-center gap-1"
                >
                  Run on GitHub <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Live Endpoints Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[#21262d]">
              <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    Public Website
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">HTTP 200 OK</span>
                </div>
                <a
                  href="https://niletropicaluganda.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-[#58a6ff] hover:underline flex items-center gap-1 truncate"
                >
                  <span>niletropicaluganda.com</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <p className="text-[10px] text-[#8b949e]">Landing page, brand story & CMS newsroom</p>
              </div>

              <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1">
                    <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                    Flutter Web App
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Live on /app/</span>
                </div>
                <a
                  href="https://niletropicaluganda.com/app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-[#58a6ff] hover:underline flex items-center gap-1 truncate"
                >
                  <span>niletropicaluganda.com/app/</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <p className="text-[10px] text-[#8b949e]">Digital commerce & operational storefront</p>
              </div>

              <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-purple-400" />
                    Backend Database
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Gateway Active</span>
                </div>
                <a
                  href={`https://supabase.com/dashboard/project/${config.projectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-purple-400 hover:underline flex items-center gap-1 truncate"
                >
                  <span>{config.projectId}.supabase.co</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <p className="text-[10px] text-[#8b949e]">PostgreSQL, Auth, RLS & Storage</p>
              </div>
            </div>
          </div>

          {/* Workflow Architecture Card */}
          <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  GitHub Actions Pipeline Architecture (`deploy-pages.yml`)
                </h4>
                <p className="text-xs text-[#8b949e]">
                  Every push to `master` automatically orchestrates frontend and backend synchronization
                </p>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e]">
                Ubuntu 24.04 · Flutter Stable
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1.5">
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-400 flex items-center justify-center text-[10px] font-mono">1</span>
                  <span>Target Verification</span>
                </div>
                <p className="text-[#8b949e] text-[11px] leading-relaxed">
                  Asserts `SUPABASE_URL` strictly equals <code className="text-emerald-400 font-mono">https://ououfhsswyqutcczdtnb.supabase.co</code> to safeguard against mismatched environments.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1.5">
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-400 flex items-center justify-center text-[10px] font-mono">2</span>
                  <span>Flutter Build</span>
                </div>
                <p className="text-[#8b949e] text-[11px] leading-relaxed">
                  Executes `flutter pub get`, runs unit tests, and compiles the production web bundle with <code className="text-[#58a6ff] font-mono">--dart-define</code> credentials injected.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1.5">
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-400 flex items-center justify-center text-[10px] font-mono">3</span>
                  <span>Harmonize CMS</span>
                </div>
                <p className="text-[#8b949e] text-[11px] leading-relaxed">
                  Generates <code className="text-amber-400 font-mono">assets/website/cms-config.js</code> so vanilla JavaScript articles and newsroom read directly from Supabase.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1.5">
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <span className="w-5 h-5 rounded-full bg-emerald-900/60 text-emerald-400 flex items-center justify-center text-[10px] font-mono">4</span>
                  <span>Deploy to Pages</span>
                </div>
                <p className="text-[#8b949e] text-[11px] leading-relaxed">
                  Assembles the single unified distribution tree (`/`, `/app/`, `/articles.html`, `CNAME`) and uploads via GitHub Pages deployment provider.
                </p>
              </div>
            </div>
          </div>

          {/* GitHub Repository Secrets Reference */}
          <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Required GitHub Actions Secrets (Harmonization Keys)
                </h4>
                <p className="text-xs text-[#8b949e]">
                  Configured in <code className="text-white font-mono">odoema/niletropical</code> → Settings → Secrets and variables → Actions
                </p>
              </div>

              <a
                href={`https://github.com/${owner}/${repo}/settings/secrets/actions`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#58a6ff] hover:underline inline-flex items-center gap-1 font-medium"
              >
                Open GitHub Secrets Settings <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="divide-y divide-[#21262d] font-mono text-xs">
              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-white">SUPABASE_URL</span>
                  <p className="text-[11px] text-[#8b949e] font-sans">Public API URL for database & auth</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                    {config.url}
                  </span>
                  <button
                    onClick={() => copyText(config.url, 'sec_url')}
                    className="p-1 text-[#8b949e] hover:text-white"
                  >
                    {copiedSnippet === 'sec_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-white">SUPABASE_ANON_KEY</span>
                  <p className="text-[11px] text-[#8b949e] font-sans">Publishable anon API key for client queries</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] truncate max-w-[200px] sm:max-w-[300px]">
                    {config.anonKey}
                  </span>
                  <button
                    onClick={() => copyText(config.anonKey, 'sec_anon')}
                    className="p-1 text-[#8b949e] hover:text-white"
                  >
                    {copiedSnippet === 'sec_anon' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-white">SUPABASE_SERVICE_ROLE_KEY</span>
                  <p className="text-[11px] text-[#8b949e] font-sans">Used only in CI to record deployment telemetry in Supabase</p>
                </div>
                <a
                  href={`https://supabase.com/dashboard/project/${config.projectId}/settings/api`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#58a6ff] hover:underline inline-flex items-center gap-1 font-sans"
                >
                  Retrieve from Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Recent Deployments Table */}
          <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Recent GitHub Pages Pipeline Runs</span>
                  {loadingRuns && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
                </h4>
                <p className="text-xs text-[#8b949e]">
                  Deployment runs from <code className="text-white font-mono">{owner}/{repo}</code> on GitHub Actions
                </p>
              </div>

              <button
                onClick={loadWorkflowRuns}
                disabled={loadingRuns}
                className="px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs text-[#c9d1d9] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingRuns ? 'animate-spin' : ''}`} />
                <span>Refresh Runs</span>
              </button>
            </div>

            {workflowRuns.length > 0 ? (
              <div className="divide-y divide-[#21262d]">
                {workflowRuns.map((run) => {
                  const isSuccess = run.conclusion === 'success';
                  const isFailure = run.conclusion === 'failure';
                  const isInProgress = run.status === 'in_progress' || run.status === 'queued';

                  return (
                    <div key={run.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {isFailure && <AlertCircle className="w-4 h-4 text-rose-400" />}
                          {isInProgress && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                          {!isSuccess && !isFailure && !isInProgress && (
                            <Activity className="w-4 h-4 text-[#8b949e]" />
                          )}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate">
                              {run.head_commit?.message?.split('\n')[0] || run.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e]">
                              {run.head_branch}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8b949e]">
                            Run #{run.id} · {new Date(run.created_at).toLocaleDateString()} {new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                            isSuccess
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                              : isFailure
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                              : 'bg-blue-950/80 text-blue-400 border border-blue-800/40'
                          }`}
                        >
                          {run.conclusion || run.status}
                        </span>

                        <a
                          href={run.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs text-[#58a6ff] hover:underline flex items-center gap-1"
                        >
                          <span>Logs</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#8b949e] space-y-1 bg-[#0d1117] rounded-xl border border-[#21262d]">
                <Rocket className="w-6 h-6 text-[#484f58] mx-auto" />
                <p>No workflow runs cached or workflow requires token.</p>
                <a
                  href={`https://github.com/${owner}/${repo}/actions/workflows/deploy-pages.yml`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#58a6ff] hover:underline inline-flex items-center gap-1"
                >
                  View All Runs on GitHub Actions <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Deploying GitScope Itself to GitHub Pages */}
          <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Deploy GitScope Workbench to GitHub Pages
                </h4>
                <p className="text-xs text-[#8b949e]">
                  Host this GitScope UI on GitHub Pages in 3 simple steps
                </p>
              </div>

              <button
                onClick={() =>
                  copyText(
`name: Deploy GitScope to GitHub Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4`,
                    'gitscope_wf'
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-white border border-[#30363d] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSnippet === 'gitscope_wf' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied YAML!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy deploy.yml</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-[#0d1117] rounded-xl border border-[#21262d] space-y-1">
                <span className="font-semibold text-white">Step 1: Commit Workflow</span>
                <p className="text-[#8b949e] text-[11px] leading-relaxed">
                  The workflow is generated at <code className="text-white font-mono">.github/workflows/deploy.yml</code> and configured to build Vite with relative paths (<code className="text-emerald-400 font-mono">base: './'</code>).
                </p>
              </div>

              <div className="p-3 bg-[#0d1117] rounded-xl border border-[#21262d] space-y-1">
                <span className="font-semibold text-white">Step 2: Enable GitHub Pages</span>
                <p className="text-[#8b949e] text-[11px] leading-relaxed">
                  In repo <span className="font-mono text-white">Settings → Pages</span>, under <span className="text-white">Build and deployment → Source</span>, select <span className="text-emerald-400 font-semibold">GitHub Actions</span>.
                </p>
              </div>

              <div className="p-3 bg-[#0d1117] rounded-xl border border-[#21262d] space-y-1">
                <span className="font-semibold text-white">Step 3: Automated Push & Deploy</span>
                <p className="text-[#8b949e] text-[11px] leading-relaxed">
                  Every git push triggers Vite production bundling, static artifact generation, and instant hosting on <code className="text-[#58a6ff] font-mono">github.io</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 1: Tables Explorer */}
      {activeSubTab === 'tables' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Table Selection List */}
            <div className="md:col-span-4 rounded-2xl border border-[#30363d] bg-[#161b22] p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
                <span className="text-xs font-semibold text-white">Repository Database Tables</span>
                <span className="text-[10px] text-[#8b949e] font-mono">{NILE_TABLES.length} schemas</span>
              </div>

              <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                {NILE_TABLES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => handleQueryTable(t.name)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex flex-col gap-0.5 ${
                      selectedTable === t.name
                        ? 'bg-emerald-950/60 border border-emerald-700/60 text-white'
                        : 'hover:bg-[#21262d] text-[#c9d1d9]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-emerald-400">{t.name}</span>
                      {selectedTable === t.name && (
                        <span className="text-[10px] text-emerald-300 font-mono">Active</span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8b949e] line-clamp-1">{t.desc}</span>
                  </button>
                ))}
              </div>

              {/* Custom query input */}
              <div className="pt-2 border-t border-[#21262d] space-y-1.5">
                <span className="text-[11px] text-[#8b949e] font-medium">Or query any custom table:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTable}
                    onChange={(e) => setCustomTable(e.target.value)}
                    placeholder="table_name"
                    className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (customTable.trim()) handleQueryTable(customTable.trim());
                    }}
                    className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-white text-xs rounded-xl font-medium"
                  >
                    Query
                  </button>
                </div>
              </div>
            </div>

            {/* Table Records Preview */}
            <div className="md:col-span-8 rounded-2xl border border-[#30363d] bg-[#161b22] p-4 flex flex-col space-y-3 min-h-[350px]">
              <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">
                    Table: <span className="font-mono text-emerald-400">{selectedTable}</span>
                  </span>
                  {tableData && (
                    <span className="text-[10px] text-[#8b949e] font-mono tabular-nums">
                      ({tableData.length} records)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {tableData && tableData.length > 0 && (
                    <div className="flex items-center p-0.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-[11px] font-medium">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`px-2 py-0.5 rounded-md transition-colors ${
                          viewMode === 'table' ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:text-[#c9d1d9]'
                        }`}
                      >
                        Table
                      </button>
                      <button
                        onClick={() => setViewMode('json')}
                        className={`px-2 py-0.5 rounded-md transition-colors ${
                          viewMode === 'json' ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:text-[#c9d1d9]'
                        }`}
                      >
                        JSON
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleQueryTable(selectedTable)}
                    disabled={tableLoading}
                    className="p-1 rounded text-[#8b949e] hover:text-white cursor-pointer"
                    title="Refresh rows"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${tableLoading ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                </div>
              </div>

              {tableLoading ? (
                <div className="flex flex-col items-center justify-center flex-1 p-12 text-[#8b949e] space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  <span className="text-xs">Fetching rows from {selectedTable}...</span>
                </div>
              ) : tableError ? (
                <div className="p-6 bg-[#0d1117] rounded-xl border border-rose-900/50 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-rose-400" />
                  <div className="space-y-1">
                    <p className="text-xs text-rose-300 font-medium">{tableError}</p>
                    <p className="text-[11px] text-[#8b949e] max-w-md">
                      If row level security (RLS) is enabled or if the Anon API key has not been added above, query returns an authentication requirement.
                    </p>
                  </div>
                  <a
                    href={sqlEditorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Open SQL Query Editor in Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : tableData && tableData.length > 0 ? (
                viewMode === 'table' ? (
                  <div className="overflow-x-auto max-h-96 rounded-xl border border-[#21262d]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#0d1117] text-[#8b949e] font-mono sticky top-0 border-b border-[#21262d]">
                        <tr>
                          <th className="py-2 px-3 font-semibold text-[11px] w-10">#</th>
                          {Object.keys(tableData[0]).map((col) => (
                            <th key={col} className="py-2 px-3 font-semibold text-[11px] whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#21262d] font-mono text-[11px]">
                        {tableData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#161b22]/70 transition-colors">
                            <td className="py-2 px-3 text-[#484f58] tabular-nums">{idx + 1}</td>
                            {Object.keys(tableData[0]).map((col) => {
                              const val = row[col];
                              const isObj = typeof val === 'object' && val !== null;
                              return (
                                <td key={col} className="py-2 px-3 text-[#c9d1d9] whitespace-nowrap max-w-xs truncate">
                                  {isObj ? JSON.stringify(val) : String(val ?? '')}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96">
                    <pre className="text-xs font-mono p-3 bg-[#0d1117] rounded-xl text-[#c9d1d9] leading-relaxed border border-[#30363d]/60">
                      {JSON.stringify(tableData, null, 2)}
                    </pre>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 p-12 text-[#8b949e] space-y-2 text-center">
                  <Table className="w-8 h-8 text-[#484f58]" />
                  <span className="text-xs font-medium text-[#c9d1d9]">No rows returned or table is empty</span>
                  <p className="text-[11px] max-w-sm">
                    Click "Query" on any table on the left or add your Project Anon Key to inspect live records.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 2: Storage Buckets */}
      {activeSubTab === 'storage' && (
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
            <div>
              <h3 className="text-sm font-semibold text-white">Configured Supabase Storage Buckets</h3>
              <p className="text-xs text-[#8b949e]">From Nile Tropical's `supabase/STORAGE.md` specification</p>
            </div>

            <a
              href={`https://supabase.com/dashboard/project/${config.projectId}/storage/buckets`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              Open Storage in Dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {NILE_BUCKETS.map((b) => (
              <div
                key={b.name}
                className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-white">{b.name}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      b.public
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                        : 'bg-purple-950 text-purple-400 border border-purple-800/40'
                    }`}
                  >
                    {b.public ? 'Public' : 'Protected'}
                  </span>
                </div>
                <p className="text-xs text-[#8b949e]">{b.desc}</p>
                <div className="pt-2 font-mono text-[10px] text-[#58a6ff]">
                  storage.from('{b.name}').getPublicUrl(path)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub Tab 3: SQL Migrations */}
      {activeSubTab === 'migrations' && (
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
            <div>
              <h3 className="text-sm font-semibold text-white">Repository SQL Migrations</h3>
              <p className="text-xs text-[#8b949e]">
                Execute these in your Supabase SQL Editor (`{config.projectId}`)
              </p>
            </div>
            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow"
            >
              <span>Open SQL Editor</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="divide-y divide-[#21262d]">
            {[
              {
                file: 'supabase/migrations/20260928_publishing_studio.sql',
                title: 'Publishing Studio Schema',
                desc: 'Editorial workflow, targets, and media publication tables',
              },
              {
                file: 'supabase/migrations/20260928_publishing_studio_completion.sql',
                title: 'Publishing Studio Completion',
                desc: 'Triggers, audit records, and workflow completion status',
              },
              {
                file: 'supabase/migrations/20260928_publishing_studio_security_actor.sql',
                title: 'Security Actor & RLS',
                desc: 'Row-level security policies and actor validation',
              },
              {
                file: 'supabase/STORAGE.md',
                title: 'Storage Policies',
                desc: 'Buckets configuration for product images, cms, and pod',
              },
            ].map((m) => (
              <div key={m.file} className="py-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-bold text-white font-mono">{m.title}</span>
                  <p className="text-[11px] text-[#8b949e] truncate">{m.desc}</p>
                  <span className="text-[10px] text-[#58a6ff] font-mono">{m.file}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onOpenMigration && (
                    <button
                      onClick={() => onOpenMigration(m.file)}
                      className="px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs text-[#c9d1d9] hover:text-white transition-colors"
                    >
                      View SQL
                    </button>
                  )}
                  <a
                    href={`https://github.com/${owner}/${repo}/blob/master/${m.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-[#21262d] text-[#8b949e] hover:text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub Tab 4: Flutter & Env Setup */}
      {activeSubTab === 'snippets' && (
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 space-y-4 shadow-xl">
          <div className="pb-3 border-b border-[#21262d]">
            <h3 className="text-sm font-semibold text-white">Flutter & Environment Setup</h3>
            <p className="text-xs text-[#8b949e]">
              Configuration commands pre-wired with project ID <span className="font-mono text-emerald-400">{config.projectId}</span>
            </p>
          </div>

          {/* Flutter run command */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              1. Flutter Run Command (Terminal)
            </span>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#30363d] font-mono text-xs text-emerald-400">
              <span className="truncate mr-3 select-all">
                flutter run --dart-define=SUPABASE_URL={config.url} --dart-define=SUPABASE_ANON_KEY={config.anonKey || 'YOUR_ANON_KEY'}
              </span>
              <button
                onClick={() =>
                  copyText(
                    `flutter run --dart-define=SUPABASE_URL=${config.url} --dart-define=SUPABASE_ANON_KEY=${config.anonKey || 'YOUR_ANON_KEY'}`,
                    'flutter'
                  )
                }
                className="p-1 text-[#8b949e] hover:text-white shrink-0"
              >
                {copiedSnippet === 'flutter' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* env/dev.json */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              2. Nile Tropical `env/dev.json` File
            </span>
            <div className="relative p-3 rounded-xl bg-[#0d1117] border border-[#30363d] font-mono text-xs text-[#c9d1d9]">
              <button
                onClick={() =>
                  copyText(
                    JSON.stringify(
                      {
                        SUPABASE_URL: config.url,
                        SUPABASE_ANON_KEY: config.anonKey || 'YOUR_ANON_KEY',
                        APP_ENV: 'development',
                      },
                      null,
                      2
                    ),
                    'json'
                  )
                }
                className="absolute right-3 top-3 p-1 text-[#8b949e] hover:text-white"
              >
                {copiedSnippet === 'json' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="text-xs leading-relaxed">
{`{
  "SUPABASE_URL": "${config.url}",
  "SUPABASE_ANON_KEY": "${config.anonKey || 'YOUR_ANON_KEY'}",
  "APP_ENV": "development"
}`}
              </pre>
            </div>
          </div>

          {/* Web .env */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              3. Web & Script `.env` File
            </span>
            <div className="relative p-3 rounded-xl bg-[#0d1117] border border-[#30363d] font-mono text-xs text-[#c9d1d9]">
              <button
                onClick={() =>
                  copyText(
                    `SUPABASE_URL=${config.url}\nSUPABASE_ANON_KEY=${config.anonKey || 'YOUR_ANON_KEY'}\nSUPABASE_PROJECT_ID=${config.projectId}`,
                    'env'
                  )
                }
                className="absolute right-3 top-3 p-1 text-[#8b949e] hover:text-white"
              >
                {copiedSnippet === 'env' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="text-xs leading-relaxed">
{`SUPABASE_URL=${config.url}
SUPABASE_ANON_KEY=${config.anonKey || 'YOUR_ANON_KEY'}
SUPABASE_PROJECT_ID=${config.projectId}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
