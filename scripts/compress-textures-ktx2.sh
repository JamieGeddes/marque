#!/usr/bin/env bash
# Re-encode car GLB textures to GPU-compressed KTX2, in place under public/models/.
# Keeps 2048² resolution; cuts texture VRAM ~4-6x because the GPU keeps the texture
# compressed (BC7/BC1/ASTC/ETC) instead of expanding it to RGBA. Disk size grows
# (KTX2 is VRAM-optimised, not transmission-optimised) — that is the trade.
#
#   - WebP textures are first re-wrapped to PNG (ktx cannot read WebP).
#   - UASTC + mipmaps for colour / normal / emissive (near-lossless)
#   - ETC1S + mipmaps for metallic-roughness / occlusion (low-frequency data maps)
#   - meshopt geometry compression is re-applied (the texture passes decode it)
#
# Requires the KTX-Software `ktx` CLI on PATH (gltf-transform uastc/etc1s shell out
# to it). Encodes every model, or a single one if a car-id is given. Parallelism
# via JOBS (default 4).
#
#   Usage: [JOBS=8] scripts/compress-textures-ktx2.sh [car-id]
set -euo pipefail
cd "$(dirname "$0")/.."

command -v ktx >/dev/null 2>&1 || {
  echo "error: KTX-Software 'ktx' CLI not found on PATH (needed by gltf-transform uastc/etc1s)" >&2
  exit 1
}

encode_one() {
  local f="$1"
  local GT=./node_modules/.bin/gltf-transform
  local id tmp before after
  id=$(basename "$f" .glb)
  tmp=$(mktemp -d)
  before=$(stat -f%z "$f")

  # ktx cannot read WebP — losslessly re-wrap textures as PNG first.
  if ! node scripts/webp-to-png.mjs "$f" "$tmp/p.glb" >/dev/null 2>&1; then
    echo "  ! png-decode failed: $id" >&2; rm -rf "$tmp"; return
  fi
  # UASTC (high quality) for colour-bearing maps; ETC1S for data maps. Quotes keep
  # the brace glob literal so gltf-transform — not the shell — expands the slots.
  if ! "$GT" uastc "$tmp/p.glb" "$tmp/a.glb" \
        --slots "{baseColorTexture,normalTexture,emissiveTexture}" \
        --level 2 --mipmaps --zstd 18 >/dev/null 2>&1; then
    echo "  ! uastc failed: $id" >&2; rm -rf "$tmp"; return
  fi
  "$GT" etc1s "$tmp/a.glb" "$tmp/b.glb" \
    --slots "{metallicRoughnessTexture,occlusionTexture}" \
    --quality 255 --mipmaps >/dev/null 2>&1 || cp "$tmp/a.glb" "$tmp/b.glb"
  "$GT" meshopt "$tmp/b.glb" "$tmp/c.glb" >/dev/null 2>&1 || cp "$tmp/b.glb" "$tmp/c.glb"

  mv "$tmp/c.glb" "$f"
  after=$(stat -f%z "$f")
  rm -rf "$tmp"
  printf "  %-34s %6d KB -> %6d KB\n" "$id" $((before / 1024)) $((after / 1024))
}
export -f encode_one

if [[ $# -ge 1 ]]; then
  models=("public/models/$1.glb")
else
  shopt -s nullglob
  models=(public/models/*.glb)
fi
echo "Re-encoding ${#models[@]} model(s) to KTX2 (JOBS=${JOBS:-4})..."
printf '%s\n' "${models[@]}" | xargs -P "${JOBS:-4}" -I {} bash -c 'encode_one "$@"' _ {}
echo "Done."
