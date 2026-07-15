#!/usr/bin/env bash
# Assemble the Fozzy upload bundle: dist-fozzy/ + kissmyapps-fozzy.zip
# Includes: pages, css, js, favicons, .htaccess
# Excludes: design sources (Portfolio.dc.html, support.js), vercel config, git
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist-fozzy kissmyapps-fozzy.zip
mkdir -p dist-fozzy

for page in index capabilities portfolio partnerships contact privacy terms resume; do
  cp "$page.html" dist-fozzy/
done

cp -R css js dist-fozzy/
cp favicon.svg favicon-32.png apple-touch-icon.png dist-fozzy/
cp send-mail.php dist-fozzy/
cp hosting/.htaccess dist-fozzy/.htaccess

(cd dist-fozzy && zip -qr ../kissmyapps-fozzy.zip .)

echo "Bundle ready:"
echo "  folder: $(pwd)/dist-fozzy"
echo "  zip:    $(pwd)/kissmyapps-fozzy.zip"
unzip -l kissmyapps-fozzy.zip | tail -3
