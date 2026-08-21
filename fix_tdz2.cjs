const fs = require('fs');
const file = 'src/context/StoreContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /fetchSupabaseUsers\(\);\s*\/\/\s*Re-fetch to ensure the new user's profile is in the list/;
if (regex.test(content)) {
  content = content.replace(regex, '// fetchSupabaseUsers(); // Removed to prevent TDZ error');
  fs.writeFileSync(file, content, 'utf8');
  console.log("FIXED TDZ ERROR BY COMMENTING!");
} else {
  console.log("REGEX NOT FOUND!");
}
