#!/usr/bin/env bash
# ALAS Salt Co. — Shopify theme project bootstrap
# Run this ONCE, in the folder where you want the project to live.
#
#   chmod +x setup.sh
#   ./setup.sh alas-salt.myshopify.com
#
# Replace the argument with the real .myshopify.com domain for the store.

set -euo pipefail

STORE="${1:-}"
if [ -z "$STORE" ]; then
  echo "Usage: ./setup.sh <your-store>.myshopify.com"
  exit 1
fi

PROJECT="alas-theme"

echo "==> Checking Node.js"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install the LTS build from https://nodejs.org first."
  exit 1
fi
node --version

echo "==> Installing Shopify CLI (needs 3.84.0+, latest is 4.x)"
npm install -g @shopify/cli@latest
shopify version

echo "==> Creating theme from Dawn"
shopify theme init "$PROJECT"
cd "$PROJECT"

echo "==> Writing .gitignore"
cat > .gitignore <<'EOF'
.shopify/
node_modules/
.env
.env.*
.DS_Store
*.log
EOF

echo "==> Writing .shopifyignore"
cat > .shopifyignore <<'EOF'
CLAUDE.md
README.md
setup.sh
.git/
EOF

echo "==> Initializing git"
git init
git add -A
git commit -m "Dawn baseline before ALAS customization"
git branch -M main

cat <<EOF

Done. Next:

  cd $PROJECT
  cp ../CLAUDE.md .          # drop in the project brief
  git add CLAUDE.md && git commit -m "Add project brief"

Create an EMPTY PRIVATE repo on GitHub, then:

  git remote add origin git@github.com:<you>/alas-theme.git
  git push -u origin main

Start the local preview against the real store:

  shopify theme dev --store $STORE

Then open Claude Code in this folder and start with the brief in CLAUDE.md.

Note: if the store is still password protected, you need CLI 3.84.0+
(this script installs the latest, so you are covered).
EOF
