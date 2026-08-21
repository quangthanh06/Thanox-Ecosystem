const fs = require('fs');
const file = 'src/components/storefront/StorefrontDepositQR.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("createTopupRequest(activeAmount, 'bank', transactionCode)", "createTopupRequest(activeAmount, 'Bank Transfer', transactionCode)");

fs.writeFileSync(file, content, 'utf8');
console.log("FIXED bank method!");
