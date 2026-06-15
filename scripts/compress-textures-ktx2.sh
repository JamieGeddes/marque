#!/usr/bin/env bash
# Re-encode car GLB textures to GPU-compressed KTX2, in place under public/models/.
# Keeps 2048² resolution; cuts texture VRAM ~4-6x because the GPU keeps the texture
# compressed instead of expanding it to RGBA.
#
#   - UASTC + mipmaps for colour / normal / emissive (near-lossless)
#   - ETC1S + mipmaps for metallic-roughness / occlusion (low-frequency data maps)
#   - re-apply meshopt geometry compression (the texture passes decode it)
#
# Requires the KTX-Software `ktx` CLI on PATH (gltf-transform uastc/etc1s shell out
# to it). Operates on every model, or a single one if an id is given.
#
#   Usage: scripts/compress-textures-ktx2.sh [car-id]
set -euo pipefail
cd "$(dirname "$0")/.."

command -v ktx >/dev/null 2>&1 || {
  echo "error: KTX-Software 'ktx' CLI not found on PATH (needed by gltf-transform uastc/etc1s)" >&2
  exit 1
}
GT=./node_modules/.bin/gltf-transform

if [[ $# -ge 1 ]]; then
  models=("public/models/$1.glb")
else
  shopt -s nullglob
  models=(public/models/*.glb)
fi
echo "Re-encoding ${#models[@]} model(s) to KTX2..."

total_before=0
total_after=0
for f in "${models[@]}"; do
  id=$(basename "$f" .glb)
  tmp=$(mktemp -d)
  before=$(stat -f%z "$f")

  # UASTC (high quality) for colour-bearing maps; ETC1S for data maps. Quotes keep
  # the brace glob literal so gltf-transform — not the shell — expands the slots.
  if ! "$GT" uastc "$f" "$tmp/a.glb" \
        --slots "{baseColorTexture,normalTexture,emissiveTexture}" \
        --level 4 --mipmaps --zstd 18; then
    echo "  ! uastc failed: $id" >&2
    rm -rf "$tmp"
    continue
  fi
  "$GT" etc1s "$tmp/a.glb" "$tmp/b.glb" \
    --slots "{metallicRoughnessTexture,occlusionTexture}" \
    --quality 255 --mipmaps || cp "$tmp/a.glb" "$tmp/b.glb"
  "$GT" meshopt "$tmp/b.glb" "$tmp/c.glb" || cp "$tmp/b.glb" "$tmp/c.glb"

  mv "$tmp/c.glb" "$f"
  after=$(stat -f%z "$f")
  rm -rf "$tmp"
  total_before=$((total_before + before))
  total_after=$((total_after + after))
  printf "  %-34s %6d KB -> %6d KB\n" "$id" $((before / 1024)) $((after / 1024))
done
printf "Total on disk: %d MB -> %d MB\n" $((total_before / 1048576)) $((total_after / 1048576))
