const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

file = file.replace(/\.from\('users'\)/g, ".from('profiles')");
// We can also remove the password mapping or just let it map to undefined/dummy string
file = file.replace(/password: u\.password,/g, "password: '***', // Removed for security");

fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched fetchSupabaseUsers to use profiles');
