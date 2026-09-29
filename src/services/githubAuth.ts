/**
 * "Sign in with GitHub" (OAuth popup flow). The server holds the client secret and
 * exchanges the code; the browser only ever receives the resulting access token.
 * Falls back gracefully (configured=false) on static hosts like GitHub Pages.
 */
import { setStoredToken, fetchAuthenticatedUser, setCachedUser, GitHubUser } from './github';

export interface OAuthStatus {
  configured: boolean;
  scopes?: string;
}

export const getOAuthStatus = async (): Promise<OAuthStatus> => {
  try {
    const res = await fetch('/api/auth/github/status');
    if (!res.ok) return { configured: false };
    const data = await res.json();
    return { configured: !!data.configured, scopes: data.scopes };
  } catch {
    return { configured: false };
  }
};

/** Verifies a token against GitHub, stores it on success, and caches the user. */
export const connectWithToken = async (token: string): Promise<GitHubUser> => {
  const previous = localStorage.getItem('gitscope_gh_token') || '';
  setStoredToken(token);
  try {
    const user = await fetchAuthenticatedUser();
    setCachedUser(user);
    return user;
  } catch (err) {
    setStoredToken(previous); // roll back so a bad token doesn't lock the app
    throw err;
  }
};

export const signInWithGitHub = async (): Promise<GitHubUser> => {
  const res = await fetch('/api/auth/github/url');
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Could not start GitHub sign-in.');
  }

  const w = 600;
  const h = 700;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  const popup = window.open(data.url, 'gitscope_github_oauth', `width=${w},height=${h},left=${left},top=${top}`);
  if (!popup) {
    throw new Error('Popup blocked. Allow popups for this site and try again.');
  }

  const token = await new Promise<string>((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      clearInterval(closedPoll);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const msg = event.data;
      if (!msg || msg.type !== 'GITSCOPE_GITHUB_OAUTH') return;
      cleanup();
      if (msg.token) resolve(msg.token as string);
      else reject(new Error(msg.error || 'GitHub sign-in failed.'));
    };
    const closedPoll = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('Sign-in window was closed before finishing.'));
      }
    }, 500);
    window.addEventListener('message', onMessage);
  });

  return connectWithToken(token);
};
