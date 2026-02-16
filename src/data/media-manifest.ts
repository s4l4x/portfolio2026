/**
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
}

export type MediaManifestEntry = ImageManifestEntry | VideoManifestEntry;

export const mediaManifest: Record<string, MediaManifestEntry> = {
  "periscopeLive360.webp": {
    "type": "image",
    "lqip": "periscopeLive360.lqip.webp",
    "width": 1600,
    "height": 741
  },
  "lucyLogo.png": {
    "type": "image",
    "lqip": "lucyLogo.lqip.webp",
    "width": 719,
    "height": 480
  },
  "lucyFifer.png": {
    "type": "image",
    "lqip": "lucyFifer.lqip.webp",
    "width": 719,
    "height": 480
  },
  "g.love.png": {
    "type": "image",
    "lqip": "g.love.lqip.webp",
    "width": 1024,
    "height": 1024
  },
  "ixomoxiMissy.png": {
    "type": "image",
    "lqip": "ixomoxiMissy.lqip.webp",
    "width": 960,
    "height": 540
  },
  "dionysianJournalsFG.png": {
    "type": "image",
    "lqip": "dionysianJournalsFG.lqip.webp",
    "width": 4096,
    "height": 4096
  },
  "dionysianJournals.png": {
    "type": "image",
    "lqip": "dionysianJournals.lqip.webp",
    "width": 2048,
    "height": 2048
  },
  "braidJourney.png": {
    "type": "image",
    "lqip": "braidJourney.lqip.webp",
    "width": 2714,
    "height": 2754
  },
  "braidGenerate.png": {
    "type": "image",
    "lqip": "braidGenerate.lqip.webp",
    "width": 1492,
    "height": 1150
  },
  "braidChat.png": {
    "type": "image",
    "lqip": "braidChat.lqip.webp",
    "width": 942,
    "height": 1846
  },
  "Braid-Slides-Wonder.png": {
    "type": "image",
    "lqip": "Braid-Slides-Wonder.lqip.webp",
    "width": 1492,
    "height": 1150
  },
  "Braid-Slides-Tapping.png": {
    "type": "image",
    "lqip": "Braid-Slides-Tapping.lqip.webp",
    "width": 1492,
    "height": 1150
  },
  "Braid-Slides-Sharing.png": {
    "type": "image",
    "lqip": "Braid-Slides-Sharing.lqip.webp",
    "width": 1492,
    "height": 1150
  },
  "Braid-Slides-Security.png": {
    "type": "image",
    "lqip": "Braid-Slides-Security.lqip.webp",
    "width": 1492,
    "height": 1150
  },
  "Braid-Slides-Kota.png": {
    "type": "image",
    "lqip": "Braid-Slides-Kota.lqip.webp",
    "width": 1492,
    "height": 1150
  },
  "Braid-Slides-Generate.png": {
    "type": "image",
    "lqip": "Braid-Slides-Generate.lqip.webp",
    "width": 1492,
    "height": 1150
  },
  "Braid-Slides-Collaboration.png": {
    "type": "image",
    "lqip": "Braid-Slides-Collaboration.lqip.webp",
    "width": 1492,
    "height": 1150
  },
  "Braid-Slides-Augment.png": {
    "type": "image",
    "lqip": "Braid-Slides-Augment.lqip.webp",
    "width": 1492,
    "height": 1150
  },
  "apolloVibes.png": {
    "type": "image",
    "lqip": "apolloVibes.lqip.webp",
    "width": 848,
    "height": 1842
  },
  "periscopeLive360_sizzle.mp4": {
    "type": "video",
    "poster": "periscopeLive360_sizzle.poster.jpg",
    "width": 1920,
    "height": 1080,
    "duration": 30.24
  },
  "Twitter_Viewfinder.mov": {
    "type": "video",
    "poster": "Twitter_Viewfinder.poster.jpg",
    "width": 750,
    "height": 1334,
    "duration": 36.018798
  },
  "Twitter_Viewfinder-Up-to-4K.mov": {
    "type": "video",
    "poster": "Twitter_Viewfinder-Up-to-4K.poster.jpg",
    "width": 750,
    "height": 1334,
    "duration": 35.95
  },
  "Twitter_Marvel_02-HD-1080p.mov": {
    "type": "video",
    "poster": "Twitter_Marvel_02-HD-1080p.poster.jpg",
    "width": 608,
    "height": 1080,
    "duration": 15.466667
  },
  "Twitter_Building_081517-HD-1080p.mov": {
    "type": "video",
    "poster": "Twitter_Building_081517-HD-1080p.poster.jpg",
    "width": 608,
    "height": 1080,
    "duration": 14.666667
  },
  "g.love-IMG_7636-1080p.mov": {
    "type": "video",
    "poster": "g.love-IMG_7636-1080p.poster.jpg",
    "width": 1920,
    "height": 1080,
    "duration": 6.45
  },
  "g.love-IMG_7225-1080p.mov": {
    "type": "video",
    "poster": "g.love-IMG_7225-1080p.poster.jpg",
    "width": 608,
    "height": 1080,
    "duration": 7.766667
  }
};

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
  const baseMatch = filename.match(/^(.+?)(-[a-z0-9]+)?\.(\w+)$/i);
  if (baseMatch) {
    const [, name, , ext] = baseMatch;
    const unhashed = `${name}.${ext}`;
    if (mediaManifest[unhashed]) return mediaManifest[unhashed];
  }

  return undefined;
}
