export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: Array<{ title: string; url: string }>;
  modelUsed?: string;
  isError?: boolean;
}

export interface SendMessageOptions {
  message: string;
  history: Array<{ role: 'user' | 'model'; text: string }>;
  model?: 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';
  useSearchGrounding?: boolean;
  context?: {
    repoSlug?: string;
    currentFile?: string;
    codeSnippet?: string;
    techStack?: string[];
  };
}

export interface ChatResponse {
  text: string;
  model: string;
  searchSources: Array<{ title: string; url: string }>;
}

export const sendMessageToGemini = async (options: SendMessageOptions): Promise<ChatResponse> => {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed.' }));
    throw new Error(errorData.error || `Server responded with ${res.status}`);
  }

  return res.json();
};

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: '16:9' | '1:1' | '4:3' | '9:16';
  baseImage?: string; // base64 data url for editing
}

export interface GenerateImageResponse {
  imageUrl: string;
  text?: string;
}

export const generateRepoImage = async (
  options: GenerateImageOptions
): Promise<GenerateImageResponse> => {
  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Image generation failed.' }));
    throw new Error(err.error || `Server responded with status ${res.status}`);
  }

  return res.json();
};
