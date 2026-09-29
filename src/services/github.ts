/**
 * GitHub API Client and types for GitScope
 */

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
    type: string;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  clone_url: string;
  ssh_url: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string | null;
  } | null;
  topics?: string[];
  default_branch: string;
  subscribers_count?: number;
  network_count?: number;
}

export interface GitHubContentItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  content?: string;
  encoding?: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubCommit {
  sha: string;
  node_id: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    comment_count: number;
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  committer: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  parents: Array<{
    sha: string;
    url: string;
    html_url: string;
  }>;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
  }>;
  state: 'open' | 'closed';
  locked: boolean;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  body: string | null;
  html_url: string;
  pull_request?: {
    url: string;
    html_url: string;
  };
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  body: string | null;
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  };
  assets: Array<{
    id: number;
    name: string;
    size: number;
    download_count: number;
    browser_download_url: string;
  }>;
}

export interface GitHubContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface RateLimitState {
  limit: number;
  remaining: number;
  reset: number;
}

const TOKEN_KEY = 'gitscope_gh_token';

export const getStoredToken = (): string => {
  return localStorage.getItem(TOKEN_KEY) || '';
};

export const setStoredToken = (token: string): void => {
  if (token.trim()) {
    localStorage.setItem(TOKEN_KEY, token.trim());
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

let currentRateLimit: RateLimitState = {
  limit: 60,
  remaining: 60,
  reset: Math.floor(Date.now() / 1000) + 3600,
};

let rateLimitListeners: Array<(rate: RateLimitState) => void> = [];

export const subscribeRateLimit = (listener: (rate: RateLimitState) => void) => {
  rateLimitListeners.push(listener);
  listener(currentRateLimit);
  return () => {
    rateLimitListeners = rateLimitListeners.filter((l) => l !== listener);
  };
};

const notifyRateLimit = (res: Response) => {
  const limit = res.headers.get('x-ratelimit-limit');
  const remaining = res.headers.get('x-ratelimit-remaining');
  const reset = res.headers.get('x-ratelimit-reset');

  if (limit && remaining && reset) {
    currentRateLimit = {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
    };
    rateLimitListeners.forEach((l) => l(currentRateLimit));
  }
};

async function ghFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('https://') ? endpoint : `https://api.github.com${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  notifyRateLimit(response);

  if (!response.ok) {
    let errorMessage = `GitHub API Error (${response.status}: ${response.statusText})`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) {
        errorMessage = errorJson.message;
        if (response.status === 403 && errorMessage.includes('rate limit')) {
          errorMessage = 'GitHub API rate limit exceeded. Add a Personal Access Token in the top-right settings to get 5,000 requests/hour.';
        } else if (response.status === 404) {
          errorMessage = 'Repository or item not found. If this is a private repository, please add a Personal Access Token with repo access.';
        }
      }
    } catch {
      // Ignore json parse error
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export const fetchRepository = async (owner: string, repo: string): Promise<GitHubRepo> => {
  return ghFetch<GitHubRepo>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
};

export const fetchRepoContents = async (
  owner: string,
  repo: string,
  path: string = '',
  ref?: string
): Promise<GitHubContentItem | GitHubContentItem[]> => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const endpoint = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURI(cleanPath)}${
    ref ? `?ref=${encodeURIComponent(ref)}` : ''
  }`;
  return ghFetch<GitHubContentItem | GitHubContentItem[]>(endpoint);
};

export const fetchRepoGitTree = async (
  owner: string,
  repo: string,
  treeSha: string
): Promise<{ sha: string; tree: GitHubTreeItem[]; truncated: boolean }> => {
  return ghFetch<{ sha: string; tree: GitHubTreeItem[]; truncated: boolean }>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`
  );
};

export const fetchRepoBranches = async (owner: string, repo: string): Promise<GitHubBranch[]> => {
  return ghFetch<GitHubBranch[]>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100`);
};

export const fetchRepoCommits = async (
  owner: string,
  repo: string,
  ref?: string,
  page: number = 1
): Promise<GitHubCommit[]> => {
  const params = new URLSearchParams({
    per_page: '30',
    page: page.toString(),
  });
  if (ref) params.set('sha', ref);
  return ghFetch<GitHubCommit[]>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?${params}`);
};

export const fetchCommitDetail = async (
  owner: string,
  repo: string,
  commitSha: string
): Promise<GitHubCommit & { files?: Array<{ filename: string; status: string; additions: number; deletions: number; patch?: string }> }> => {
  return ghFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(commitSha)}`);
};

export const fetchRepoIssues = async (
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open',
  page: number = 1
): Promise<GitHubIssue[]> => {
  return ghFetch<GitHubIssue[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=${state}&per_page=30&page=${page}`
  );
};

export const fetchRepoLanguages = async (owner: string, repo: string): Promise<Record<string, number>> => {
  return ghFetch<Record<string, number>>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`);
};

