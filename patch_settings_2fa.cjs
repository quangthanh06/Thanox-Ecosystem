const fs = require('fs');
let file = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

// 1. Add pendingTwoFactorSecret state
const stateMarker = "const [totpTestResult, setTotpTestResult] = useState<{ valid: boolean; reason?: string } | null>(null);";
const stateReplacement = stateMarker + "\n  const [pendingTwoFactorSecret, setPendingTwoFactorSecret] = useState<string | null>(null);";
file = file.replace(stateMarker, stateReplacement);

// 2. Modify handleGenerateNewSecret to use pending state instead of mutating formData directly
const generateFuncRegex = /const handleGenerateNewSecret = \(\) => \{[\s\S]*?showToast\([^)]+\);\n\s*\};/m;
const newGenerateFunc = `const handleGenerateNewSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let newSec = '';
    for (let i = 0; i < 16; i++) {
      newSec += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // LUU Ý: Luu vào state t?m, chua luu vào formData
    setPendingTwoFactorSecret(newSec);
    setTotpTestResult(null);
    setTotpTestCode('');
    showToast(\`Ðã t?o Secret Key m?i: \${newSec}. Hãy quét mã QR và xác nh?n ngay bên du?i d? áp d?ng!\`, 'info');
  };`;
file = file.replace(generateFuncRegex, newGenerateFunc);

// 3. Modify handleVerifyTotpTest
const verifyFuncRegex = /const handleVerifyTotpTest = \(\) => \{[\s\S]*?\}\n\s*\};/m;
const newVerifyFunc = `const handleVerifyTotpTest = () => {
    if (!totpTestCode.trim()) {
      showToast('Vui lòng nh?p mã 6 s? t? Google Authenticator trên di?n tho?i', 'error');
      return;
    }
    // N?u có mã t?m thì test mã t?m, n?u không thì test mã hi?n t?i
    const secretToTest = pendingTwoFactorSecret || formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP';
    const backup = formData.twoFactorBackupCode || '888999';
    const res = verifyTotpCode(secretToTest, totpTestCode.trim(), backup);
    setTotpTestResult(res);
    if (res.valid) {
      if (pendingTwoFactorSecret) {
        // Áp d?ng ngay vào formData và C?p nh?t DB
        setFormData((prev) => ({ ...prev, twoFactorSecret: pendingTwoFactorSecret }));
        updateSettings({ twoFactorSecret: pendingTwoFactorSecret });
        setPendingTwoFactorSecret(null); // Ðã xác nh?n xong
        showToast('?? Mã OTP chính xác! Secret Key m?i dã du?c áp d?ng và LUU vào h? th?ng.', 'success');
      } else {
        showToast('? Mã OTP chính xác! Google Authenticator dang ho?t d?ng t?t.', 'success');
      }
    } else {
      showToast(res.reason || 'Mã OTP không dúng ho?c dã h?t h?n', 'error');
    }
  };`;
file = file.replace(verifyFuncRegex, newVerifyFunc);

// 4. Update the QR Code and Inputs to use pendingTwoFactorSecret || formData.twoFactorSecret
file = file.replace(/generateTotpUri\(formData\.twoFactorSecret \|\| 'JBSWY3DPEHPK3PXP'/g, "generateTotpUri(pendingTwoFactorSecret || formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP'");
file = file.replace(/value=\{formData\.twoFactorSecret \|\| 'JBSWY3DPEHPK3PXP'\}/g, "value={pendingTwoFactorSecret || formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP'}");
file = file.replace(/onClick=\{\(\) => copySecretToClipboard\(formData\.twoFactorSecret \|\| 'JBSWY3DPEHPK3PXP'\)\}/g, "onClick={() => copySecretToClipboard(pendingTwoFactorSecret || formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP')}");


fs.writeFileSync('src/components/SettingsView.tsx', file);
console.log('Patched SettingsView 2FA!');
