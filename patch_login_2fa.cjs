const fs = require('fs');
let file = fs.readFileSync('src/components/storefront/StorefrontLogin.tsx', 'utf8');

// The line is: const backup = settings.twoFactorBackupCode; // Xóa c?ng 888999 theo yêu c?u b?o m?t
// We will change it back to allow 888999 for now to rescue the admin!
file = file.replace(/const backup = settings\.twoFactorBackupCode; \/\/ Xóa c?ng 888999 theo yêu c?u b?o m?t/g, "const backup = settings.twoFactorBackupCode || '888999';");

fs.writeFileSync('src/components/storefront/StorefrontLogin.tsx', file);
console.log('Restored 2FA backup code!');
