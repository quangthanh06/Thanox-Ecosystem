const fs = require('fs');
let content = fs.readFileSync('src/components/storefront/StorefrontAIAssistant.tsx', 'utf8');

content = content.replace("bottom-24 sm:bottom-28 left-4 sm:left-6", "bottom-24 sm:bottom-28 right-0 sm:right-6");
// Also make sure if it opens, the chat box doesn't go off screen. 
// If it's on the right, the chat bubble might need to open to the left.
fs.writeFileSync('src/components/storefront/StorefrontAIAssistant.tsx', content, 'utf8');
console.log('Fixed AI pos');
