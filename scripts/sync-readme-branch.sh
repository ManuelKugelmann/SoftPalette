#!/usr/bin/env bash
# Rewrite the "This branch (raw.githack)" link in README.md so it always
# points at the branch currently checked out. Idempotent — safe to run
# in a loop. Skips silently on a detached HEAD.
set -euo pipefail

readme="$(git rev-parse --show-toplevel)/README.md"
[[ -f "$readme" ]] || { echo "no README.md" >&2; exit 0; }

branch="$(git rev-parse --abbrev-ref HEAD)"
[[ "$branch" != "HEAD" ]] || exit 0

owner_repo="ManuelKugelmann/SoftPalette"
new_url="https://raw.githack.com/${owner_repo}/${branch}/index.html"

# Replace the URL on the matching README line.
tmp="$(mktemp)"
awk -v url="$new_url" '
  /\*\*This branch \(raw\.githack\)\*\*/ {
    sub(/<https:\/\/raw\.githack\.com\/[^>]*>/, "<" url ">")
  }
  { print }
' "$readme" > "$tmp"

if ! cmp -s "$tmp" "$readme"; then
  mv "$tmp" "$readme"
  echo "README.md: synced githack link → $branch"
else
  rm -f "$tmp"
fi
