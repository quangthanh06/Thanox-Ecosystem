const fs = require('fs');

// 1. Fix Product Detail Image
let detailContent = fs.readFileSync('src/components/storefront/StorefrontProductDetail.tsx', 'utf8');
detailContent = detailContent.replace('object-contain', 'object-cover');
fs.writeFileSync('src/components/storefront/StorefrontProductDetail.tsx', detailContent, 'utf8');
console.log('Fixed StorefrontProductDetail');

// 2. Fix StorefrontLogin (backup code & max length & text)
let loginContent = fs.readFileSync('src/components/storefront/StorefrontLogin.tsx', 'utf8');
loginContent = loginContent.replace("const backup = settings.twoFactorBackupCode || '888999';", "const backup = settings.twoFactorBackupCode || '06086810';");
loginContent = loginContent.replace("maxLength={6}", "maxLength={8}");
loginContent = loginContent.replace("Nh?p mã c?u h? (888999)", "Nh?p mã c?u h?");
fs.writeFileSync('src/components/storefront/StorefrontLogin.tsx', loginContent, 'utf8');
console.log('Fixed StorefrontLogin');

// 3. Fix SettingsView (backup code)
let settingsContent = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');
settingsContent = settingsContent.replace("const backup = formData.twoFactorBackupCode || '888999';", "const backup = formData.twoFactorBackupCode || '06086810';");
fs.writeFileSync('src/components/SettingsView.tsx', settingsContent, 'utf8');
console.log('Fixed SettingsView');
