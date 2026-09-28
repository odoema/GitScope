import React, { useState, useEffect } from 'react';
import {
  Search,
  Star,
  GitFork,
  ArrowRight,
  Clock,
  Sparkles,
  Code2,
  Cpu,
  Layers,
  Terminal,
  Loader2,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { GitHubRepo, searchGitHubRepos, parseGitHubUrlOrSlug } from '../services/github';

interface RepoDiscoveryProps {
  onSelectRepo: (owner: string, repo: string) => void;
  recentRepos: string[];
  onClearRecent?: () => void;
}

const FEATURED_CATEGORIES = [
  {
    title: 'Mobile & Cross-Platform (Flutter / React Native)',
    icon: <Smartphone className="w-4 h-4 text-cyan-400" />,
    repos: [
      { slug: 'odoema/niletropical', desc: 'Nile Tropical Uganda - Digital Commerce & Operations (Flutter + Supabase)', lang: 'Dart', stars: 'Featured' },
      { slug: 'flutter/flutter', desc: 'Build multi-platform applications from a single codebase', lang: 'Dart', stars: '165k' },
      { slug: 'facebook/react-native', desc: 'A framework for building native apps using React', lang: 'JavaScript', stars: '118k' },
      { slug: 'rrousselGit/riverpod', desc: 'A reactive caching and data-binding framework for Dart/Flutter', lang: 'Dart', stars: '5.8k' },
    ],
  },
  {
    title: 'Popular Web Frameworks',
    icon: <Code2 className="w-4 h-4 text-blue-400" />,
    repos: [
      { slug: 'facebook/react', desc: 'The library for web and native user interfaces', lang: 'JavaScript', stars: '228k' },
      { slug: 'vuejs/core', desc: 'Progressive JavaScript Framework for building UI on the web', lang: 'TypeScript', stars: '45k' },
      { slug: 'vercel/next.js', desc: 'The React Framework for the Web with Server Components', lang: 'JavaScript', stars: '124k' },
      { slug: 'sveltejs/svelte', desc: 'Cybernetically enhanced web apps compile to high performance JS', lang: 'TypeScript', stars: '79k' },
    ],
  },
  {
    title: 'AI & Machine Learning',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    repos: [
      { slug: 'ollama/ollama', desc: 'Get up and running with Llama 3, Mistral, Gemma locally', lang: 'Go', stars: '95k' },
      { slug: 'huggingface/transformers', desc: 'State-of-the-art Machine Learning for Pytorch, TF, and JAX', lang: 'Python', stars: '132k' },
      { slug: 'pytorch/pytorch', desc: 'Tensors and Dynamic neural networks in Python with GPU', lang: 'C++', stars: '82k' },
      { slug: 'tensorflow/tensorflow', desc: 'An Open Source Machine Learning Framework for Everyone', lang: 'C++', stars: '184k' },
    ],
  },
  {
    title: 'Developer Tools & Systems',
    icon: <Terminal className="w-4 h-4 text-emerald-400" />,
    repos: [
      { slug: 'supabase/supabase', desc: 'The open source Firebase alternative with PostgreSQL', lang: 'TypeScript', stars: '72k' },
      { slug: 'torvalds/linux', desc: 'Linux kernel source tree by Linus Torvalds', lang: 'C', stars: '178k' },
      { slug: 'tailwindlabs/tailwindcss', desc: 'A utility-first CSS framework for rapid UI development', lang: 'TypeScript', stars: '81k' },
      { slug: 'rust-lang/rust', desc: 'Empowering everyone to build reliable and efficient software', lang: 'Rust', stars: '98k' },
    ],
  },
];

export const RepoDiscovery: React.FC<RepoDiscoveryProps> = ({
  onSelectRepo,
  recentRepos,
  onClearRecent,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<GitHubRepo[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (!trimmed || parseGitHubUrlOrSlug(trimmed)) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchGitHubRepos(trimmed);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseGitHubUrlOrSlug(searchInput);
    if (parsed) {
      onSelectRepo(parsed.owner, parsed.repo);
    } else if (searchResults.length > 0) {
      onSelectRepo(searchResults[0].owner.login, searchResults[0].name);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6">
      {/* Featured Primary Spotlight: Nile Tropical + Supabase */}
      <div className="rounded-2xl border border-emerald-900/60 bg-gradient-to-r from-emerald-950/40 via-[#161b22] to-[#0d1117] p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="font-semibold">FEATURED REPOSITORY</span>
              <span>·</span>
              <span>Flutter Web</span>
              <span>·</span>
              <span>Supabase Cloud</span>
              <span>·</span>
              <span>GitHub Pages</span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              odoema / niletropical
            </h2>

            <p className="text-sm text-[#8b949e] leading-relaxed">
              Digital Commerce & Operations Platform for Nile Tropical Uganda. Coupled with Supabase <code className="text-emerald-400 font-mono">ououfhsswyqutcczdtnb</code>, automated GitHub Pages release pipelines, and Publishing Studio.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#8b949e]">
              <span className="text-white font-mono">master branch</span>
              <span>·</span>
              <a
                href="https://niletropicaluganda.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#58a6ff] hover:underline"
              >
                niletropicaluganda.com
              </a>
              <span>·</span>
              <span className="text-emerald-400">Deployments Verified</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectRepo('odoema', 'niletropical')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Inspect Codebase & Supabase</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Header & Search */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight" style={{ textWrap: 'balance' }}>
          Inspect any GitHub repository <br className="hidden sm:inline" />
          <span className="text-slate-200">
            instantly in real time
          </span>
        </h1>
        <p className="text-sm text-[#8b949e] max-w-xl mx-auto">
          Explore file trees, browse commits, view PRs, and connect Supabase database environments without cloning locally.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="relative mt-6 max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8b949e] absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter repo (e.g. odoema/niletropical or facebook/react)..."
              className="w-full bg-[#161b22] border border-[#30363d] focus:border-blue-500 rounded-xl pl-11 pr-28 py-3 text-sm text-white placeholder:text-[#484f58] focus:outline-none shadow-xl transition-all font-mono"
            />
            <button
              type="submit"
              className="absolute right-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow cursor-pointer"
            >
              <span>Inspect</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Autocomplete / Search dropdown */}
          {searching && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#161b22] border border-[#30363d] rounded-xl p-4 text-center z-20 shadow-2xl">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin mx-auto" />
            </div>
          )}

          {searchResults.length > 0 && !searching && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden z-20 shadow-2xl divide-y divide-[#21262d] max-h-80 overflow-y-auto text-left">
              {searchResults.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => onSelectRepo(repo.owner.login, repo.name)}
                  className="w-full p-3 hover:bg-[#21262d] text-left transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white group-hover:text-blue-400 truncate font-mono">
                      {repo.full_name}
                    </p>
                    <p className="text-xs text-[#8b949e] truncate mt-0.5">{repo.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-[#8b949e]">
                    <span className="flex items-center gap-1 font-mono tabular-nums">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      {repo.stargazers_count.toLocaleString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Recent Repos */}
        {recentRepos.length > 0 && (
          <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
            <span className="text-xs text-[#8b949e] flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" /> Recent:
            </span>
            {recentRepos.map((slug) => {
              const [o, r] = slug.split('/');
              return (
                <button
                  key={slug}
                  onClick={() => onSelectRepo(o, r)}
                  className="px-2.5 py-1 text-xs rounded-md bg-[#161b22] border border-[#30363d] hover:border-blue-500 text-[#c9d1d9] hover:text-white transition-colors font-mono cursor-pointer"
                >
                  {slug}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Featured Repositories Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#21262d] pb-2.5">
          <h2 className="text-sm font-semibold text-white">Curated Ecosystems & Projects</h2>
          <span className="text-xs text-[#8b949e]">Quick selection</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURED_CATEGORIES.map((cat, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4 shadow-sm space-y-2.5"
            >
              <div className="flex items-center gap-2 border-b border-[#21262d] pb-2">
                {cat.icon}
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{cat.title}</h3>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {cat.repos.map((item) => {
                  const [owner, name] = item.slug.split('/');
                  return (
                    <button
                      key={item.slug}
                      onClick={() => onSelectRepo(owner, name)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#0d1117] border border-[#21262d] hover:border-blue-500 hover:bg-[#131821] transition-all group flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-semibold text-white group-hover:text-blue-400">
                            {item.slug}
                          </span>
                          <span className="text-[#8b949e]">·</span>
                          <span className="text-[#8b949e] font-mono text-[11px]">
                            {item.lang}
                          </span>
                        </div>
                        <p className="text-xs text-[#8b949e] truncate mt-0.5">{item.desc}</p>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-amber-400 font-mono tabular-nums shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400/20" />
                        <span>{item.stars}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
