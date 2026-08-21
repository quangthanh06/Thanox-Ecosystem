const fs = require('fs');
const content = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');
const lines = content.split('\n');
const badLines = lines.filter(l => l.includes('A3a') || l.includes('A\'') || l.includes('A-'));
console.log('Bad lines:', badLines);
