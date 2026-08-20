const fs = require('fs');
let file = fs.readFileSync('src/components/storefront/StorefrontHome.tsx', 'utf8');

// Change max-w-sm aspect-[4/3] to max-w-lg aspect-auto to make it larger and wider
file = file.replace(/max-w-sm aspect-\[4\/3\]/g, 'max-w-xl aspect-auto');
// Change object-cover to object-contain for the banner image to not crop
file = file.replace(/className="w-full h-full object-cover rounded-2xl"/g, 'className="w-full h-full object-contain rounded-2xl"');
fs.writeFileSync('src/components/storefront/StorefrontHome.tsx', file);
console.log('Patched banner layout!');
