const fs = require('fs');
const file = 'src/components/storefront/StorefrontForgotPassword.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const res = await requestPasswordReset\(cleanEmail\);([\s\S]*?)setSuccessMessage\([^)]+\);/g;
let i = 0;
content = content.replace(regex, (match, p1) => {
  if (i++ === 1) { // The second occurrence is inside handleResetSubmit
    return `const res = await resetPassword(email, resetCode, newPassword);${p1}showToast('Ð?i m?t kh?u thành công! Vui lòng dang nh?p l?i.', 'success');\n          navigate('/login');`;
  }
  return match; // First occurrence stays the same
});

fs.writeFileSync(file, content, 'utf8');
console.log("FIXED!");
