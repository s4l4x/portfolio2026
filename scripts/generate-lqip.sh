#!/bin/bash
#
# Generate Low Quality Image Placeholders (LQIP) for all images in src/assets
# Creates tiny ~20px wide WebP images for blur-up effect
#
# Requires: ffmpeg
# Run: bash scripts/generate-lqip.sh

ASSETS_DIR="src/assets"

# Enable recursive globbing
shopt -s globstar nullglob

echo "Generating LQIP placeholders..."
echo ""

count=0

for image in "$ASSETS_DIR"/**/*.png "$ASSETS_DIR"/**/*.jpg "$ASSETS_DIR"/**/*.jpeg "$ASSETS_DIR"/**/*.webp; do
  # Skip if no matching files
  [ -e "$image" ] || continue

  # Skip LQIP and poster files
  case "$image" in
    *.lqip.webp) continue ;;
    *.poster.jpg) continue ;;
  esac

  # Output path: replace extension with .lqip.webp
  lqip="${image%.*}.lqip.webp"

  if ffmpeg -y -i "$image" -vf "scale=20:-1" -quality 20 "$lqip" 2>/dev/null; then
    size=$(wc -c < "$lqip" | tr -d ' ')
    echo "✓ $(basename "$image") → $(basename "$lqip") (${size} bytes)"
    ((count++))
  else
    echo "✗ Failed: $(basename "$image")"
  fi
done

echo ""
echo "Generated $count LQIP placeholders"
