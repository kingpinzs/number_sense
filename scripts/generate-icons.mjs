import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Verify we're running from the correct location
if (!existsSync(resolve(projectRoot, 'package.json'))) {
  console.error('Error: Cannot find project root. Run this script via "npm run generate-icons".');
  process.exit(1);
}

try {
  // Read SVG sources (stored alongside this script, not in public/)
  const svgMain = readFileSync(resolve(__dirname, 'source-icon.svg'));
  const svgMaskable = readFileSync(resolve(__dirname, 'source-icon-maskable.svg'));

  // Create output directory
  mkdirSync(resolve(projectRoot, 'public/icons'), { recursive: true });

  // Generate standard icons from main SVG
  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { name, size } of sizes) {
    await sharp(svgMain)
      .resize(size, size)
      .png()
      .toFile(resolve(projectRoot, `public/icons/${name}`));
    console.log(`Generated public/icons/${name} (${size}x${size})`);
  }

  // Generate maskable icon from maskable SVG (content within safe zone)
  await sharp(svgMaskable)
    .resize(512, 512)
    .png()
    .toFile(resolve(projectRoot, 'public/icons/icon-maskable.png'));
  console.log('Generated public/icons/icon-maskable.png (512x512 maskable)');

  // Generate favicon.ico (32x32) as proper ICO format
  const png32 = await sharp(svgMain)
    .resize(32, 32)
    .png()
    .toBuffer();

  const icoBuffer = await pngToIco([png32]);
  writeFileSync(resolve(projectRoot, 'public/favicon.ico'), icoBuffer);
  console.log('Generated public/favicon.ico (32x32 ICO)');

  console.log('\nAll icons generated successfully!');
} catch (error) {
  console.error('Icon generation failed:', error.message);
  process.exit(1);
}
