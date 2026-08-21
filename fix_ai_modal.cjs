const fs = require('fs');
let content = fs.readFileSync('src/components/storefront/StorefrontAIAssistant.tsx', 'utf8');

content = content.replace("sm:bottom-32 sm:left-6 sm:w-[400px]", "sm:bottom-32 sm:right-6 sm:w-[400px] sm:left-auto");
fs.writeFileSync('src/components/storefront/StorefrontAIAssistant.tsx', content, 'utf8');
console.log('Fixed AI modal pos');
