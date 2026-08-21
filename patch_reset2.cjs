const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const regexReq = /const requestPasswordReset = \([\s\S]*?return \{ success: true, otp \};\n\s*\};/m;
const newReq = `const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string; otp?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, message: 'Vui lòng nh?p d?a ch? email h?p l?.' };
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin + '/login',
      });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Ðã g?i liên k?t d?t l?i m?t kh?u qua email!' };
    } catch (e) {
      return { success: false, message: 'L?i g?i yêu c?u' };
    }
  };`;
  
const regexReset = /const resetPassword = \([\s\S]*?return \{ success: true \};\n\s*\};/m;
const newReset = `const resetPassword = async (email: string, otpOrToken: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Ðã d?i m?t kh?u thành công!' };
    } catch(e) {
      return { success: false, message: 'L?i d?i m?t kh?u' };
    }
  };`;

file = file.replace(regexReq, newReq);
file = file.replace(regexReset, newReset);

fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Fixed Reset Password!');
