const fs = require('fs');

const filesToPatch = [
  'src/components/storefront/StorefrontHome.tsx',
  'src/components/storefront/StorefrontProducts.tsx'
];

for (const filePath of filesToPatch) {
  let file = fs.readFileSync(filePath, 'utf8');
  // Thay th? object-cover c?a s?n ph?m thành object-contain ho?c object-cover tùy ch?, nhung v?i product image thì object-contain
  // Thay th? w-full h-full object-cover cho img c?a s?n ph?m
  // "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
  
  file = file.replace(/className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/g, 
    'className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"');
    
  // Trong StorefrontProducts.tsx
  file = file.replace(/className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/g,
    'className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"');
    
  fs.writeFileSync(filePath, file);
}
console.log('Patched images!');
