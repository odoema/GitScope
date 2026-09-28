import React, { useState } from 'react';
import { Key, Shield, ExternalLink, X, Check, Trash2, Zap } from 'lucide-react';
import { getStoredToken, setStoredToken, RateLimitState } from '../services/github';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateLimit: RateLimitState;
  onTokenChanged: () => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({
  isOpen,
  onClose,
  rateLimit,
  onTokenChanged,
}) => {
  const [tokenInput, setTokenInput] = useState(getStoredToken());
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredToken(tokenInput);
    setSaved(true);
    onTokenChanged();
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setTokenInput('');
    setStoredToken('');
    onTokenChanged();
  };

  const minutesUntilReset = Math.max(
    0,
    Math.round((rateLimit.reset * 1000 - Date.now()) / (1000 * 60))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-[#30363d] bg-[#161b22] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#58a6ff]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">GitHub API Connection</h2>
              <p className="text-xs text-[#8b949e]">Personal Access Token & Rate Limits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Rate Limit Info Card */}
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-[#8b949e] font-medium flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Current Rate Limit Status
              </span>
              <p className="text-sm font-semibold text-white">
                <span className="text-[#58a6ff] text-base">{rateLimit.remaining}</span> / {rateLimit.limit} requests left
              </p>
            </div>
            <div className="text-right text-xs text-[#8b949e]">
              <span>Resets in</span>
              <p className="font-mono text-white font-medium">{minutesUntilReset} min</p>
            </div>
          </div>

          {/* Token Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#c9d1d9] uppercase tracking-wider">
              GitHub Personal Access Token (PAT)
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_... or github_pat_..."
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none transition-all placeholder:text-[#484f58]"
            />
            <p className="text-xs text-[#8b949e]">
              Your token stays strictly in your local browser storage and is sent only to GitHub's official API (`api.github.com`).
            </p>
          </div>

          {/* Why add a token */}
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117]/60 p-4 space-y-2 text-xs text-[#8b949e]">
            <span className="font-semibold text-[#c9d1d9] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              Why connect with a Token?
            </span>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                <strong className="text-white">5,000 requests/hour</strong> (Unauthenticated users are limited to 60/hr)
              </li>
              <li>
                Inspect <strong className="text-white">Private Repositories</strong> your account has access to
              </li>
              <li>Zero special scopes are needed for public repos (select `public_repo` or leave scopes empty)</li>
            </ul>
            <div className="pt-2">
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#58a6ff] hover:underline inline-flex items-center gap-1 font-medium"
              >
                Generate a GitHub Token <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0d1117] border-t border-[#30363d]">
          {getStoredToken() ? (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium px-3 py-2 rounded-lg hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Token
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#c9d1d9] hover:bg-[#21262d] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#238636] hover:bg-[#2ea043] rounded-lg shadow transition-colors"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                'Save Connection'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
