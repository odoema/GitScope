import React from 'react';
import {
  Code,
  GitCommit,
  AlertCircle,
  Tag,
  BarChart2,
  FolderGit2,
  Sparkles,
  Database,
} from 'lucide-react';

export type RepoTabType = 'code' | 'commits' | 'issues' | 'releases' | 'insights' | 'studio' | 'supabase';

interface RepoNavTabsProps {
  activeTab: RepoTabType;
  onChangeTab: (tab: RepoTabType) => void;
  openIssuesCount: number;
  hasSupabase?: boolean;
}

export const RepoNavTabs: React.FC<RepoNavTabsProps> = ({
  activeTab,
  onChangeTab,
  openIssuesCount,
  hasSupabase = true,
}) => {
  const tabs = [
    { id: 'code' as RepoTabType, label: 'Code', icon: <Code className="w-4 h-4" /> },
    { id: 'commits' as RepoTabType, label: 'Commits', icon: <GitCommit className="w-4 h-4" /> },
    {
      id: 'issues' as RepoTabType,
      label: 'Issues & PRs',
      icon: <AlertCircle className="w-4 h-4" />,
      badge: openIssuesCount > 0 ? openIssuesCount.toLocaleString() : undefined,
    },
    { id: 'releases' as RepoTabType, label: 'Releases', icon: <Tag className="w-4 h-4" /> },
    { id: 'insights' as RepoTabType, label: 'Insights', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'studio' as RepoTabType, label: 'AI Studio', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
    {
      id: 'supabase' as RepoTabType,
      label: 'Supabase',
      icon: <Database className="w-4 h-4 text-emerald-400" />,
      badge: hasSupabase ? 'Active' : undefined,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 border-b border-[#30363d]/80 overflow-x-auto scrollbar-none py-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap rounded-t-xl group cursor-pointer ${
              isActive
                ? 'border-blue-500 text-white bg-[#161b22] shadow-sm'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]/40'
            }`}
          >
            <span
              className={`transition-colors ${
                isActive
                  ? tab.id === 'supabase'
                    ? 'text-emerald-400'
                    : tab.id === 'studio'
                    ? 'text-purple-400'
                    : 'text-blue-400'
                  : 'text-[#8b949e] group-hover:text-[#c9d1d9]'
              }`}
            >
              {tab.icon}
            </span>
            <span className="font-semibold">{tab.label}</span>
            {tab.badge && (
              <span
                className={`px-1.5 py-0.5 text-[10px] rounded-md font-mono tabular-nums leading-none ${
                  tab.id === 'supabase'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                    : 'bg-[#21262d] text-[#8b949e] border border-[#30363d]'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
