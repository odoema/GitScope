import React, { useEffect, useState } from 'react';
import { Key, Shield, ExternalLink, X, Check, Trash2, Zap, Github, Loader2, AlertCircle } from 'lucide-react';
import {
  getStoredToken,
  getCachedUser,
  disconnectGitHub,
  RateLimitState,
  GitHubUser,
} from '../services/github';
import { getOAuthStatus, signInWithGitHub, connectWithToken } from '../services/githubAuth';

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
  const [busy, setBusy] = useState<'oauth' | 'pat' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oauthAvailable, setOauthAvailable] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(getCachedUser());

  useEffect(() => {
    if (!isOpen) return;
    setTokenInput(getStoredToken());
    setUser(getCachedUser());
    setError(null);
    getOAuthStatus().then((s) => setOauthAvailable(s.configured));
  }, [isOpen]);

  if (!isOpen) return null;

  const finish = (u: GitHubUser) => {
    setUser(u);
    setSaved(true);
    onTokenChanged();
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleOAuth = async () => {
    setBusy('oauth');
    setError(null);
    try {
      finish(await signInWithGitHub());
    } catch (err: any) {
      setError(err.message || 'GitHub sign-in failed.');
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      handleClear();
      return;
    }
    setBusy('pat');
    setError(null);
    try {
      // Verifies the token against GitHub before keeping it
      finish(await connectWithToken(trimmed));
    } catch (err: any) {
      setError(
        /bad credentials/i.test(err.message || '')
          ? 'GitHub rejected this token. Check that it is correct and has not expired.'
          : err.message || 'Could not verify token.'
      );
    } finally {
      setBusy(null);
    }
  };

  const handleClear = () => {
    setTokenInput('');
    setUser(null);
    setError(null);
    disconnectGitHub();
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
              <p className="text-xs text-[#8b949e]">Sign in, Personal Access Token & Rate Limits</p>
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

          {/* Signed-in identity */}
          {user && getStoredToken() && (
            <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 p-3 flex items-center gap-3">
              <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full border border-[#30363d]" />
              <div className="min-w-0">
                <p className="text-xs text-emerald-300 font-medium">Connected as</p>
                <p className="text-sm text-white font-semibold truncate">@{user.login}</p>
              </div>
            </div>
          )}

          {/* Sign in with GitHub (OAuth) */}
          {oauthAvailable && (
            <div className="space-y-2">
              <button
                onClick={handleOAuth}
                disabled={busy !== null}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-200 text-[#0d1117] text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
              >
                {busy === 'oauth' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                {user && getStoredToken() ? 'Re-authorize with GitHub' : 'Sign in with GitHub'}
              </button>
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-[#484f58]">
                <div className="flex-1 h-px bg-[#30363d]" />
                or use a token
                <div className="flex-1 h-px bg-[#30363d]" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-900/50 bg-rose-950/20 px-3 py-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

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
              <li>Use the <code>repo</code> scope to list private repositories in “My GitHub”; no scopes are needed for public repos</li>
            </ul>
            <div className="pt-2">
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:org,read:user,workflow&description=GitScope"
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
              disabled={busy !== null}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#238636] hover:bg-[#2ea043] rounded-lg shadow transition-colors disabled:opacity-60"
            >
              {busy === 'pat' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying…
                </>
              ) : saved ? (
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
