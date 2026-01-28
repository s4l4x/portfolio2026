---
name: setup-gh-pr-preview
description: Set up GitHub Pages PR preview deployments with automatic cleanup
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(mkdir *), Bash(git *)
---

# Setup GitHub Pages PR Preview

Set up automatic PR preview deployments using GitHub Pages. Each PR gets its own preview URL that updates on every push and cleans up when the PR closes.

## Steps

### 1. Ask About Custom Domain

Use AskUserQuestion to ask the user:
- "Do you have a custom domain for GitHub Pages?"
- Options: "Yes" (with description asking them to provide the domain), "No (use github.io)"

If they select "Yes", ask them to provide the domain name (e.g., `g.love` or `mysite.com`).

### 2. Detect Build Tool

Check for the project's build tool by looking for config files:
- `vite.config.ts` or `vite.config.js` → Vite
- `next.config.js` or `next.config.mjs` or `next.config.ts` → Next.js
- `package.json` with `react-scripts` → Create React App

### 3. Modify Build Configuration

**For Vite projects**, update `vite.config.ts` to support dynamic base path:

```typescript
import { defineConfig } from 'vite'
// ... other imports

export default defineConfig({
  // ... other config
  // Support PR preview deployments with dynamic base path
  base: process.env.BASE_PATH || '/',
})
```

Note: If the config uses a function form `defineConfig(({ mode }) => ({...}))`, preserve that pattern.

**For Next.js projects**, update `next.config.js`:

```javascript
const nextConfig = {
  // ... other config
  basePath: process.env.BASE_PATH || '',
  assetPrefix: process.env.BASE_PATH || '',
}
```

### 4. Create GitHub Workflows Directory

Create `.github/workflows/` if it doesn't exist.

### 5. Create PR Preview Workflow

Create `.github/workflows/pr-preview.yml`:

```yaml
name: PR Preview (GitHub Pages)

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

permissions:
  contents: write
  pull-requests: write

concurrency:
  group: pr-preview-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  deploy-preview:
    if: github.event.action != 'closed'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout PR
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install
        run: npm ci

      - name: Build with PR-specific base path
        run: BASE_PATH=/pr-${{ github.event.pull_request.number }}/ npm run build

      - name: Checkout gh-pages branch
        uses: actions/checkout@v4
        with:
          ref: gh-pages
          path: gh-pages

      - name: Copy build output into PR folder
        run: |
          PR_DIR="pr-${{ github.event.pull_request.number }}"
          rm -rf "gh-pages/$PR_DIR"
          mkdir -p "gh-pages/$PR_DIR"
          cp -R dist/* "gh-pages/$PR_DIR/"

      - name: Commit & push preview
        run: |
          cd gh-pages
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A
          git commit -m "PR preview for #${{ github.event.pull_request.number }}" || echo "No changes to commit"
          git push

      - name: Comment preview URL on PR
        uses: peter-evans/create-or-update-comment@v4
        with:
          issue-number: ${{ github.event.pull_request.number }}
          body: |
            ✅ PR Preview is ready:
            https://PREVIEW_DOMAIN/pr-${{ github.event.pull_request.number }}/

  cleanup-preview:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout gh-pages branch
        uses: actions/checkout@v4
        with:
          ref: gh-pages

      - name: Remove PR preview folder
        run: |
          PR_DIR="pr-${{ github.event.pull_request.number }}"
          rm -rf "$PR_DIR"

      - name: Commit & push cleanup
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A
          git commit -m "Remove PR preview for #${{ github.event.pull_request.number }}" || echo "Nothing to remove"
          git push
```

**Important replacements:**
- Replace `PREVIEW_DOMAIN` with the custom domain (e.g., `g.love`) or `USERNAME.github.io/REPO`
- For Next.js projects, change `dist` to `.next/out` or `out` depending on export config
- Adjust the build command if the project uses yarn or pnpm

### 6. Create Main Deploy Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npm run build

      - name: Checkout gh-pages branch
        uses: actions/checkout@v4
        with:
          ref: gh-pages
          path: gh-pages

      - name: Copy build to gh-pages root (preserving PR previews and CNAME)
        run: |
          # Remove old main site files but keep pr-* directories and CNAME
          find gh-pages -maxdepth 1 -type f ! -name 'CNAME' -delete
          find gh-pages -maxdepth 1 -type d ! -name 'gh-pages' ! -name 'pr-*' ! -name '.git' -exec rm -rf {} + 2>/dev/null || true
          # Copy new build
          cp -R dist/* gh-pages/
          # Ensure CNAME exists for custom domain
          echo "CUSTOM_DOMAIN" > gh-pages/CNAME

      - name: Commit & push
        run: |
          cd gh-pages
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A
          git commit -m "Deploy main site" || echo "No changes to commit"
          git push
```

**Important replacements:**
- Replace `CUSTOM_DOMAIN` with the actual domain, or remove the CNAME line if using github.io
- For Next.js, change `dist` to the appropriate output directory

### 7. Ensure gh-pages Branch Exists

Check if the `gh-pages` branch exists. If not, inform the user they need to create it:

```bash
git checkout --orphan gh-pages
git reset --hard
git commit --allow-empty -m "Initial gh-pages"
git push origin gh-pages
git checkout main
```

### 8. Summary

After setup, inform the user:
1. What files were created/modified
2. That they need to ensure the `gh-pages` branch exists
3. That GitHub Pages should be configured to deploy from the `gh-pages` branch
4. The preview URL format: `https://DOMAIN/pr-NUMBER/`
