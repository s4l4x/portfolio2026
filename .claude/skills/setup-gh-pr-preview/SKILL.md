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
- "How is your GitHub Pages configured?"
- Options:
  - "Custom domain" (e.g., `mysite.com`)
  - "Default github.io" (e.g., `username.github.io/repo-name`)
  - "Convert to custom domain" (migrate existing github.io setup to a custom domain)

If they select "Custom domain" or "Convert to custom domain", ask them to provide the domain name.

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

Create `.github/workflows/pr-preview.yml`. The BASE_PATH differs based on domain configuration:

#### For Custom Domain (e.g., `mysite.com`)

BASE_PATH is just `/pr-N/` since the domain root is the site root:

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
            **PR Preview is ready:**
            https://CUSTOM_DOMAIN/pr-${{ github.event.pull_request.number }}/

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

**Replace `CUSTOM_DOMAIN`** with the actual domain (e.g., `mysite.com`).

#### For Default github.io (e.g., `username.github.io/repo-name`)

BASE_PATH must include the repository name since the site is at a subpath:

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
        run: BASE_PATH=/${{ github.event.repository.name }}/pr-${{ github.event.pull_request.number }}/ npm run build

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
            **PR Preview is ready:**
            https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}/pr-${{ github.event.pull_request.number }}/

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

**Key difference:** The github.io version uses `${{ github.event.repository.name }}` in the BASE_PATH and constructs the preview URL dynamically.

### 6. Create Main Deploy Workflow

Create `.github/workflows/deploy.yml`:

#### For Custom Domain

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

**Replace `CUSTOM_DOMAIN`** with your domain (e.g., `mysite.com`).

#### For Default github.io

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

      - run: BASE_PATH=/${{ github.event.repository.name }}/ npm run build

      - name: Checkout gh-pages branch
        uses: actions/checkout@v4
        with:
          ref: gh-pages
          path: gh-pages

      - name: Copy build to gh-pages root (preserving PR previews)
        run: |
          # Remove old main site files but keep pr-* directories
          find gh-pages -maxdepth 1 -type f -delete
          find gh-pages -maxdepth 1 -type d ! -name 'gh-pages' ! -name 'pr-*' ! -name '.git' -exec rm -rf {} + 2>/dev/null || true
          # Copy new build
          cp -R dist/* gh-pages/

      - name: Commit & push
        run: |
          cd gh-pages
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A
          git commit -m "Deploy main site" || echo "No changes to commit"
          git push
```

**Key difference:** The github.io version includes `BASE_PATH=/${{ github.event.repository.name }}/` in the build step and does NOT create a CNAME file.

### 7. Converting from github.io to Custom Domain

If the user selects "Convert to custom domain":

1. **Update pr-preview.yml:**
   - Change the BASE_PATH from `/${{ github.event.repository.name }}/pr-${{ github.event.pull_request.number }}/` to `/pr-${{ github.event.pull_request.number }}/`
   - Update the preview URL comment from the dynamic github.io format to `https://CUSTOM_DOMAIN/pr-${{ github.event.pull_request.number }}/`

2. **Update deploy.yml:**
   - Remove `BASE_PATH=/${{ github.event.repository.name }}/` from the build command (or set to just `/`)
   - Add the CNAME creation step: `echo "CUSTOM_DOMAIN" > gh-pages/CNAME`
   - Update the find command to preserve CNAME: `find gh-pages -maxdepth 1 -type f ! -name 'CNAME' -delete`

3. **Update vite.config.ts (or equivalent):**
   - If there's a hardcoded base path like `/repo-name/`, change it to `/` or remove it (rely on BASE_PATH env var)

4. **Inform the user** they need to:
   - Configure the custom domain in GitHub repo settings (Settings → Pages → Custom domain)
   - Set up DNS records pointing to GitHub Pages (either CNAME for subdomain or A records for apex domain)

### 8. Ensure gh-pages Branch Exists

Check if the `gh-pages` branch exists. If not, inform the user they need to create it:

```bash
git checkout --orphan gh-pages
git reset --hard
git commit --allow-empty -m "Initial gh-pages"
git push origin gh-pages
git checkout main
```

### 9. Build Tool Variations

**For Next.js projects:**
- Change `dist` to `.next/out` or `out` depending on export config
- Add `output: 'export'` to next.config.js if not present

**For yarn/pnpm projects:**
- Replace `npm ci` with `yarn install --frozen-lockfile` or `pnpm install --frozen-lockfile`
- Replace `npm run build` with `yarn build` or `pnpm build`

### 10. Summary

After setup, inform the user:
1. What files were created/modified
2. That they need to ensure the `gh-pages` branch exists
3. That GitHub Pages should be configured to deploy from the `gh-pages` branch
4. The preview URL format:
   - Custom domain: `https://yourdomain.com/pr-NUMBER/`
   - github.io: `https://username.github.io/repo-name/pr-NUMBER/`
5. If converting to custom domain: DNS configuration steps needed