const fs = require('fs');

const filesToFix = [
  'src/components/storefront/StorefrontHome.tsx',
  'src/components/storefront/StorefrontProducts.tsx'
];

filesToFix.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/object-contain/g, 'object-cover');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed ' + file);
});
