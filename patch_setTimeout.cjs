const fs = require('fs');
let file = fs.readFileSync('src/components/storefront/StorefrontForgotPassword.tsx', 'utf8');

file = file.replace(/setTimeout\(\(\) => \{/g, 'setTimeout(async () => {');

fs.writeFileSync('src/components/storefront/StorefrontForgotPassword.tsx', file);
console.log('Patched setTimeout!');
