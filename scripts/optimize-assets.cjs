const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SIZES = [320, 640, 1080, 1920];

const TARGET_IMAGES = [
  'thanox-master-banner.jpg',
  'thanox-original-banner.jpg',
  'gojo-eyes-banner.jpg',
  'thanox-logo.png',
  'thanox-robot-mascot.png',
];

async function optimizeImages() {
  console.log('🚀 Starting Next-Gen Image Optimization with Sharp...');
  const stats = [];

  for (const imageName of TARGET_IMAGES) {
    const inputPath = path.join(PUBLIC_DIR, imageName);
    if (!fs.existsSync(inputPath)) {
      console.warn(`⚠️ Warning: Image not found at ${inputPath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(inputPath);
    const originalSize = fileBuffer.length;
    const ext = path.extname(imageName);
    const baseName = path.basename(imageName, ext);

    const imageMetadata = await sharp(fileBuffer).metadata();
    const origWidth = imageMetadata.width || 1920;

    console.log(`\n📸 Processing: ${imageName} (${(originalSize / 1024).toFixed(1)} KB, ${origWidth}x${imageMetadata.height}px)`);

    // 1. Generate full-res WebP & AVIF versions (Quality 90 - pristine sharpness, no artifacts)
    const webpFull = `${baseName}.webp`;
    const avifFull = `${baseName}.avif`;

    await sharp(fileBuffer)
      .webp({ quality: 90, effort: 6 })
      .toFile(path.join(PUBLIC_DIR, webpFull));

    await sharp(fileBuffer)
      .avif({ quality: 88, effort: 6, chromaSubsampling: '4:4:4' })
      .toFile(path.join(PUBLIC_DIR, avifFull));

    const webpFullSize = fs.statSync(path.join(PUBLIC_DIR, webpFull)).size;
    const avifFullSize = fs.statSync(path.join(PUBLIC_DIR, avifFull)).size;

    stats.push({
      file: imageName,
      origKB: (originalSize / 1024).toFixed(1),
      webpKB: (webpFullSize / 1024).toFixed(1),
      avifKB: (avifFullSize / 1024).toFixed(1),
      saved: `${Math.round((1 - avifFullSize / originalSize) * 100)}%`,
    });

    // 2. Generate multi-resolution responsive variants
    for (const size of SIZES) {
      if (size >= origWidth && size !== 1920) continue;

      const targetWidth = Math.min(size, origWidth);
      const webpVariant = `${baseName}-${size}w.webp`;
      const avifVariant = `${baseName}-${size}w.avif`;

      await sharp(fileBuffer)
        .resize({ width: targetWidth, withoutEnlargement: true })
        .webp({ quality: 88, effort: 5 })
        .toFile(path.join(PUBLIC_DIR, webpVariant));

      await sharp(fileBuffer)
        .resize({ width: targetWidth, withoutEnlargement: true })
        .avif({ quality: 85, effort: 5, chromaSubsampling: '4:4:4' })
        .toFile(path.join(PUBLIC_DIR, avifVariant));
    }
  }

  console.log('\n📊 Image Optimization Summary:');
  console.table(stats);
  console.log('✅ All next-gen responsive image variants generated successfully!');
}

optimizeImages().catch((err) => {
  console.error('❌ Error during image optimization:', err);
  process.exit(1);
});
