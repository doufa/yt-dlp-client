import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

async function convertSvgToPng() {
  const svgBuffer = await fs.readFile(path.join(__dirname, '../assets/icons/source.svg'));
  
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(__dirname, '../assets/icons/source.png'));
}

convertSvgToPng().catch(console.error); 