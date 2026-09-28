import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Wand2,
  Sliders,
  Layers,
  Upload,
  Check,
} from 'lucide-react';
import { generateRepoImage } from '../services/ai';

interface AIImageStudioProps {
  repoName?: string;
  techStacks?: string[];
}

export const AIImageStudio: React.FC<AIImageStudioProps> = ({ repoName, techStacks }) => {
  const [prompt, setPrompt] = useState(
    `Modern high-tech architectural diagram and visual card for ${
      repoName || 'an open source repository'
    }, dark mode aesthetic, glowing cyan and violet nodes, sleek typography and clean lines.`
  );
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '4:3' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const presets = [
    `Isometric 3D software architecture map illustrating ${repoName || 'a modern web application'} with data pipelines, database layers, and APIs on dark slate background.`,
    `Futuristic glowing cyberpunk hero banner for ${repoName || 'developer platform'}, neon blue and purple circuits, 4K render.`,
    `Clean minimalist GitHub social preview card with abstract geometric tech shapes and dark metallic texture for ${repoName || 'codebase'}.`,
    `Visual blueprint diagram illustrating modern cross-platform Flutter and Supabase cloud architecture with microservices.`,
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await generateRepoImage({
        prompt: prompt.trim(),
        aspectRatio,
        baseImage: editMode && baseImage ? baseImage : undefined,
      });
      setResultImage(res.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image with Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBaseImage(reader.result as string);
        setEditMode(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `${repoName ? repoName.replace(/[^a-zA-Z0-9]/g, '_') : 'gitscope'}_asset.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-white">AI Visual & Diagram Studio</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-400 border border-purple-800/40 font-mono">
                gemini-3.1-flash-image-preview
              </span>
            </div>
            <p className="text-xs text-[#8b949e]">
              Generate architecture diagrams, social cards, or edit repository graphics using AI prompt instructions.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-4">
          {/* Prompt Box */}
          <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white uppercase tracking-wider">
                {editMode ? 'Edit Instructions' : 'Generation Prompt'}
              </label>
              {editMode && (
                <button
                  onClick={() => {
                    setEditMode(false);
                    setBaseImage(null);
                  }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Cancel Edit Mode
                </button>
              )}
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Describe the architecture diagram, banner, or image to generate..."
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-xl p-3 text-xs text-white placeholder:text-[#484f58] focus:outline-none transition-all leading-relaxed font-sans"
            />

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-[#8b949e] font-medium">Quick Inspiration Presets:</span>
              <div className="space-y-1">
                {presets.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    className="w-full text-left p-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] text-[11px] text-[#c9d1d9] truncate transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2 pt-2 border-t border-[#21262d]">
              <label className="text-[11px] font-semibold text-[#8b949e] uppercase">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {(['16:9', '1:1', '4:3', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 rounded-xl font-mono text-xs transition-colors ${
                      aspectRatio === ratio
                        ? 'bg-[#1f6feb] text-white font-semibold'
                        : 'bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Image Upload for Editing */}
            <div className="space-y-2 pt-2 border-t border-[#21262d]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8b949e] uppercase">
                  Edit Existing Image (Optional)
                </span>
              </div>
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#30363d] hover:border-[#58a6ff] cursor-pointer bg-[#0d1117] text-xs text-[#8b949e] hover:text-white transition-colors">
                <Upload className="w-4 h-4 text-[#58a6ff]" />
                <span>{baseImage ? 'Change Image for Editing' : 'Upload image to edit'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {baseImage && (
                <div className="flex items-center gap-3 p-2 bg-[#0d1117] rounded-xl border border-[#30363d]">
                  <img
                    src={baseImage}
                    alt="Upload thumbnail"
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Image ready for editing
                  </span>
                </div>
              )}
            </div>

            {/* Action button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating with Gemini 3.1 Flash Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{editMode ? 'Edit Image with Gemini' : 'Generate Visual Asset'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 shadow-xl flex flex-col items-center justify-center min-h-[420px]">
            {loading ? (
              <div className="text-center space-y-3 p-12">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-[#30363d] border-t-purple-500 animate-spin mx-auto" />
                </div>
                <h3 className="text-sm font-semibold text-white">Synthesizing Imagery...</h3>
                <p className="text-xs text-[#8b949e]">
                  Rendering with gemini-3.1-flash-image-preview
                </p>
              </div>
            ) : error ? (
              <div className="text-center p-8 text-rose-400 space-y-2">
                <p className="text-sm font-medium">{error}</p>
                <button
                  onClick={handleGenerate}
                  className="text-xs text-[#58a6ff] hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : resultImage ? (
              <div className="space-y-4 w-full">
                <div className="rounded-xl overflow-hidden border border-[#30363d] bg-[#0d1117] shadow-2xl">
                  <img
                    src={resultImage}
                    alt="Generated repository asset"
                    className="w-full h-auto object-contain max-h-[500px]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8b949e] font-mono">
                    Aspect Ratio: {aspectRatio}
                  </span>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold shadow transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-12 space-y-3 text-[#8b949e]">
                <div className="w-16 h-16 rounded-2xl bg-[#0d1117] border border-[#30363d] flex items-center justify-center mx-auto text-[#58a6ff]">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-white">No Asset Generated Yet</h3>
                <p className="text-xs max-w-sm mx-auto leading-relaxed">
                  Enter a prompt or click one of the presets on the left to generate architecture diagrams, social cards, or logos for this repository.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
