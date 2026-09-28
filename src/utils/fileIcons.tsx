import React from 'react';
import {
  FileCode,
  FileText,
  FileJson,
  Folder,
  FolderOpen,
  Image,
  Database,
  Settings,
  Terminal,
  File,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts.pop()?.toLowerCase() || '';
  }
  return '';
};

export const getLanguageFromFilename = (filename: string): string => {
  const ext = getFileExtension(filename);
  const name = filename.toLowerCase();

  if (name === 'dockerfile') return 'dockerfile';
  if (name.startsWith('makefile')) return 'makefile';
  if (name.startsWith('.env')) return 'bash';

  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'py':
      return 'python';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'java':
      return 'java';
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
      return 'cpp';
    case 'json':
      return 'json';
    case 'md':
    case 'mdx':
      return 'markdown';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return 'css';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'bash';
    case 'sql':
      return 'sql';
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'swift':
      return 'swift';
    case 'dart':
      return 'dart';
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'xml':
    case 'svg':
      return 'xml';
    default:
      return 'text';
  }
};

export const getFileIcon = (name: string, isDirectory: boolean, isOpen: boolean = false) => {
  if (isDirectory) {
    return isOpen ? (
      <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
    ) : (
      <Folder className="w-4 h-4 text-amber-400 shrink-0" />
    );
  }

  const ext = getFileExtension(name);
  const lower = name.toLowerCase();

  if (lower === 'package.json' || lower === 'tsconfig.json') {
    return <FileJson className="w-4 h-4 text-emerald-400 shrink-0" />;
  }
  if (lower.includes('license')) {
    return <Shield className="w-4 h-4 text-amber-300 shrink-0" />;
  }
  if (lower.startsWith('docker') || lower.includes('config')) {
    return <Settings className="w-4 h-4 text-blue-400 shrink-0" />;
  }

  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
    case 'js':
    case 'jsx':
    case 'mjs':
      return <FileCode className="w-4 h-4 text-yellow-400 shrink-0" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-300 shrink-0" />;
    case 'md':
    case 'txt':
    case 'rst':
      return <FileText className="w-4 h-4 text-slate-300 shrink-0" />;
    case 'py':
      return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    case 'rs':
      return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
    case 'go':
      return <FileCode className="w-4 h-4 text-teal-400 shrink-0" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <Image className="w-4 h-4 text-purple-400 shrink-0" />;
    case 'sql':
      return <Database className="w-4 h-4 text-rose-400 shrink-0" />;
    case 'sh':
    case 'bash':
      return <Terminal className="w-4 h-4 text-green-400 shrink-0" />;
    case 'css':
    case 'scss':
      return <Layers className="w-4 h-4 text-sky-400 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  }
};
