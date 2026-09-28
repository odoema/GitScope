import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize Google Gen AI client with User-Agent as required by SKILL.md
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Multi-turn Chat API with Search Grounding
 */
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      model = 'gemini-3.5-flash',
      useSearchGrounding = false,
      context = {},
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const { repoSlug, currentFile, codeSnippet, techStack } = context;

    // Build context-aware system instruction
    let systemInstruction =
      'You are GitScope AI, a world-class principal software engineer and repository intelligence specialist. ' +
      'You assist developers in inspecting, analyzing, and explaining codebases, software architecture, commit history, ' +
      'dependencies, security considerations, and modern engineering patterns. ' +
      'Always respond in clear, well-structured Markdown with formatted code snippets, bold key concepts, and actionable insights.';

    if (repoSlug) {
      systemInstruction += `\n\nActive Repository Context: ${repoSlug}`;
    }
    if (techStack && techStack.length > 0) {
      systemInstruction += `\nDetected Tech Stack: ${techStack.join(', ')}`;
    }
    if (currentFile) {
      systemInstruction += `\nCurrently Viewed File: ${currentFile}`;
    }
    if (codeSnippet) {
      systemInstruction += `\n\nActive Code Snippet Under Inspection:\n\`\`\`\n${codeSnippet.slice(0, 4000)}\n\`\`\``;
    }

    // Build contents for multi-turn history
    const contents: any[] = [];

    // Append past conversation history
    for (const h of history) {
      if (h.role === 'user' || h.role === 'model') {
        contents.push({
          role: h.role,
          parts: [{ text: h.text }],
        });
      }
    }

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const config: any = {
      systemInstruction,
    };

    // Attach Search Grounding tool if requested
    if (useSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    const targetModel = model || (useSearchGrounding ? 'gemini-3.5-flash' : 'gemini-3.5-flash');

    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config,
    });

    const text = response.text || '';

    // Extract search grounding metadata if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchSources: Array<{ title: string; url: string }> = [];

    if (Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if (chunk.web && chunk.web.uri) {
          searchSources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
          });
        }
      }
    }

    res.json({
      text,
      model: targetModel,
      searchSources,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: error.message || 'An error occurred while generating response.',
    });
  }
});

/**
 * Image Generation and Editing API using gemini-3.1-flash-image-preview
 */
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9', baseImage } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    // Prepare contents
    const parts: any[] = [];

    if (baseImage) {
      // Editing mode
      const matches = baseImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2],
          },
        });
      }
    }

    parts.push({ text: prompt });

    // Use gemini-3.1-flash-image-preview or gemini-3.1-flash-lite-image
    const model = 'gemini-3.1-flash-image-preview';

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio,
        },
      },
    });

    let imageUrl = '';
    let textResponse = '';

    const candidateParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of candidateParts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textResponse += part.text;
      }
    }

    if (!imageUrl) {
      return res.status(422).json({
        error: textResponse || 'No image was returned by the model.',
      });
    }

    res.json({
      imageUrl,
      text: textResponse,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate image.',
    });
  }
});

// Production vs Development setup
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
