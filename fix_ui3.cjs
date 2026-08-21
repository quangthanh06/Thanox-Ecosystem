const fs = require('fs');
let detailContent = fs.readFileSync('src/components/storefront/StorefrontProductDetail.tsx', 'utf8');

detailContent = detailContent.replace("objectFit: 'contain'", "objectFit: 'cover'");

fs.writeFileSync('src/components/storefront/StorefrontProductDetail.tsx', detailContent, 'utf8');
console.log('Fixed StorefrontProductDetail style');
