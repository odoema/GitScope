import React, { useMemo } from 'react';
import { marked } from 'marked';
import { BookOpen } from 'lucide-react';

interface ReadmeViewerProps {
  content: string;
  filename?: string;
}

export const ReadmeViewer: React.FC<ReadmeViewerProps> = ({ content, filename = 'README.md' }) => {
  const html = useMemo(() => {
    try {
      marked.setOptions({
        gfm: true,
        breaks: true,
      });
      return marked.parse(content) as string;
    } catch {
      return '<p>Error rendering Markdown.</p>';
    }
  }, [content]);

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden mt-6 shadow-xl">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-[#30363d] text-sm text-[#e6edf3] font-medium">
        <BookOpen className="w-4 h-4 text-[#58a6ff]" />
        <span>{filename}</span>
      </div>

      <div
        className="p-6 md:p-8 markdown-body text-[#c9d1d9] prose prose-invert max-w-none prose-headings:border-b prose-headings:border-[#21262d] prose-headings:pb-2 prose-h1:text-2xl prose-h2:text-xl prose-a:text-[#58a6ff] prose-a:no-underline hover:prose-a:underline prose-code:text-[#58a6ff] prose-code:bg-[#161b22] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#161b22] prose-pre:border prose-pre:border-[#30363d]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};
