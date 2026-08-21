const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

function replaceFunction(fileContent, funcName, newFuncStr) {
  const startStr = `const ${funcName} =`;
  let startIndex = fileContent.indexOf(startStr);
  if (startIndex === -1) return fileContent;
  let openBraces = 0;
  let started = false;
  let endIndex = -1;
  for(let i = startIndex; i < fileContent.length; i++) {
    if (fileContent[i] === '{') {
      openBraces++; started = true;
    } else if (fileContent[i] === '}') {
      openBraces--;
      if (started && openBraces === 0) {
        endIndex = fileContent[i+1] === ';' ? i + 2 : i + 1;
        break;
      }
    }
  }
  if (endIndex === -1) return fileContent;
  return fileContent.substring(0, startIndex) + newFuncStr + fileContent.substring(endIndex);
}

const newReq = `const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string; otp?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, message: 'Vui lòng nh?p d?a ch? email h?p l?.' };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: window.location.origin + '/login' });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Ðã g?i liên k?t d?t l?i m?t kh?u qua email!' };
    } catch (e) { return { success: false, message: 'L?i g?i yêu c?u' }; }
  };`;

const newRes = `const resetPassword = async (email: string, otpOrToken: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Ðã d?i m?t kh?u thành công!' };
    } catch(e) { return { success: false, message: 'L?i d?i m?t kh?u' }; }
  };`;

file = replaceFunction(file, 'requestPasswordReset', newReq);
file = replaceFunction(file, 'resetPassword', newRes);

fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched reset pass functions successfully.');
