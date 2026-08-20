const fs = require('fs');

const filePath = 'src/components/storefront/StorefrontProducts.tsx';
let file = fs.readFileSync(filePath, 'utf8');

file = file.replace(/className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/g, 
  'className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"');
  
fs.writeFileSync(filePath, file);
console.log('Patched StorefrontProducts');
