#!/usr/bin/env bash
# Assemble the Fozzy upload bundles:
#   dist-fozzy/ (+ kissmyapps-fozzy.zip)  -> kissmyapps.dev public_html
#   dist-coin/                            -> coin.kissmyapps.dev public_html
# Excludes: design sources (Portfolio.dc.html, support.js), vercel config, git
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist-fozzy dist-coin dist-plant kissmyapps-fozzy.zip
mkdir -p dist-fozzy

# --- main site ---
for page in index capabilities portfolio partnerships contact privacy terms resume; do
  cp "$page.html" dist-fozzy/
done

cp -R css js dist-fozzy/
cp favicon.svg favicon-32.png apple-touch-icon.png dist-fozzy/
cp send-mail.php dist-fozzy/
cp hosting/.htaccess dist-fozzy/.htaccess

(cd dist-fozzy && zip -qr ../kissmyapps-fozzy.zip .)

# --- partner subdomains (self-contained bundles) ---
for sub in coin plant; do
  rm -rf "dist-$sub"
  mkdir -p "dist-$sub"
  cp "$sub/index.html" "dist-$sub/"
  cp -R css js "dist-$sub/"
  cp favicon.svg favicon-32.png apple-touch-icon.png "dist-$sub/"
  cp send-mail.php "dist-$sub/"
  cp "hosting/$sub.htaccess" "dist-$sub/.htaccess"
done

echo "Bundles ready:"
echo "  main:  $(pwd)/dist-fozzy (+ kissmyapps-fozzy.zip)"
echo "  coin:  $(pwd)/dist-coin"
echo "  plant: $(pwd)/dist-plant"
