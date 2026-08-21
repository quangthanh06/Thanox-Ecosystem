const fs = require('fs');
for (const file of ['src/components/storefront/StorefrontLogin.tsx', 'src/components/storefront/StorefrontForgotPassword.tsx', 'src/components/SettingsView.tsx', 'src/context/StoreContext.tsx']) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('\uFFFD') || content.includes('A') || content.includes('A3a')) {
    console.log(file, 'HAS CORRUPTION');
  } else {
    console.log(file, 'IS CLEAN');
  }
}
