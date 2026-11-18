#!/bin/sh
# Збирання застосунку для Windows: ./desktop/build.sh  (потрібні Node.js і npm; результат — dist/Project LORA-win32-x64)
set -e; cd "$(dirname "$0")"; ROOT=..; OUT=../dist; TMP=./.app
rm -rf "$TMP"; mkdir -p "$TMP/game"; cp main.js package.json "$TMP/"
for d in index.html overlay.html src data assets styles lib; do [ -e "$ROOT/$d" ] && cp -r "$ROOT/$d" "$TMP/game/"; done
npx --yes @electron/packager "$TMP" "Project LORA" --platform=win32 --arch=x64 --electron-version=33.4.11 --out "$OUT" --overwrite --app-copyright="Mi-Miracle"
rm -rf "$TMP"
