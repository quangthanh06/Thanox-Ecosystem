const fs = require('fs');
let file = fs.readFileSync('src/components/storefront/StorefrontForgotPassword.tsx', 'utf8');

// Fix imports to use resetPassword instead of confirmPasswordReset
file = file.replace('confirmPasswordReset', 'resetPassword');
file = file.replace('confirmPasswordReset', 'resetPassword');

// Fix the request pass setTimeout block
const reqBlock = `    setIsLoading(true);
    setTimeout(() => {
      const res = await requestPasswordReset(cleanEmail);
      setIsLoading(false);
      if (res.success) {
        setStep('reset');
        setSuccessMessage(\`Mã xác th?c 6 s? dã du?c t?o cho email \${cleanEmail}. Vui lòng nh?p mã và m?t kh?u m?i bên du?i.\`);
      } else {
        setErrorMessage(res.message || 'Có l?i x?y ra');
      }
    }, 1000);`;

const newReqBlock = `    setIsLoading(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      setIsLoading(false);
      if (res.success) {
        setStep('reset');
        setSuccessMessage('Ðã g?i liên k?t d?t l?i m?t kh?u vào email c?a b?n. Vui lòng ki?m tra h?p thu.');
      } else {
        setErrorMessage(res.message || 'Có l?i x?y ra');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('L?i h? th?ng');
    }`;

// Since the file has weird unicode issues, we just do a more robust replacement
// Let's replace the whole handleSubmit function
const handleSubmitRegex = /const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?\}, 1000\);\n  \};/m;
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
file = file.replace(handleSubmitRegex, newHandleSubmit);


const handleResetRegex = /const handleResetSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?\}, 1000\);\n  \};/m;
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
file = file.replace(handleResetRegex, newHandleReset);

fs.writeFileSync('src/components/storefront/StorefrontForgotPassword.tsx', file);
console.log('Fixed Forgot Password UI!');
