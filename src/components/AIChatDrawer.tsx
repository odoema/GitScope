import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Globe,
  Zap,
  Cpu,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  Bot,
  User,
  HelpCircle,
  FileCode,
} from 'lucide-react';
import { marked } from 'marked';
import { ChatMessage, sendMessageToGemini } from '../services/ai';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  repoSlug?: string;
  activeFile?: { name: string; content?: string } | null;
  techStacks?: string[];
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  repoSlug,
  activeFile,
  techStacks,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! I'm **GitScope AI**, your codebase intelligence copilot.\n\nAsk me anything about **${
        repoSlug || 'any GitHub repository'
      }**—architecture breakdowns, code explanations, security audits, or live Google Search for external documentation and libraries.`,
      timestamp: Date.now(),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setLoading(true);

    // Format past history for Gemini multi-turn format
    const historyPayload = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    try {
      const response = await sendMessageToGemini({
        message: textToSend,
        history: historyPayload,
        model,
        useSearchGrounding,
        context: {
          repoSlug,
          currentFile: activeFile?.name,
          codeSnippet: activeFile?.content ? activeFile.content.slice(0, 3000) : undefined,
          techStack: techStacks,
        },
      });

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        sources: response.searchSources,
        modelUsed: response.model,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `**Error:** ${err.message || 'Failed to communicate with Gemini.'}`,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'model',
        text: `Conversation cleared. How can I help you inspect **${repoSlug || 'this codebase'}**?`,
        timestamp: Date.now(),
        modelUsed: model,
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md md:max-w-lg bg-[#0d1117] border-l border-[#30363d] shadow-2xl flex flex-col animate-slide-left">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              GitScope AI
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 font-mono">
                Copilot
              </span>
            </h2>
            <p className="text-[11px] text-[#8b949e] truncate max-w-[200px]">
              {activeFile ? `Context: ${activeFile.name}` : repoSlug || 'Multi-turn Assistant'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Control bar: Model Selector & Search Grounding Toggle */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#12161f] border-b border-[#21262d] text-xs">
        {/* Model switcher */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161b22] border border-[#30363d] text-[#c9d1d9] hover:text-white transition-colors font-mono text-[11px]"
          >
            <Cpu className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>{model}</span>
            <ChevronDown className="w-3 h-3 text-[#8b949e]" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute left-0 mt-1 w-64 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-[#21262d]">
              <button
                onClick={() => {
                  setModel('gemini-3.5-flash');
                  setModelDropdownOpen(false);
                }}
                className={`w-full text-left p-2.5 text-xs transition-colors ${
                  model === 'gemini-3.5-flash' ? 'bg-[#21262d] text-white' : 'hover:bg-[#21262d]/60 text-[#c9d1d9]'
                }`}
              >
                <div className="font-semibold text-white">gemini-3.5-flash</div>
                <div className="text-[10px] text-[#8b949e]">General tasks & Google Search Grounding</div>
              </button>
              <button
                onClick={() => {
                  setModel('gemini-3.1-flash-lite');
                  setModelDropdownOpen(false);
                }}
                className={`w-full text-left p-2.5 text-xs transition-colors ${
                  model === 'gemini-3.1-flash-lite' ? 'bg-[#21262d] text-white' : 'hover:bg-[#21262d]/60 text-[#c9d1d9]'
                }`}
              >
                <div className="font-semibold text-white">gemini-3.1-flash-lite</div>
                <div className="text-[10px] text-[#8b949e]">Ultra-fast tasks & code summaries</div>
              </button>
              <button
                onClick={() => {
                  setModel('gemini-3.1-pro-preview');
                  setModelDropdownOpen(false);
                }}
                className={`w-full text-left p-2.5 text-xs transition-colors ${
                  model === 'gemini-3.1-pro-preview' ? 'bg-[#21262d] text-white' : 'hover:bg-[#21262d]/60 text-[#c9d1d9]'
                }`}
              >
                <div className="font-semibold text-white">gemini-3.1-pro-preview</div>
                <div className="text-[10px] text-[#8b949e]">Complex architectural reasoning & logic</div>
              </button>
            </div>
          )}
        </div>

        {/* Search Grounding toggle */}
        <button
          onClick={() => setUseSearchGrounding(!useSearchGrounding)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-colors ${
            useSearchGrounding
              ? 'bg-blue-950/40 border-blue-600/60 text-blue-400 font-medium'
              : 'bg-[#161b22] border-[#30363d] text-[#8b949e]'
          }`}
          title="Enable real-time Google Search grounding"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Google Search {useSearchGrounding ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'model' && (
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-[#58a6ff]" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 ${
                m.role === 'user'
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md font-sans'
                  : m.isError
                  ? 'bg-rose-950/40 border border-rose-800 text-rose-300 rounded-bl-none'
                  : 'bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded-bl-none shadow'
              }`}
            >
              {/* Message Content */}
              {m.role === 'user' ? (
                <div className="whitespace-pre-wrap">{m.text}</div>
              ) : (
                <div
                  className="markdown-body prose prose-invert prose-xs max-w-none text-xs"
                  dangerouslySetInnerHTML={{ __html: marked.parse(m.text) as string }}
                />
              )}

              {/* Grounding Sources */}
              {m.sources && m.sources.length > 0 && (
                <div className="pt-2 mt-2 border-t border-[#30363d]/60 space-y-1.5">
                  <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#58a6ff]" />
                    Sources from Google Search
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-[#58a6ff] hover:underline px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] flex items-center gap-1 truncate max-w-[240px]"
                      >
                        <span className="truncate">{s.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Footer */}
              {m.role === 'model' && (
                <div className="flex items-center justify-between pt-1 text-[10px] text-[#8b949e]">
                  <span className="font-mono text-[9px]">{m.modelUsed || model}</span>
                  <button
                    onClick={() => copyMessage(m.id, m.text)}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-[#8b949e]">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[#58a6ff]" />
            </div>
            <div className="flex items-center gap-2 bg-[#161b22] px-3 py-2 rounded-xl border border-[#30363d]">
              <Loader2 className="w-3.5 h-3.5 text-[#58a6ff] animate-spin" />
              <span>
                {useSearchGrounding ? 'Searching web & analyzing code with Gemini...' : 'Reasoning...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-[#12161f] border-t border-[#21262d] flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
        {activeFile ? (
          <>
            <button
              onClick={() => handleSend(`Audit ${activeFile.name} for potential bugs and performance issues.`)}
              className="px-2.5 py-1 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] whitespace-nowrap transition-colors"
            >
              Audit this file
            </button>
            <button
              onClick={() => handleSend(`Explain the purpose and logic in ${activeFile.name}.`)}
              className="px-2.5 py-1 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] whitespace-nowrap transition-colors"
            >
              Explain file logic
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleSend('Explain the architectural design and key components of this repository.')}
              className="px-2.5 py-1 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] whitespace-nowrap transition-colors"
            >
              Explain architecture
            </button>
            <button
              onClick={() => handleSend('Search latest release notes and breaking changes for this project on the web.')}
              className="px-2.5 py-1 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] whitespace-nowrap transition-colors"
            >
              Search latest releases
            </button>
          </>
        )}
      </div>

      {/* Input box */}
      <div className="p-3 bg-[#161b22] border-t border-[#30363d]">
        <div className="relative flex items-center bg-[#0d1117] rounded-xl border border-[#30363d] focus-within:border-[#58a6ff] transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask Gemini about ${repoSlug || 'this codebase'}...`}
            rows={1}
            className="w-full bg-transparent text-xs text-white p-3 pr-12 focus:outline-none resize-none max-h-28 font-sans"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] disabled:opacity-30 disabled:hover:bg-[#238636] text-white transition-colors shadow"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
