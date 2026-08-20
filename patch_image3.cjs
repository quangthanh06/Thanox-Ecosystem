const fs = require('fs');

const filePath = 'src/components/storefront/StorefrontProductDetail.tsx';
let file = fs.readFileSync(filePath, 'utf8');

file = file.replace(/className="product-main-image w-full h-full object-cover block transition-transform duration-500 hover:scale-\[1.03\]"/g, 
  'className="product-main-image w-full h-full object-contain block transition-transform duration-500 hover:scale-[1.03]"');
  
file = file.replace(/style=\{\{ aspectRatio: '16 \/ 10', objectFit: 'cover' \}\}/g, 
  "style={{ aspectRatio: '16 / 10', objectFit: 'contain' }}");
  
fs.writeFileSync(filePath, file);
console.log('Patched StorefrontProductDetail');
