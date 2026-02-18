#!/bin/bash
#
# Generate poster frames for all videos in src/assets
# Extracts first frame at high quality for video placeholders
#
# Requires: ffmpeg
# Run: bash scripts/generate-posters.sh

ASSETS_DIR="src/assets"

# Enable recursive globbing
shopt -s globstar nullglob

echo "Generating video poster frames..."
echo ""

count=0

for video in "$ASSETS_DIR"/**/*.{mov,mp4}; do
  # Skip if no matching files
  [ -e "$video" ] || continue

  # Skip if poster already exists and video hasn't changed
  poster="${video%.*}.poster.jpg"

  # Generate poster from first frame
  if ffmpeg -y -i "$video" -vframes 1 -q:v 2 "$poster" 2>/dev/null; then
    echo "✓ $(basename "$video") → $(basename "$poster")"
    ((count++))
  else
    echo "✗ Failed: $(basename "$video")"
  fi
done

echo ""
echo "Generated $count poster frames"
