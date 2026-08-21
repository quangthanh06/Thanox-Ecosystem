const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

const oldCode = `    const handleVerifyTotpTest = () => {
      if (!totpTestCode.trim()) {
        showToast('Vui lòng nh?p mã 6 s? t? Google Authenticator trên di?n tho?i', 'error');
        return;
      }
      const secret = formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP';
      const backup = formData.twoFactorBackupCode || '888999';
      const res = verifyTotpCode(secret, totpTestCode.trim(), backup);
      setTotpTestResult(res);
      if (res.valid) {
        showToast('? Mã OTP chính xác! Google Authenticator dã k?t n?i thành công v?i Shop.', 'success');
      } else {
        showToast(res.reason || 'Mã OTP không dúng ho?c dã h?t h?n', 'error');
      }
    };`;

const regex = /const handleVerifyTotpTest = \(\) => \{[\s\S]*?showToast\(res\.reason.*?;\s*\}\s*\};/m;

if (regex.test(content)) {
  content = content.replace(regex, `    const handleVerifyTotpTest = () => {
      if (!totpTestCode.trim()) {
        showToast('Vui lòng nh?p mã 6 s? t? Google Authenticator trên di?n tho?i', 'error');
        return;
      }
      const secret = formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP';
      const backup = formData.twoFactorBackupCode || '888999';
      const res = verifyTotpCode(secret, totpTestCode.trim(), backup);
      setTotpTestResult(res);
      if (res.valid) {
        // IMPORTANT: Instantly save it so they don't have to click the big "Save" button
        updateSettings({ ...formData });
        showToast('? Mã OTP chính xác! Ðã t? d?ng luu c?u hình 2FA m?i.', 'success');
      } else {
        showToast(res.reason || 'Mã OTP không dúng ho?c dã h?t h?n', 'error');
      }
    };`);
  fs.writeFileSync('src/components/SettingsView.tsx', content);
  console.log('Fixed handleVerifyTotpTest!');
} else {
  console.log('Regex not found!');
}
