#!/usr/bin/env bash
# Bump the build timestamp embedded in index.html so the header badge
# always reflects the moment of the commit. Updates two literals that
# must match exactly:
#   <meta name="build" content="…">
#   <span … id="buildBadge">…</span>
# Idempotent — safe to run repeatedly. Skips silently if index.html
# doesn't exist.
set -euo pipefail

html="$(git rev-parse --show-toplevel)/index.html"
[[ -f "$html" ]] || { echo "no index.html" >&2; exit 0; }

ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# perl -i to edit in place. Two independent substitutions, both
# anchored on stable markers so they only touch the intended literals.
TS="$ts" perl -i -pe '
  s{(<meta\s+name="build"\s+content=")[^"]*(")}{$1.$ENV{TS}.$2}e;
  s{(id="buildBadge"[^>]*>)[^<]*(</span>)}{$1.$ENV{TS}.$2}e;
' "$html"

# Report on change only when something actually moved.
if ! git diff --quiet -- "$html" 2>/dev/null; then
  echo "index.html: build timestamp → $ts"
fi
