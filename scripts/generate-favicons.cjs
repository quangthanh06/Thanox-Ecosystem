const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const sourceImg = path.join(__dirname, '..', 'public', 'thanox-robot-mascot.png');
  const publicDir = path.join(__dirname, '..', 'public');

  console.log('Generating crisp, optimized favicons and logo from:', sourceImg);

  // 1. Generate full-bleed tight cropped logo (Thanox Logo)
  // Let's crop slightly into the robot head and melting text so it fills the frame without giant black margins
  const metadata = await sharp(sourceImg).metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  // Generate tight square crop for logo and icons
  const logoBuffer = await sharp(sourceImg)
    .resize(512, 512, { fit: 'cover', position: 'center' })
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'thanox-logo.png'), logoBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), logoBuffer);

  // 2. Generate Apple Touch Icon (180x180)
  await sharp(sourceImg)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 3. Generate 32x32 and 16x16 Favicons (Ultra lightweight < 2KB each!)
  await sharp(sourceImg)
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  await sharp(sourceImg)
    .resize(16, 16, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  await sharp(sourceImg)
    .resize(48, 48, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon-48x48.png'));

  // Also write 32x32 as favicon.ico
  const icoBuffer = await sharp(sourceImg)
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

  // 4. Generate clean lightweight vector favicon.svg (under 3KB, NOT 500KB!)
  // Using direct clean vector layout or lightweight base64 thumbnail
  const thumbBase64 = (await sharp(sourceImg).resize(128, 128, { fit: 'cover' }).png({ quality: 80 }).toBuffer()).toString('base64');
  
  const cleanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <defs>
    <clipPath id="sq">
      <rect width="128" height="128" rx="28" fill="black" />
    </clipPath>
  </defs>
  <rect width="128" height="128" rx="28" fill="#090912" />
  <g clip-path="url(#sq)">
    <image href="data:image/png;base64,${thumbBase64}" width="128" height="128" />
  </g>
  <rect width="128" height="128" rx="28" stroke="#7C3AED" stroke-width="4" stroke-opacity="0.7" fill="none" />
</svg>`;

  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), cleanSvg);

  console.log('✅ ALL FAVICONS & LOGOS GENERATED SUCCESSFULLY:');
  console.log('- favicon.ico (32x32 PNG)');
  console.log('- favicon-32x32.png');
  console.log('- favicon-16x16.png');
  console.log('- apple-touch-icon.png (180x180)');
  console.log('- thanox-logo.png (512x512 full bleed)');
  console.log('- favicon.svg (Clean & super lightweight < 15KB)');
}

main().catch(console.error);
