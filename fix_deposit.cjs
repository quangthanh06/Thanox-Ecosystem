const fs = require('fs');
const file = 'src/components/storefront/StorefrontDepositQR.tsx';
let content = fs.readFileSync(file, 'utf8');

const regexVars = /const isAmountEntered = [^]+?const isValidAmount = [^\n]+\n/m;
const varsMatch = content.match(regexVars);

if (varsMatch) {
  const varsStr = varsMatch[0];
  content = content.replace(varsStr, '');
  
  const insertIndex = content.indexOf('  // Real-time Bank Reconciliation Polling');
  if (insertIndex !== -1) {
    content = content.slice(0, insertIndex) + varsStr + '\n' + content.slice(insertIndex);
    fs.writeFileSync(file, content, 'utf8');
    console.log("FIXED isValidAmount TDZ!");
  } else {
    console.log("Could not find insert position");
  }
} else {
  console.log("Could not find variables");
}
