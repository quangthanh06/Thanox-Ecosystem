const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const sourceImg = path.join(__dirname, '..', 'public', 'thanox-robot-mascot.png');
  const publicDir = path.join(__dirname, '..', 'public');

  console.log('Generating pure transparent round favicons from:', sourceImg);

  // Helper to make a circular transparent mask of size N x N
  const createCircleMask = (size) => {
    const r = size / 2;
    return Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}" fill="#fff" /></svg>`
    );
  };

  // 1. Generate full-bleed logo without black frame
  const logoBuffer = await sharp(sourceImg)
    .resize(512, 512, { fit: 'cover', position: 'center' })
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'thanox-logo.png'), logoBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), logoBuffer);

  // 2. Generate Apple Touch Icon (180x180) with circular transparent cutout
  await sharp(sourceImg)
    .resize(180, 180, { fit: 'cover' })
    .composite([{ input: createCircleMask(180), blend: 'dest-in' }])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 3. Generate 32x32 and 16x16 Favicons with circular transparent cutout (ZERO black square corners!)
  await sharp(sourceImg)
    .resize(32, 32, { fit: 'cover' })
    .composite([{ input: createCircleMask(32), blend: 'dest-in' }])
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  await sharp(sourceImg)
    .resize(16, 16, { fit: 'cover' })
    .composite([{ input: createCircleMask(16), blend: 'dest-in' }])
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  await sharp(sourceImg)
    .resize(48, 48, { fit: 'cover' })
    .composite([{ input: createCircleMask(48), blend: 'dest-in' }])
    .png()
    .toFile(path.join(publicDir, 'favicon-48x48.png'));

  // 4. Generate favicon.ico as circular transparent PNG
  const icoBuffer = await sharp(sourceImg)
    .resize(32, 32, { fit: 'cover' })
    .composite([{ input: createCircleMask(32), blend: 'dest-in' }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

  // 5. Generate clean pure circular transparent vector favicon.svg (NO black border box!)
  const thumbBase64 = (
    await sharp(sourceImg)
      .resize(128, 128, { fit: 'cover' })
      .composite([{ input: createCircleMask(128), blend: 'dest-in' }])
      .png({ quality: 90 })
      .toBuffer()
  ).toString('base64');

  const cleanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <defs>
    <clipPath id="circleClip">
      <circle cx="64" cy="64" r="64" />
    </clipPath>
  </defs>
  <g clip-path="url(#circleClip)">
    <image href="data:image/png;base64,${thumbBase64}" width="128" height="128" />
  </g>
</svg>`;

  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), cleanSvg);

  console.log('✅ ALL FAVICONS GENERATED WITH PURE CIRCULAR TRANSPARENCY (NO BLACK BORDER):');
  console.log('- favicon.ico (32x32 transparent circle)');
  console.log('- favicon-32x32.png (transparent circle)');
  console.log('- favicon-16x16.png (transparent circle)');
  console.log('- apple-touch-icon.png (180x180 transparent circle)');
  console.log('- thanox-logo.png (512x512)');
  console.log('- favicon.svg (pure circular SVG with no border)');
}

main().catch(console.error);
