const fs = require('fs');
let loginContent = fs.readFileSync('src/components/storefront/StorefrontLogin.tsx', 'utf8');

// The text is something like: Mt `in thoi? Nh-p mA ccu hT (888999)
const regex = /<span>(.*)\(888999\)<\/span>/g;
loginContent = loginContent.replace(regex, "<span>$1</span>");

fs.writeFileSync('src/components/storefront/StorefrontLogin.tsx', loginContent, 'utf8');
console.log('Fixed StorefrontLogin string');
