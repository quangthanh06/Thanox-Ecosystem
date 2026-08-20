const fs = require('fs');

function replaceFile(path, replacer) {
  let file = fs.readFileSync(path, 'utf8');
  file = replacer(file);
  fs.writeFileSync(path, file);
}

replaceFile('src/components/storefront/StorefrontProducts.tsx', (file) => {
  // Replace aspect-square with aspect-[16/9]
  file = file.replace(/aspect-video sm:aspect-square/g, 'aspect-video');
  // Change object-contain back to object-cover
  file = file.replace(/className="w-full h-full object-contain/g, 'className="w-full h-full object-cover');
  return file;
});

replaceFile('src/components/storefront/StorefrontHome.tsx', (file) => {
  file = file.replace(/aspect-\[16\/10\]/g, 'aspect-video');
  file = file.replace(/className="w-full h-full object-contain/g, 'className="w-full h-full object-cover');
  return file;
});

replaceFile('src/components/storefront/StorefrontProductDetail.tsx', (file) => {
  file = file.replace(/aspectRatio: '16 \/ 10'/g, "aspectRatio: '16 / 9'");
  file = file.replace(/objectFit: 'contain'/g, "objectFit: 'cover'");
  file = file.replace(/className="product-main-image w-full h-full object-contain/g, 'className="product-main-image w-full h-full object-cover');
  return file;
});

console.log('Patched aspect ratios and object-cover');
