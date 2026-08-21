const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const targetReq = "const requestPasswordReset = (email: string): { success: boolean; message?: string; otp?: string } => {";
const partsReq = file.split(targetReq);
if (partsReq.length > 1) {
  let restReq = partsReq[1];
  const endReqTarget = "return { success: true, otp };\n  };";
  const endReqIndex = restReq.indexOf(endReqTarget);
  if (endReqIndex > -1) {
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
    file = partsReq[0] + newReq + restReq.substring(endReqIndex + endReqTarget.length);
  }
}

const targetRes = "const resetPassword = (\n    email: string,\n    otpOrToken: string,\n    newPassword: string\n  ): { success: boolean; message?: string } => {";
// If line endings are different, we can just search for "const resetPassword = ("
const partsRes = file.split("const resetPassword = (");
if (partsRes.length > 1) {
  let restRes = partsRes[1];
  const endResTarget = "return { success: true };\n  };";
  const endResIndex = restRes.indexOf(endResTarget);
  if (endResIndex > -1) {
    const newRes = `const resetPassword = async (email: string, otpOrToken: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Ðã d?i m?t kh?u thành công!' };
    } catch(e) {
      return { success: false, message: 'L?i d?i m?t kh?u' };
    }
  };`;
    file = partsRes[0] + newRes + restRes.substring(endResIndex + endResTarget.length);
  }
}

fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched split!');
