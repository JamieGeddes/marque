#!/usr/bin/env bash
# Normalize + compress a raw car model into public/models/.
#
#   Usage: scripts/optimize-models.sh <input.glb|gltf> <car-id> <real-length-meters> [rotate-y-degrees]
#   e.g.:  scripts/optimize-models.sh assets-src/ferrari-f40/scene.gltf ferrari-f40 4.36
#
# Output is meters, grounded at y=0, centered on x/z, meshopt-compressed,
# textures transcoded to webp (max 2048px). Keep the Sketchfab license text
# next to the raw download in assets-src/<car-id>/.
set -euo pipefail
cd "$(dirname "$0")/.."

input=$1
id=$2
length=$3
rotate=${4:-0}

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

node scripts/normalize.mjs "$input" "$tmp/normalized.glb" "$length" "$rotate"
npx gltf-transform optimize "$tmp/normalized.glb" "public/models/$id.glb" \
  --compress meshopt --texture-compress webp --texture-size 2048 --no-join

ls -lh "public/models/$id.glb"
