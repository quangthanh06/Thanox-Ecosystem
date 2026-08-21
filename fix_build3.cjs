const fs = require('fs');

let prodContent = fs.readFileSync('src/components/ProductsView.tsx', 'utf8');
prodContent = prodContent.replace('Array.from(files).forEach((file) => {', 'Array.from(files).forEach(async (file) => {');
fs.writeFileSync('src/components/ProductsView.tsx', prodContent, 'utf8');
console.log('Fixed ProductsView array foreach');
