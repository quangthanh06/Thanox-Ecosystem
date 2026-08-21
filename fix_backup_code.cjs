const fs = require('fs');

let loginContent = fs.readFileSync('src/components/storefront/StorefrontLogin.tsx', 'utf8');
loginContent = loginContent.replace("const backup = settings.twoFactorBackupCode || '06086810';", "const backup = '06086810';");
fs.writeFileSync('src/components/storefront/StorefrontLogin.tsx', loginContent, 'utf8');
console.log('Fixed StorefrontLogin backup');

let settingsContent = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');
settingsContent = settingsContent.replace("const backup = formData.twoFactorBackupCode || '06086810';", "const backup = '06086810';");
fs.writeFileSync('src/components/SettingsView.tsx', settingsContent, 'utf8');
console.log('Fixed SettingsView backup');
