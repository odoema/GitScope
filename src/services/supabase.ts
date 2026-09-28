import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_KEY = 'gitscope_supabase_project_id';
const SUPABASE_URL_KEY = 'gitscope_supabase_url';
const SUPABASE_ANON_KEY = 'gitscope_supabase_anon_key';

export const DEFAULT_SUPABASE_PROJECT_ID = 'ououfhsswyqutcczdtnb';
export const DEFAULT_SUPABASE_URL = `https://${DEFAULT_SUPABASE_PROJECT_ID}.supabase.co`;
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_sAO-3qit2yxwNa9MsMHLyw_UObEWQBl';

export interface SupabaseConfig {
  projectId: string;
  url: string;
  anonKey: string;
}

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  const projectId = localStorage.getItem(SUPABASE_PROJECT_KEY) || DEFAULT_SUPABASE_PROJECT_ID;
  const url = localStorage.getItem(SUPABASE_URL_KEY) || `https://${projectId}.supabase.co`;
  const anonKey = localStorage.getItem(SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY;

  return { projectId, url, anonKey };
};

export const saveSupabaseConfig = (config: Partial<SupabaseConfig>): void => {
  if (config.projectId !== undefined) {
    const cleanId = config.projectId.trim();
    localStorage.setItem(SUPABASE_PROJECT_KEY, cleanId);
    if (!config.url) {
      localStorage.setItem(SUPABASE_URL_KEY, `https://${cleanId}.supabase.co`);
    }
  }
  if (config.url !== undefined) {
    localStorage.setItem(SUPABASE_URL_KEY, config.url.trim().replace(/\/$/, ''));
  }
  if (config.anonKey !== undefined) {
    localStorage.setItem(SUPABASE_ANON_KEY, config.anonKey.trim());
  }
};

export const getSupabaseClient = (url?: string, key?: string): SupabaseClient | null => {
  const config = getStoredSupabaseConfig();
  const targetUrl = url || config.url;
  const targetKey = key || config.anonKey;

  if (!targetUrl || !targetKey) return null;

  try {
    return createClient(targetUrl, targetKey);
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
};

export interface ProjectHealthStatus {
  online: boolean;
  projectRef: string;
  statusText: string;
  latencyMs: number;
  serverHeader?: string;
  requiresKey: boolean;
}

export const checkSupabaseHealth = async (url: string): Promise<ProjectHealthStatus> => {
  const start = performance.now();
  const cleanUrl = url.replace(/\/$/, '');

  try {
    const res = await fetch(`${cleanUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const latencyMs = Math.round(performance.now() - start);
    const projectRef = res.headers.get('sb-project-ref') || '';
    const server = res.headers.get('server') || 'Cloudflare';

    // 401 is expected when no API key is provided, which confirms the project is online and actively responding
    return {
      online: true,
      projectRef,
      statusText: res.status === 401 ? 'Online & Authenticated Gateway Active' : `HTTP ${res.status}`,
      latencyMs,
      serverHeader: server,
      requiresKey: res.status === 401,
    };
  } catch (err: any) {
    return {
      online: false,
      projectRef: '',
      statusText: err.message || 'Connection failed',
      latencyMs: Math.round(performance.now() - start),
      requiresKey: true,
    };
  }
};

export const fetchSupabaseTableData = async (
  tableName: string,
  limit: number = 25
): Promise<{ data: any[] | null; error: string | null; count?: number }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      data: null,
      error: 'Supabase client not initialized. Please add your Project Anon Key in settings.',
    };
  }

  try {
    const { data, error, count } = await client
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null, count: count || data?.length || 0 };
  } catch (err: any) {
    return { data: null, error: err.message || 'Query execution failed.' };
  }
};
