const fs = require('fs');
let file = fs.readFileSync('src/components/storefront/StorefrontForgotPassword.tsx', 'utf8');

file = file.replace(/confirmPasswordReset/g, 'resetPassword');

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

const newHandleSubmit = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Vui lòng nh?p d?a ch? email h?p l?');
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      setIsLoading(false);
      if (res.success) {
        setStep('reset');
        setSuccessMessage(res.message || 'Ðã g?i liên k?t d?t l?i m?t kh?u.');
      } else {
        setErrorMessage(res.message || 'Có l?i x?y ra');
      }
    } catch(err) {
      setIsLoading(false);
      setErrorMessage('L?i h? th?ng');
    }
  };`;
  
const newHandleReset = `const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!resetCode || resetCode.length < 6) {
      setErrorMessage('Vui lòng nh?p mã xác th?c g?m 6 ch? s?');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('M?t kh?u m?i ph?i có ít nh?t 6 ký t?');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('M?t kh?u xác nh?n không kh?p');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPassword(email.trim().toLowerCase(), resetCode.trim(), newPassword);
      setIsLoading(false);
      if (res.success) {
        showToast('Ð?t l?i m?t kh?u thành công! Hãy dang nh?p v?i m?t kh?u m?i.', 'success');
        navigate('/login', { replace: true });
      } else {
        setErrorMessage(res.message || 'Mã xác th?c không chính xác ho?c dã h?t h?n');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('L?i h? th?ng');
    }
  };`;

file = replaceFunction(file, 'handleSubmit', newHandleSubmit);
file = replaceFunction(file, 'handleResetSubmit', newHandleReset);

fs.writeFileSync('src/components/storefront/StorefrontForgotPassword.tsx', file);
console.log('Split replaced forgot UI.');
