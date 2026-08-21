const fs = require('fs');
let file = fs.readFileSync('src/components/storefront/StorefrontForgotPassword.tsx', 'utf8');

// Replace the entire handleRequestSubmit function
const reqStart = "const handleRequestSubmit = (e: React.FormEvent) => {";
let reqEnd = "}, 400);\n  };";
let startIndex = file.indexOf(reqStart);
let endIndex = file.indexOf(reqEnd, startIndex);
if (startIndex > -1 && endIndex > -1) {
  const before = file.substring(0, startIndex);
  const after = file.substring(endIndex + reqEnd.length);
  const newReq = `const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Vui lòng nh?p d?a ch? email h?p l?');
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      setIsLoading(false);
      if (res.success) {
        setStep('reset');
        setSuccessMessage('Ðã g?i liên k?t d?t l?i m?t kh?u vào email c?a b?n. Vui lòng ki?m tra h?p thu.');
      } else {
        setErrorMessage(res.message || 'Không tìm th?y tài kho?n v?i email này');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('L?i h? th?ng');
    }
  };`;
  file = before + newReq + after;
}

// Replace handleResetSubmit
const resStart = "const handleResetSubmit = (e: React.FormEvent) => {";
let resEnd = "}, 1000);\n  };";
startIndex = file.indexOf(resStart);
endIndex = file.indexOf(resEnd, startIndex);
if (startIndex > -1 && endIndex > -1) {
  const before = file.substring(0, startIndex);
  const after = file.substring(endIndex + resEnd.length);
  const newRes = `const handleResetSubmit = async (e: React.FormEvent) => {
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
  file = before + newRes + after;
}

fs.writeFileSync('src/components/storefront/StorefrontForgotPassword.tsx', file);
console.log('Rewritten StorefrontForgotPassword');