export const fetchRepoContributors = async (owner: string, repo: string): Promise<GitHubContributor[]> => {
  return ghFetch<GitHubContributor[]>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors?per_page=30`);
};

export const fetchRepoReleases = async (owner: string, repo: string): Promise<GitHubRelease[]> => {
  return ghFetch<GitHubRelease[]>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases?per_page=20`);
};

export const fetchRepoReadme = async (owner: string, repo: string, ref?: string): Promise<{ content: string; name: string } | null> => {
  try {
    const endpoint = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`;
    const data = await ghFetch<{ content: string; encoding: string; name: string }>(endpoint);
    if (data.encoding === 'base64') {
      const decoded = decodeURIComponent(
        atob(data.content.replace(/\n/g, ''))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return { content: decoded, name: data.name };
    }
    return { content: atob(data.content), name: data.name };
  } catch {
    return null;
  }
};

export const decodeBase64Utf8 = (base64Str: string): string => {
  try {
    const cleaned = base64Str.replace(/\s/g, '');
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch {
    try {
      return atob(base64Str.replace(/\s/g, ''));
    } catch {
      return 'Error decoding file contents.';
    }
  }
};

export const searchGitHubRepos = async (query: string): Promise<GitHubRepo[]> => {
  if (!query.trim()) return [];
  const res = await ghFetch<{ items: GitHubRepo[] }>(`/search/repositories?q=${encodeURIComponent(query)}&per_page=8`);
  return res.items || [];
};

export const parseGitHubUrlOrSlug = (input: string): { owner: string; repo: string } | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Handle URL form: https://github.com/owner/repo or github.com/owner/repo
  const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)/i);
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2].replace(/\.git$/, '').replace(/\/$/, ''),
    };
  }

  // Handle slug form: owner/repo
  const parts = trimmed.split('/');
  if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
    return {
      owner: parts[0].trim(),
      repo: parts[1].trim().replace(/\.git$/, ''),
    };
  }

  return null;
};

export interface WorkflowRunItem {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  head_branch: string;
  head_commit?: {
    id: string;
    message: string;
  };
}

export const getWorkflowRuns = async (
  owner: string,
  repo: string,
  workflowFileName: string = 'deploy-pages.yml'
): Promise<WorkflowRunItem[]> => {
  try {
    const res = await ghFetch<{ workflow_runs: WorkflowRunItem[] }>(
      `/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/runs?per_page=5`
    );
    return res.workflow_runs || [];
  } catch (err) {
    console.warn('Failed to fetch workflow runs:', err);
    return [];
  }
};

export const triggerWorkflowDispatch = async (
  owner: string,
  repo: string,
  workflowFileName: string = 'deploy-pages.yml',
  ref: string = 'master'
): Promise<{ success: boolean; message: string }> => {
  const token = getStoredToken();
  if (!token) {
    return {
      success: false,
      message: 'GitHub Personal Access Token (PAT) with "workflow" or "repo" permission is required to trigger deployment.',
    };
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/dispatches`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref }),
      }
    );

    if (res.status === 204) {
      return {
        success: true,
        message: 'Deployment workflow dispatched successfully on GitHub Actions! Check runs below.',
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errData.message || `GitHub returned HTTP ${res.status}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error triggering deployment.',
    };
  }
};

// ─────────────────────────────────────────────────────────────
// Authenticated-user ("My GitHub") endpoints
// ─────────────────────────────────────────────────────────────

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  total_private_repos?: number;
  owned_private_repos?: number;
}

export interface GitHubOrg {
  login: string;
  id: number;
  avatar_url: string;
  description: string | null;
}

export type MyRepoSort = 'updated' | 'pushed' | 'full_name' | 'created';

export const fetchAuthenticatedUser = async (): Promise<GitHubUser> => {
  return ghFetch<GitHubUser>('/user');
};

export const fetchMyOrgs = async (): Promise<GitHubOrg[]> => {
  try {
    return await ghFetch<GitHubOrg[]>('/user/orgs?per_page=50');
  } catch {
    return []; // token may lack read:org
  }
};

/**
 * Repos the signed-in account can access: owned, collaborator, and org-member repos
 * (including private ones when the token has `repo` scope).
 */
export const fetchMyRepos = async (
  page: number = 1,
  sort: MyRepoSort = 'updated',
  perPage: number = 50
): Promise<GitHubRepo[]> => {
  const params = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
    sort,
    direction: sort === 'full_name' ? 'asc' : 'desc',
    affiliation: 'owner,collaborator,organization_member',
  });
  return ghFetch<GitHubRepo[]>(`/user/repos?${params}`);
};

// Cache the verified user so the header can render an avatar without refetching
const USER_KEY = 'gitscope_gh_user';

export const getCachedUser = (): GitHubUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as GitHubUser) : null;
  } catch {
    return null;
  }
};

export const setCachedUser = (user: GitHubUser | null): void => {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
};

/** Clears the token and any cached identity. */
export const disconnectGitHub = (): void => {
  setStoredToken('');
  setCachedUser(null);
};
