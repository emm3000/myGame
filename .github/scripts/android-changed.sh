#!/usr/bin/env bash
set -euo pipefail

base="${1:-}"
head="${2:?usage: android-changed.sh <base-sha> <head-sha> [workflow-file]}"
workflow="${3:-}"

if [ -z "$base" ] || ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  echo true
  exit 0
fi

changed="$(git diff --no-renames --name-only "$base" "$head")" || {
  echo true
  exit 0
}

while IFS= read -r file; do
  case "$file" in
    apps/android/* | apps/api/openapi.json | apps/web/public/art/* | apps/web/src/art/* | apps/web/src/design/android/* | apps/web/src/design/tokens.ts | packages/catalog/* | packages/domain/src/*-cases.json)
      echo true
      exit 0
      ;;
  esac
  if [ -n "$workflow" ] && [ "$file" = "$workflow" ]; then
    echo true
    exit 0
  fi
done <<<"$changed"

echo false
