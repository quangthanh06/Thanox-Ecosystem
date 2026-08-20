const fs = require('fs');
let file = fs.readFileSync('src/components/storefront/StorefrontHome.tsx', 'utf8');

// Fix aspect-auto collapsing to 0 height
file = file.replace(/max-w-xl aspect-auto/g, 'max-w-2xl aspect-video');

fs.writeFileSync('src/components/storefront/StorefrontHome.tsx', file);
console.log('Fixed banner height collapse!');
