#!/bin/bash
# Release script — bumps version, commits, tags, and pushes to trigger APK build
#
# Usage:
#   ./scripts/release.sh patch    # 0.1.0 → 0.1.1
#   ./scripts/release.sh minor    # 0.1.0 → 0.2.0
#   ./scripts/release.sh major    # 0.1.0 → 1.0.0
#   ./scripts/release.sh 1.2.3    # set exact version

set -euo pipefail

BUMP="${1:-patch}"

# Ensure working tree is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working tree has uncommitted changes. Commit or stash first."
  exit 1
fi

# Bump version in package.json (without auto-tagging)
npm version "$BUMP" --no-git-tag-version

# Read the new version
VERSION=$(node -p "require('./package.json').version")

# Also update capacitor.config.json if it has a version field
if [ -f capacitor.config.json ]; then
  node -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8'));
    cfg.appVersion = '$VERSION';
    fs.writeFileSync('capacitor.config.json', JSON.stringify(cfg, null, 2) + '\n');
  " 2>/dev/null || true
fi

# Commit and tag
git add package.json package-lock.json capacitor.config.json 2>/dev/null || git add package.json
git commit -m "Release v${VERSION}"
git tag -a "v${VERSION}" -m "Release v${VERSION}"

echo ""
echo "✅ Version bumped to v${VERSION}"
echo ""
echo "Run this to push and trigger the APK build:"
echo "  git push && git push --tags"
echo ""
echo "Once pushed, GitHub Actions will:"
echo "  1. Build the web app"
echo "  2. Build the Android APK"
echo "  3. Create a GitHub Release at:"
echo "     https://github.com/kingpinzs/number_sense/releases/tag/v${VERSION}"
echo "  4. Attach discalculas-v${VERSION}.apk to the release"
