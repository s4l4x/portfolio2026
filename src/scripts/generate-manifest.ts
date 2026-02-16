/**
 * Generate a media manifest mapping full assets to their LQIP/poster counterparts
 * Outputs src/data/media-manifest.ts
 *
 * Run: npx tsx scripts/generate-manifest.ts
 */

import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';
import { execSync } from 'child_process';

const ASSETS_DIR = 'src/assets';
const OUTPUT_FILE = 'src/data/media-manifest.ts';

interface ImageManifestEntry {
  type: 'image';
  lqip: string;
  width: number;
  height: number;
}

interface VideoManifestEntry {
  type: 'video';
  poster: string;
  width?: number;
  height?: number;
  duration?: number;
}

type ManifestEntry = ImageManifestEntry | VideoManifestEntry;

function videoHasAudio(videoPath: string): boolean {
  try {
    const result = execSync(
      `ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "${videoPath}"`,
      { encoding: 'utf-8' }
    );
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

// Get image dimensions using sips (macOS) or identify (ImageMagick)
function getImageDimensions(imgPath: string): { width: number; height: number } {
  try {
    // Try sips first (macOS built-in)
    const result = execSync(
      `sips -g pixelWidth -g pixelHeight "${imgPath}" 2>/dev/null | grep pixel`,
      { encoding: 'utf-8' }
    );
    const widthMatch = result.match(/pixelWidth:\s*(\d+)/);
    const heightMatch = result.match(/pixelHeight:\s*(\d+)/);
    if (widthMatch && heightMatch) {
      return { width: parseInt(widthMatch[1]), height: parseInt(heightMatch[1]) };
    }
  } catch {
    // Try ImageMagick identify as fallback
    try {
      const result = execSync(
        `identify -format "%w %h" "${imgPath}" 2>/dev/null`,
        { encoding: 'utf-8' }
      );
      const [width, height] = result.trim().split(' ').map(Number);
      if (width && height) {
        return { width, height };
      }
    } catch {
      // Ignore
    }
  }
  return { width: 0, height: 0 };
}

function getVideoDuration(videoPath: string): number | undefined {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
      { encoding: 'utf-8' }
    );
    return parseFloat(result.trim());
  } catch {
    return undefined;
  }
}

function getVideoResolution(videoPath: string): { width: number; height: number } | undefined {
  try {
    const result = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoPath}"`,
      { encoding: 'utf-8' }
    );
    const [width, height] = result.trim().split('x').map(Number);
    return { width, height };
  } catch {
    return undefined;
  }
}

async function generateManifest() {
  console.log('Generating media manifest...\n');

  const manifest: Record<string, ManifestEntry> = {};

  // Process images
  const images = await glob(`${ASSETS_DIR}/**/*.{png,jpg,jpeg,webp}`, {
    ignore: ['**/*.lqip.webp', '**/*.poster.jpg'],
  });

  for (const imgPath of images) {
    const basename = path.basename(imgPath);
    const nameWithoutExt = basename.replace(/\.\w+$/, '');
    const lqipFile = `${nameWithoutExt}.lqip.webp`;
    const lqipPath = path.join(path.dirname(imgPath), lqipFile);

    try {
      await fs.access(lqipPath);
      const dimensions = getImageDimensions(imgPath);

      manifest[basename] = {
        type: 'image',
        lqip: lqipFile,
        width: dimensions.width,
        height: dimensions.height,
      };
      console.log(`✓ ${basename}`);
    } catch {
      console.log(`⚠ ${basename} - no LQIP found, skipping`);
    }
  }

  // Process videos
  const videos = await glob(`${ASSETS_DIR}/**/*.{mov,mp4}`);

  for (const videoPath of videos) {
    const basename = path.basename(videoPath);
    const nameWithoutExt = basename.replace(/\.\w+$/, '');
    const posterFile = `${nameWithoutExt}.poster.jpg`;
    const posterPath = path.join(path.dirname(videoPath), posterFile);

    try {
      await fs.access(posterPath);
      const duration = getVideoDuration(videoPath);
      const resolution = getVideoResolution(videoPath);
      const hasAudio = videoHasAudio(videoPath);

      manifest[basename] = {
        type: 'video',
        poster: posterFile,
        ...(resolution && { width: resolution.width, height: resolution.height }),
        ...(duration && { duration }),
        ...(hasAudio && { hasAudio: true }),
      };
      console.log(`✓ ${basename}`);
    } catch {
      console.log(`⚠ ${basename} - no poster found, skipping`);
    }
  }

  // Generate TypeScript file
  const output = `/**
 * Auto-generated media manifest
 * Maps assets to their LQIP/poster counterparts
 *
 * DO NOT EDIT - regenerate with: npm run generate-manifest
 */

export interface ImageManifestEntry {
  type: 'image';
  lqip: string;
  width: number;
  height: number;
}

export interface VideoManifestEntry {
  type: 'video';
  poster: string;
  width?: number;
  height?: number;
  duration?: number;
  hasAudio?: boolean;
}

export type MediaManifestEntry = ImageManifestEntry | VideoManifestEntry;

export const mediaManifest: Record<string, MediaManifestEntry> = ${JSON.stringify(manifest, null, 2)};

/**
 * Get manifest entry for an asset path (handles both full paths and filenames)
 */
export function getManifestEntry(assetPath: string): MediaManifestEntry | undefined {
  // Extract filename from path (handles Vite's hashed URLs too)
  const filename = assetPath.split('/').pop()?.split('?')[0];
  if (!filename) return undefined;

  // Direct lookup
  if (mediaManifest[filename]) return mediaManifest[filename];

  // Try matching without hash (e.g., "g.love-abc123.png" → "g.love.png")
  const baseMatch = filename.match(/^(.+?)(-[a-z0-9]+)?\\.(\\w+)$/i);
  if (baseMatch) {
    const [, name, , ext] = baseMatch;
    const unhashed = \`\${name}.\${ext}\`;
    if (mediaManifest[unhashed]) return mediaManifest[unhashed];
  }

  return undefined;
}
`;

  await fs.writeFile(OUTPUT_FILE, output);
  console.log(`\n✓ Manifest written to ${OUTPUT_FILE}`);
  console.log(`  ${Object.keys(manifest).length} entries`);
}

generateManifest().catch(console.error);
