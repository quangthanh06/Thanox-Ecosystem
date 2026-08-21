const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const startStr = "// Forgot Password: Email normalization & OTP generation";
const endStr = "// Invalidate used reset token";

const startIndex = file.indexOf(startStr);
const endIndex = file.indexOf(endStr);

if (startIndex > -1 && endIndex > -1) {
  const afterEndStr = file.substring(endIndex);
  const closingBraceIndex = afterEndStr.indexOf("};") + 2;
  
  const part1 = file.substring(0, startIndex);
  const part2 = file.substring(endIndex + closingBraceIndex);
  
  const newContent = `// Forgot Password: Email normalization & OTP generation
  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string; otp?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, message: 'Vui lòng nh?p d?a ch? email h?p l?.' };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: window.location.origin + '/login' });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Ðã g?i liên k?t d?t l?i m?t kh?u qua email!' };
    } catch (e) { return { success: false, message: 'L?i g?i yêu c?u' }; }
  };

  const resetPassword = async (email: string, otpOrToken: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Ðã d?i m?t kh?u thành công!' };
    } catch(e) { return { success: false, message: 'L?i d?i m?t kh?u' }; }
  };
`;
  
  fs.writeFileSync('src/context/StoreContext.tsx', part1 + newContent + part2);
  console.log('Force patched successfully!');
} else {
  console.log('Could not find markers');
}
