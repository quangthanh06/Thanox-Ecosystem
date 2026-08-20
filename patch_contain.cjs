const fs = require('fs');

function replaceFile(path, replacer) {
  let file = fs.readFileSync(path, 'utf8');
  file = replacer(file);
  fs.writeFileSync(path, file);
}

replaceFile('src/components/storefront/StorefrontProducts.tsx', (file) => {
  file = file.replace(/className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/g, 'className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"');
  // Xóa bg-[#161626] border border-white/10 d? ?nh contain d?p hon
  file = file.replace(/bg-\[\#161626\] border border-white\/5/g, 'bg-transparent');
  return file;
});

replaceFile('src/components/storefront/StorefrontHome.tsx', (file) => {
  file = file.replace(/className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/g, 'className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"');
  file = file.replace(/bg-\[\#161626\] border border-white\/10/g, 'bg-transparent');
  return file;
});

replaceFile('src/components/storefront/StorefrontProductDetail.tsx', (file) => {
  file = file.replace(/aspectRatio: '16 \/ 9', objectFit: 'cover'/g, "aspectRatio: '16 / 9', objectFit: 'contain'");
  file = file.replace(/className="product-main-image w-full h-full object-cover/g, 'className="product-main-image w-full h-full object-contain');
  return file;
});

console.log('Patched to object-contain and transparent background');
