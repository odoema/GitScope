import React, { useEffect, useState, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-dart';
import {
  Copy,
  Check,
  Download,
  FileText,
  ExternalLink,
  Code,
  Search,
  Maximize2,
  Minimize2,
  WrapText,
  X,
  Sparkles,
} from 'lucide-react';
import { getLanguageFromFilename, formatFileSize } from '../utils/fileIcons';

interface CodeViewerProps {
  filename: string;
  code: string;
  size?: number;
  rawUrl?: string | null;
  htmlUrl?: string;
  onClose?: () => void;
  onAskAI?: (filename: string, code: string) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  filename,
  code,
  size,
  rawUrl,
  htmlUrl,
  onClose,
  onAskAI,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const language = getLanguageFromFilename(filename);

  useEffect(() => {
    Prism.highlightAll();
  }, [code, language, showRaw, wrapLines]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = useMemo(() => code.split('\n'), [code]);

  const downloadFile = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Count search query matches
  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = code.match(regex);
    return matches ? matches.length : 0;
  }, [code, searchQuery]);

  return (
    <div
      className={`rounded-2xl border border-[#30363d] bg-[#0d1117] overflow-hidden flex flex-col shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 max-h-none h-[calc(100vh-2rem)]' : ''
      }`}
    >
      {/* Code Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2.5 text-xs text-[#8b949e] min-w-0">
          <span className="font-mono text-white font-semibold truncate max-w-[200px] sm:max-w-md">
            {filename}
          </span>
          <span className="text-[#484f58]">·</span>
          <span className="font-mono text-[#58a6ff] uppercase text-[10px] tracking-wider">
            {language}
          </span>
          <span className="text-[#484f58]">·</span>
          <span className="tabular-nums font-mono">{lines.length} lines</span>
          {size !== undefined && (
            <>
              <span className="text-[#484f58]">·</span>
              <span className="tabular-nums font-mono">{formatFileSize(size)}</span>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Ask AI button */}
          {onAskAI && (
            <button
              onClick={() => onAskAI(filename, code)}
              className="px-2.5 py-1 text-xs rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-all shadow flex items-center gap-1.5"
              title="Explain or audit this file with GitScope AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Ask AI</span>
            </button>
          )}

          {/* Find toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
              searchOpen
                ? 'bg-[#1f6feb] text-white'
                : 'bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d]'
            }`}
            title="Find in file"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Find</span>
          </button>

          {/* Wrap toggle */}
          <button
            onClick={() => setWrapLines(!wrapLines)}
            className={`p-1.5 text-xs rounded-lg transition-colors ${
              wrapLines
                ? 'bg-[#1f6feb] text-white'
                : 'bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d]'
            }`}
            title={wrapLines ? 'Disable line wrap' : 'Enable line wrap'}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          {/* Raw vs Highlighted */}
          <button
            onClick={() => setShowRaw(!showRaw)}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
              showRaw
                ? 'bg-[#238636] text-white'
                : 'bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d]'
            }`}
          >
            {showRaw ? <Code className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            <span>{showRaw ? 'Code' : 'Raw'}</span>
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 text-xs rounded-lg bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] transition-colors flex items-center gap-1.5 font-medium"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#8b949e]" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Download */}
          <button
            onClick={downloadFile}
            className="p-1.5 text-xs rounded-lg bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] transition-colors"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5 text-[#8b949e]" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-xs rounded-lg bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-[#8b949e]" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-[#8b949e]" />
            )}
          </button>

          {htmlUrl && (
            <a
              href={htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-xs rounded-lg bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] transition-colors"
              title="Open on GitHub"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#8b949e]" />
            </a>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-xs rounded-lg bg-[#21262d] text-[#c9d1d9] hover:text-white hover:bg-rose-950 transition-colors ml-1"
              title="Close file preview"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* In-File Search Bar */}
      {searchOpen && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#1c2128] border-b border-[#30363d] text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#8b949e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find in file..."
              autoFocus
              className="w-full bg-[#0d1117] text-white px-2.5 py-1 rounded border border-[#30363d] focus:border-[#58a6ff] focus:outline-none font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#8b949e] font-mono tabular-nums">
              {searchQuery ? `${matchCount} match${matchCount === 1 ? '' : 'es'}` : ''}
            </span>
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-1 text-[#8b949e] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Code Content Area */}
      <div
        className={`overflow-x-auto text-sm font-mono overflow-y-auto selection:bg-[#264f78] ${
          isFullscreen ? 'flex-1' : 'max-h-[750px]'
        }`}
      >
        {showRaw ? (
          <pre
            className={`p-4 text-[#c9d1d9] font-mono text-xs leading-relaxed ${
              wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
            }`}
          >
            {code}
          </pre>
        ) : (
          <div className="flex min-w-full">
            {/* Line Numbers Column */}
            <div className="select-none py-3 pl-3 pr-4 text-right text-[#484f58] bg-[#0d1117] border-r border-[#21262d] text-xs font-mono shrink-0 tabular-nums">
              {lines.map((_, i) => (
                <div key={i} className="leading-6 h-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Body */}
            <pre
              className={`p-3 pl-4 flex-1 text-xs leading-6 overflow-x-visible ${
                wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
              }`}
            >
              <code className={`language-${language}`}>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
