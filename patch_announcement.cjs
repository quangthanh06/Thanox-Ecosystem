const fs = require('fs');
let file = fs.readFileSync('src/components/storefront/StorefrontLayout.tsx', 'utf8');

file = file.replace(/className="bg-gradient-to-r from-\[\#7C3AED\] via-\[\#6D28D9\] to-\[\#06B6D4\] text-white text-\[11px\] sm:text-xs font-semibold py-1\.5 px-4 text-center flex items-center justify-center gap-2 shadow-sm"/g, 
  'className="bg-[#161626]/80 backdrop-blur-md border-b border-white/5 text-[#E2E8F0] text-[11px] sm:text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm"');

fs.writeFileSync('src/components/storefront/StorefrontLayout.tsx', file);
console.log('Patched announcement bar color!');
