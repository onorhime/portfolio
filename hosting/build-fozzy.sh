#!/usr/bin/env bash
# Assemble the Fozzy upload bundles:
#   dist-fozzy/ (+ kissmyapps-fozzy.zip)  -> kissmyapps.dev public_html
#   dist-coin/                            -> coin.kissmyapps.dev public_html
# Excludes: design sources (Portfolio.dc.html, support.js), vercel config, git
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist-fozzy dist-coin kissmyapps-fozzy.zip
mkdir -p dist-fozzy dist-coin

# --- main site ---
for page in index capabilities portfolio partnerships contact privacy terms resume; do
  cp "$page.html" dist-fozzy/
done

cp -R css js dist-fozzy/
cp favicon.svg favicon-32.png apple-touch-icon.png dist-fozzy/
cp send-mail.php dist-fozzy/
cp hosting/.htaccess dist-fozzy/.htaccess

(cd dist-fozzy && zip -qr ../kissmyapps-fozzy.zip .)

# --- coin partner subdomain (self-contained bundle) ---
cp coin/index.html dist-coin/
cp -R css js dist-coin/
cp favicon.svg favicon-32.png apple-touch-icon.png dist-coin/
cp send-mail.php dist-coin/
cp hosting/coin.htaccess dist-coin/.htaccess

echo "Bundles ready:"
echo "  main: $(pwd)/dist-fozzy (+ kissmyapps-fozzy.zip)"
echo "  coin: $(pwd)/dist-coin"
