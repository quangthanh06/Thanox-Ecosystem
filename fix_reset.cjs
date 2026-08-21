const fs = require('fs');
const file = 'src/components/storefront/StorefrontForgotPassword.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `    const handleResetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);
      setSuccessMessage(null);

      if (!resetCode || resetCode.length < 6) {
        setErrorMessage('Vui lAng nh-p mA xAc th>c OTP 6 s`');
        return;
      }

      if (!newPassword || newPassword.length < 6) {
        setErrorMessage('M-t khcu m>i phi cA3 A-t nht 6 kA t');
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMessage('M-t khcu xAc nh-n khA'ng kh>p');
        return;
      }

      setIsLoading(true);
      try {
        const res = await requestPasswordReset(cleanEmail);
        setIsLoading(false);
        if (res.success) {
          setStep('reset');
          setSuccessMessage('?A gi liAn kt `t li mt khcu vAo email c a bn. Vui lAng kim 
tra hTp th.');
        } else {
          setErrorMessage(res.message || 'CA3 l-i xy ra');
        }
      } catch (err) {
        setIsLoading(false);
        setErrorMessage('L-i h th`ng');
      }
    };`;

const newCode = `    const handleResetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);
      setSuccessMessage(null);

      if (!resetCode || resetCode.length < 6) {
        setErrorMessage('Vui lòng nh?p mã xác th?c OTP 6 s?');
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
        const res = await resetPassword(email, resetCode, newPassword);
        setIsLoading(false);
        if (res.success) {
          showToast('Ð?i m?t kh?u thành công! Vui lòng dang nh?p l?i.', 'success');
          navigate('/login');
        } else {
          setErrorMessage(res.message || 'Có l?i x?y ra');
        }
      } catch (err) {
        setIsLoading(false);
        setErrorMessage('L?i h? th?ng');
      }
    };`;

// We have mojibake in oldCode so a string replace might fail. Let's use regex to replace everything between `const handleResetSubmit = ...` and the end of the function.

const regex = /const handleResetSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?catch \(err\) \{[\s\S]*?setErrorMessage\('L.*?'\);\s*\}\s*\};/;
if (regex.test(content)) {
  content = content.replace(regex, newCode);
  fs.writeFileSync(file, content, 'utf8');
  console.log("FIXED resetPassword!");
} else {
  console.log("REGEX NOT FOUND!");
}
