# Portfolio 2026

Live: https://s4l4x.github.io/portfolio2026/

## Custom Domain Setup

To use a custom domain:

1. Add your domain in GitHub repo Settings → Pages → Custom domain
2. Update `.github/workflows/deploy.yml`: change `BASE_PATH=/portfolio2026/` to `BASE_PATH=/`
3. Update `.github/workflows/pr-preview.yml`: the preview URL comment will need the new domain
4. Add a `CNAME` file to `gh-pages` branch with your domain (GitHub does this automatically when you set custom domain)
