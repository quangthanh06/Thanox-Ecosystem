const fs = require('fs');
let file = fs.readFileSync('src/components/storefront/StorefrontForgotPassword.tsx', 'utf8');

file = file.replace(/const handleRequestSubmit = \(e: React\.FormEvent\) => \{/g, 'const handleRequestSubmit = async (e: React.FormEvent) => {');
file = file.replace(/const handleResetSubmit = \(e: React\.FormEvent\) => \{/g, 'const handleResetSubmit = async (e: React.FormEvent) => {');

// Remove setTimeout around requestPasswordReset
file = file.replace(/setTimeout\(\(\) => \{\n\s*const res = await requestPasswordReset\(cleanEmail\);\n\s*setIsLoading\(false\);\n\s*if \(res\.success\) \{\n\s*setStep\('reset'\);\n\s*setSuccessMessage\(`Mã xác th?c 6 s? dã du?c t?o cho email \$\{cleanEmail\}\. Vui lòng nh?p mã và m?t kh?u m?i bên du?i\.`\);\n\s*\} else \{\n\s*setErrorMessage\(res\.message \|\| 'Không tìm th?y tài kho?n v?i email này'\);\n\s*\}\n\s*\}, 400\);/g,
  `try {
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
    }`);

// Remove setTimeout around resetPassword
file = file.replace(/setTimeout\(\(\) => \{\n\s*const res = confirmPasswordReset\(email\.trim\(\)\.toLowerCase\(\), resetCode\.trim\(\), newPassword\);\n\s*setIsLoading\(false\);\n\s*if \(res\.success\) \{\n\s*showToast\('Ð?t l?i m?t kh?u thành công! Hãy dang nh?p v?i m?t kh?u m?i\.', 'success'\);\n\s*navigate\('\/login', \{ replace: true \}\);\n\s*\} else \{\n\s*setErrorMessage\(res\.message \|\| 'Mã xác th?c không chính xác ho?c dã h?t h?n'\);\n\s*\}\n\s*\}, 1000\);/g,
  `try {
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
    }`);

// Also fix the import destructing
file = file.replace(/confirmPasswordReset/g, 'resetPassword');

fs.writeFileSync('src/components/storefront/StorefrontForgotPassword.tsx', file);
console.log('Done!');
