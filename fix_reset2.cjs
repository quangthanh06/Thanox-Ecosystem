const fs = require('fs');
const file = 'src/components/storefront/StorefrontForgotPassword.tsx';
let content = fs.readFileSync(file, 'utf8');

const newCode = `    const handleResetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);
      setSuccessMessage(null);

      if (!resetCode || resetCode.length < 6) {
        setErrorMessage('Vui lA'ng nhA-p mA xAc th>c OTP 6 s'');
        return;
      }

      if (!newPassword || newPassword.length < 6) {
        setErrorMessage('M-t khcu m>i phi cA3 A-t nht 6 kA t');
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMessage('M-t khcu xAc nh-n khA\\'ng kh>p');
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

const regex = /const handleResetSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?catch \(err\) \{[\s\S]*?setErrorMessage\(['"][^'"]*['"]\);\s*\}\s*\};/;
if (regex.test(content)) {
  content = content.replace(regex, newCode);
  fs.writeFileSync(file, content, 'utf8');
  console.log("FIXED resetPassword!");
} else {
  console.log("REGEX NOT FOUND!");
}
