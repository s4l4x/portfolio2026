/**
 * Generate Low Quality Image Placeholders (LQIP) for all images in src/assets
 * Creates tiny ~20px wide WebP images for blur-up effect
 *
 * Uses sharp (maintained, Node 22 compatible)
 * Run: npx tsx scripts/generate-lqip.ts
 */

import sharp from 'sharp';
import { glob } from 'glob';
import { readFile, writeFile, stat } from 'fs/promises';
import path from 'path';

const ASSETS_DIR = 'src/assets';
const LQIP_WIDTH = 20; // Tiny placeholder
const LQIP_QUALITY = 20;

async function generateLQIP() {
  console.log('Generating LQIP placeholders...\n');

  const images = await glob(`${ASSETS_DIR}/**/*.{png,jpg,jpeg,webp}`, {
    ignore: ['**/*.lqip.webp', '**/*.poster.jpg'],
  });

  console.log(`Found ${images.length} images to process\n`);

  const results: Array<{ name: string; originalSize: number; lqipSize: number }> = [];

  for (const imgPath of images) {
    const basename = path.basename(imgPath);
    const nameWithoutExt = basename.replace(/\.\w+$/, '');
    const lqipPath = path.join(path.dirname(imgPath), `${nameWithoutExt}.lqip.webp`);

    try {
      const originalBuffer = await readFile(imgPath);
      const originalSize = originalBuffer.length;

      const lqipBuffer = await sharp(originalBuffer)
        .resize(LQIP_WIDTH)
        .webp({ quality: LQIP_QUALITY })
        .toBuffer();

      await writeFile(lqipPath, lqipBuffer);

      results.push({ name: basename, originalSize, lqipSize: lqipBuffer.length });
      console.log(`✓ ${basename} → ${nameWithoutExt}.lqip.webp (${lqipBuffer.length} bytes)`);
    } catch (err) {
      console.error(`✗ Failed to process ${basename}:`, err);
    }
  }

  console.log('\n--- Summary ---');
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalLqip = results.reduce((sum, r) => sum + r.lqipSize, 0);
  console.log(`Original total: ${(totalOriginal / 1024).toFixed(1)} KB`);
  console.log(`LQIP total: ${(totalLqip / 1024).toFixed(1)} KB`);
  console.log(`Reduction: ${((1 - totalLqip / totalOriginal) * 100).toFixed(1)}%`);
}

generateLQIP().catch(console.error);
