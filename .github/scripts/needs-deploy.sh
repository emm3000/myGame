#!/usr/bin/env bash
set -euo pipefail

base="${1:-}"
head="${2:?usage: needs-deploy.sh <base-sha> <head-sha>}"

if [ -z "$base" ] || ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  echo true
  exit 0
fi

changed="$(git diff --no-renames --name-only "$base" "$head")"

if [ -z "$changed" ]; then
  echo true
  exit 0
fi

while IFS= read -r file; do
  case "$file" in
    docs/* | *.md) ;;
    *)
      echo true
      exit 0
      ;;
  esac
done <<<"$changed"

echo false
