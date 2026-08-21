const fs = require('fs');

const files = [
  'src/components/ProductsView.tsx',
  'src/components/CategoriesView.tsx',
  'src/components/SettingsView.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/showToast\('L?i khi t?i ?nh lên Cloud', 'error'\);/g, "showToast(`L?i: ${e.message || e}`, 'error');");
  content = content.replace(/showToast\('L?i khi t?i file lên Cloud', 'error'\);/g, "showToast(`L?i: ${e.message || e}`, 'error');");
  content = content.replace(/showToast\('L?i khi t?i âm thanh lên Cloud', 'error'\);/g, "showToast(`L?i: ${e.message || e}`, 'error');");
  fs.writeFileSync(file, content, 'utf8');
});
console.log("Patched toasts");
