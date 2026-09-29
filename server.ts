import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
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


/**
 * ─────────────────────────────────────────────────────────────
 * GitHub OAuth (popup flow)
 * ─────────────────────────────────────────────────────────────
 * Setup: create an OAuth App at https://github.com/settings/developers
 *   Homepage URL:      APP_URL
 *   Callback URL:      APP_URL/auth/github/callback
 * Then set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (server-side secrets only).
 * The client secret never reaches the browser; only the resulting access token does.
 */
const GH_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GH_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GH_SCOPES = process.env.GITHUB_OAUTH_SCOPES || 'repo read:user read:org workflow';
const STATE_TTL_MS = 10 * 60 * 1000;

const oauthConfigured = () => Boolean(GH_CLIENT_ID && GH_CLIENT_SECRET);

const getBaseUrl = (req: express.Request): string => {
  if (process.env.APP_URL && !process.env.APP_URL.startsWith('MY_')) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || req.protocol;
  return `${proto}://${req.get('host')}`;
};

// Stateless, HMAC-signed `state` (survives multiple Cloud Run instances and third-party-cookie blocking)
const signState = (): string => {
  const payload = `${crypto.randomBytes(16).toString('hex')}.${Date.now()}`;
  const sig = crypto.createHmac('sha256', GH_CLIENT_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
};

const verifyState = (state: unknown): boolean => {
  if (typeof state !== 'string') return false;
  const parts = state.split('.');
  if (parts.length !== 3) return false;
  const [nonce, ts, sig] = parts;
  const expected = crypto.createHmac('sha256', GH_CLIENT_SECRET).update(`${nonce}.${ts}`).digest('hex');
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Date.now() - Number(ts) < STATE_TTL_MS;
};

const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');

const popupResultPage = (origin: string, payload: Record<string, unknown>) => `<!doctype html>
<html><head><meta charset="utf-8"><title>GitHub sign-in</title>
<style>body{font-family:system-ui,sans-serif;background:#0d1117;color:#c9d1d9;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style>
</head><body><p>${payload.error ? 'Sign-in failed. You can close this window.' : 'Connected to GitHub. Closing…'}</p>
<script>
  (function () {
    var msg = ${safeJson({ type: 'GITSCOPE_GITHUB_OAUTH', ...payload })};
    if (window.opener) { window.opener.postMessage(msg, ${safeJson(origin)}); }
    setTimeout(function () { window.close(); }, 600);
  })();
</script></body></html>`;

app.get('/api/auth/github/status', (_req, res) => {
  res.json({ configured: oauthConfigured(), scopes: GH_SCOPES });
});

app.get('/api/auth/github/url', (req, res) => {
  if (!oauthConfigured()) {
    return res.status(501).json({
      error: 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET, or use a Personal Access Token.',
    });
  }
  const params = new URLSearchParams({
    client_id: GH_CLIENT_ID,
    redirect_uri: `${getBaseUrl(req)}/auth/github/callback`,
    scope: GH_SCOPES,
    state: signState(),
    allow_signup: 'false',
  });
  res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
});

app.get(['/auth/github/callback', '/api/auth/github/callback'], async (req, res) => {
  const origin = new URL(getBaseUrl(req)).origin;
  const send = (payload: Record<string, unknown>) =>
    res.status(payload.error ? 400 : 200).type('html').send(popupResultPage(origin, payload));

  if (!oauthConfigured()) return send({ error: 'OAuth not configured.' });

  const { code, state, error, error_description } = req.query as Record<string, string>;
  if (error) return send({ error: error_description || error });
  if (!code || !verifyState(state)) return send({ error: 'Invalid or expired OAuth state. Please try again.' });

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: GH_CLIENT_ID,
        client_secret: GH_CLIENT_SECRET,
        code,
        redirect_uri: `${getBaseUrl(req)}/auth/github/callback`,
      }),
    });
    const data: any = await tokenRes.json();
    if (!data.access_token) {
      return send({ error: data.error_description || data.error || 'GitHub did not return a token.' });
    }
    return send({ token: data.access_token, scope: data.scope || '' });
  } catch (e: any) {
    console.error('GitHub OAuth callback error:', e);
    return send({ error: e.message || 'Token exchange failed.' });
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
