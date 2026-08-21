const fs = require('fs');
let file = fs.readFileSync('src/components/storefront/StorefrontForgotPassword.tsx', 'utf8');

file = file.replace(/const res = requestPasswordReset\(cleanEmail\);/g, "const res = await requestPasswordReset(cleanEmail);");
file = file.replace(/const handleSubmit = \(e: React\.FormEvent\) => \{/g, "const handleSubmit = async (e: React.FormEvent) => {");

// Also resetPassword -> await resetPassword
file = file.replace(/const res = resetPassword\(/g, "const res = await resetPassword(");
file = file.replace(/const handleResetSubmit = \(e: React\.FormEvent\) => \{/g, "const handleResetSubmit = async (e: React.FormEvent) => {");

fs.writeFileSync('src/components/storefront/StorefrontForgotPassword.tsx', file);
console.log('Patched Forgot Password UI!');
