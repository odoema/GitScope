# GitScope

A GitHub repository inspector and developer workbench: browse code, commits, issues, releases and insights for any repo, see **your own repositories** (including private ones) after connecting, ask a Gemini-powered copilot about the code, and inspect a Supabase project.

**Live:** https://odoema.github.io/GitScope/

## Connecting your GitHub

Click **Connect GitHub** and paste a Personal Access Token
([create one](https://github.com/settings/tokens/new?scopes=repo,read:org,read:user,workflow&description=GitScope)).
The token is stored only in your browser's local storage and sent only to `api.github.com`.

"Sign in with GitHub" (OAuth) and the AI copilot/image features need the Node server and are unavailable on the static GitHub Pages build.

## Run locally

```bash
npm install --legacy-peer-deps
cp .env.example .env   # add GEMINI_API_KEY; optionally GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
npm run dev            # http://localhost:3000
```

## Deploy

Pushing to `main` builds the Vite app and publishes it to GitHub Pages via `.github/workflows/deploy.yml`.
