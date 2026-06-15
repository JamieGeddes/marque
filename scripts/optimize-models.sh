#!/usr/bin/env bash
# Normalize + compress a raw car model into public/models/.
#
#   Usage: scripts/optimize-models.sh <input.glb|gltf> <car-id> <real-length-meters> [rotate-y-degrees]
#   e.g.:  scripts/optimize-models.sh assets-src/ferrari-f40/scene.gltf ferrari-f40 4.36
#
# Output is meters, grounded at y=0, centered on x/z, meshopt-compressed,
# textures GPU-compressed to KTX2 (max 2048px) — UASTC for colour/normal/emissive,
# ETC1S for data maps — so they stay compressed in VRAM. Requires the KTX-Software
# `ktx` CLI on PATH. Keep the Sketchfab license text next to the raw download in
# assets-src/<car-id>/.
set -euo pipefail
cd "$(dirname "$0")/.."

input=$1
id=$2
length=$3
rotate=${4:-0}

command -v ktx >/dev/null 2>&1 || {
  echo "error: KTX-Software 'ktx' CLI not found on PATH (needed by gltf-transform uastc/etc1s)" >&2
  exit 1
}

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

node scripts/normalize.mjs "$input" "$tmp/normalized.glb" "$length" "$rotate"
# Geometry (meshopt) + size cap, no lossy texture recompress yet.
npx gltf-transform optimize "$tmp/normalized.glb" "$tmp/opt.glb" \
  --compress meshopt --texture-compress false --texture-size 2048 --no-join
# GPU-compressed KTX2 textures, then re-apply meshopt (the texture passes decode it).
# Mirrors scripts/compress-textures-ktx2.sh.
npx gltf-transform uastc "$tmp/opt.glb" "$tmp/uastc.glb" \
  --slots "{baseColorTexture,normalTexture,emissiveTexture}" --level 4 --mipmaps --zstd 18
npx gltf-transform etc1s "$tmp/uastc.glb" "$tmp/etc1s.glb" \
  --slots "{metallicRoughnessTexture,occlusionTexture}" --quality 255 --mipmaps
npx gltf-transform meshopt "$tmp/etc1s.glb" "public/models/$id.glb"

ls -lh "public/models/$id.glb"
