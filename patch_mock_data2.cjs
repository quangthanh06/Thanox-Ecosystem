const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

file = file.replace(/if \(data && data\.length > 0\) \{/g, 'if (data) {');

fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched mock data fallback completely!');
