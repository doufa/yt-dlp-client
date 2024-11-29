import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import icongen from 'icon-gen';

const sizes = [16, 32, 48, 64, 128, 256, 512];
const sourceIcon = path.join(__dirname, '../assets/icons/source.png');
const pngOutputDir = path.join(__dirname, '../assets/icons/png');

async function generateIcons() {
  // Ensure output directory exists
  await fs.mkdir(pngOutputDir, { recursive: true });

  // Generate PNGs
  for (const size of sizes) {
    await sharp(sourceIcon)
      .resize(size, size)
      .png()
      .toFile(path.join(pngOutputDir, `${size}x${size}.png`));
  }

  // Generate ICO and ICNS
  await icongen(sourceIcon, './assets/icons', {
    report: true,
    ico: {
      name: 'icon',
      sizes: [16, 24, 32, 48, 64, 128, 256]
    },
    icns: {
      name: 'icon',
      sizes: [16, 32, 64, 128, 256, 512, 1024]
    }
  });
}

generateIcons().catch(console.error); 