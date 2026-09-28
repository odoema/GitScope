import React, { useState } from 'react';
import { X, Copy, Check, Download, ExternalLink, Terminal } from 'lucide-react';
import { GitHubRepo } from '../services/github';

interface CloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: GitHubRepo;
}

export const CloneModal: React.FC<CloneModalProps> = ({ isOpen, onClose, repo }) => {
  const [tab, setTab] = useState<'https' | 'ssh' | 'cli'>('https');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getCommand = () => {
    switch (tab) {
      case 'https':
        return `git clone ${repo.clone_url}`;
      case 'ssh':
        return `git clone ${repo.ssh_url}`;
      case 'cli':
        return `gh repo clone ${repo.full_name}`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const zipUrl = `https://github.com/${repo.owner.login}/${repo.name}/archive/refs/heads/${repo.default_branch}.zip`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-[#30363d] bg-[#161b22] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#58a6ff]" />
            <h3 className="text-sm font-semibold text-white">Clone or Download Repository</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b949e] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Method Tabs */}
          <div className="flex bg-[#0d1117] p-1 rounded-lg border border-[#30363d] text-xs">
            <button
              onClick={() => setTab('https')}
              className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                tab === 'https' ? 'bg-[#21262d] text-white shadow' : 'text-[#8b949e]'
              }`}
            >
              HTTPS
            </button>
            <button
              onClick={() => setTab('ssh')}
              className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                tab === 'ssh' ? 'bg-[#21262d] text-white shadow' : 'text-[#8b949e]'
              }`}
            >
              SSH
            </button>
            <button
              onClick={() => setTab('cli')}
              className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                tab === 'cli' ? 'bg-[#21262d] text-white shadow' : 'text-[#8b949e]'
              }`}
            >
              GitHub CLI
            </button>
          </div>

          {/* Command display */}
          <div className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 font-mono text-xs text-[#c9d1d9]">
            <span className="truncate flex-1 select-all">{getCommand()}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] transition-colors shrink-0"
              title="Copy command"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-[#8b949e]" />
              )}
            </button>
          </div>

          {/* Download Zip option */}
          <div className="pt-2 border-t border-[#21262d]">
            <a
              href={zipUrl}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold border border-[#30363d] transition-colors"
            >
              <Download className="w-4 h-4 text-[#58a6ff]" />
              <span>Download ZIP ({repo.default_branch})</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
