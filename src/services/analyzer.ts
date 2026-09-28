/**
 * Repository Architecture & Tech Stack Analyzer
 */

export interface DetectedStack {
  name: string;
  category: 'Framework' | 'Language' | 'Backend' | 'State / Store' | 'Styling' | 'DevOps' | 'Testing';
  confidence: 'high' | 'medium';
  manifestPath?: string;
  description: string;
}

export interface RepoAnalysis {
  techStacks: DetectedStack[];
  manifestFiles: string[];
  keyHighlights: string[];
}

export function analyzeRepoStructure(filePaths: string[]): RepoAnalysis {
  const stacks: DetectedStack[] = [];
  const manifests: string[] = [];
  const highlights: string[] = [];

  const lowerPaths = filePaths.map((p) => p.toLowerCase());
  const pathSet = new Set(lowerPaths);

  const hasPath = (p: string) => pathSet.has(p.toLowerCase());
  const hasExt = (ext: string) => lowerPaths.some((p) => p.endsWith(ext));
  const hasPrefix = (prefix: string) => lowerPaths.some((p) => p.startsWith(prefix));

  // 1. Flutter & Dart
  if (hasPath('pubspec.yaml') || hasExt('.dart')) {
    stacks.push({
      name: 'Flutter & Dart',
      category: 'Framework',
      confidence: 'high',
      manifestPath: hasPath('pubspec.yaml') ? 'pubspec.yaml' : undefined,
      description: 'Cross-platform native mobile, web, and desktop application suite.',
    });
    manifests.push('pubspec.yaml');
  }

  // 2. Supabase
  if (hasPrefix('supabase') || hasPath('supabase/config.toml')) {
    stacks.push({
      name: 'Supabase',
      category: 'Backend',
      confidence: 'high',
      description: 'PostgreSQL database, Row Level Security, Edge Functions & Auth.',
    });
    highlights.push('Supabase backend architecture & database migrations');
  }

  // 3. React / Next.js / Vue / Vite
  if (hasPath('next.config.js') || hasPath('next.config.mjs') || hasPath('next.config.ts')) {
    stacks.push({
      name: 'Next.js',
      category: 'Framework',
      confidence: 'high',
      description: 'Full-stack React framework with SSR and App Router.',
    });
    highlights.push('Next.js SSR & API Route system');
  } else if (hasPath('vite.config.ts') || hasPath('vite.config.js')) {
    stacks.push({
      name: 'Vite',
      category: 'Framework',
      confidence: 'high',
      description: 'Lightning-fast modern frontend build tool.',
    });
  }

  if (hasPath('package.json')) {
    manifests.push('package.json');
    if (hasExt('.tsx') || hasExt('.jsx')) {
      stacks.push({
        name: 'React',
        category: 'Framework',
        confidence: 'high',
        description: 'Component-driven reactive UI framework.',
      });
    }
  }

  // 4. TypeScript / JavaScript
  if (hasExt('.ts') || hasExt('.tsx') || hasPath('tsconfig.json')) {
    stacks.push({
      name: 'TypeScript',
      category: 'Language',
      confidence: 'high',
      manifestPath: hasPath('tsconfig.json') ? 'tsconfig.json' : undefined,
      description: 'Strict type safety and enterprise compile-time checks.',
    });
  }

  // 5. Python (Django, FastAPI, Flask)
  if (hasExt('.py') || hasPath('requirements.txt') || hasPath('pyproject.toml')) {
    if (hasPath('requirements.txt')) manifests.push('requirements.txt');
    if (hasPath('pyproject.toml')) manifests.push('pyproject.toml');

    let pyFramework = 'Python Ecosystem';
    if (hasPath('manage.py')) pyFramework = 'Django';
    else if (lowerPaths.some((p) => p.includes('fastapi'))) pyFramework = 'FastAPI';

    stacks.push({
      name: pyFramework,
      category: 'Framework',
      confidence: 'high',
      description: 'Backend services and computational logic.',
    });
  }

  // 6. Rust
  if (hasPath('cargo.toml') || hasExt('.rs')) {
    manifests.push('Cargo.toml');
    stacks.push({
      name: 'Rust & Cargo',
      category: 'Language',
      confidence: 'high',
      manifestPath: 'Cargo.toml',
      description: 'Memory-safe systems programming language.',
    });
  }

  // 7. Go
  if (hasPath('go.mod') || hasExt('.go')) {
    manifests.push('go.mod');
    stacks.push({
      name: 'Go (Golang)',
      category: 'Language',
      confidence: 'high',
      manifestPath: 'go.mod',
      description: 'Concurrent, lightweight systems backend.',
    });
  }

  // 8. Docker & Containerization
  if (hasPath('dockerfile') || hasPath('docker-compose.yml') || hasPath('docker-compose.yaml')) {
    stacks.push({
      name: 'Docker',
      category: 'DevOps',
      confidence: 'high',
      description: 'Containerized deployment specification.',
    });
    highlights.push('Containerized environments with Docker');
  }

  // 9. Tailwind CSS
  if (hasPath('tailwind.config.js') || hasPath('tailwind.config.ts') || lowerPaths.some((p) => p.includes('tailwind'))) {
    stacks.push({
      name: 'Tailwind CSS',
      category: 'Styling',
      confidence: 'high',
      description: 'Utility-first modern responsive styling.',
    });
  }

  // Check platforms for mobile/desktop
  if (hasPath('android') && hasPath('ios')) {
    highlights.push('Native iOS & Android cross-platform target');
  }
  if (hasPath('windows') || hasPath('macos') || hasPath('linux')) {
    highlights.push('Desktop native runner builds supported');
  }

  return {
    techStacks: stacks,
    manifestFiles: Array.from(new Set(manifests)),
    keyHighlights: highlights,
  };
}
