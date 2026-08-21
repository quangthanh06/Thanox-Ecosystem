const fs = require('fs');

function fixFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replaceAll(search, replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

// 1. Fix ProductsView.tsx
let prod = fs.readFileSync('src/components/ProductsView.tsx', 'utf8');

// Fix toast messages in ProductsView
prod = prod.replace(/showToast\(`[\s\S]*?lên Cloud thành công![\s\S]*?`,\s*'success'\);/g, "showToast(`Ðã dính kèm t?p \"${file.name}\" (${formattedSize}) lên Cloud thành công!`, 'success');");
prod = prod.replace(/showToast\('L.*?i khi t.*?i t.*?p l.*?n Cloud',\s*'error'\);/g, "showToast('L?i khi t?i t?p lên Cloud', 'error');");
prod = prod.replace(/showToast\('.*?g.*?t.*?p.*?nh.*?m',\s*'info'\);/g, "showToast('Ðã g? t?p dính kèm', 'info');");
prod = prod.replace(/showToast\('Vui l.*?ng ch.*?n file h.*?nh.*?nh.*?PNG.*?JPG.*?WEBP.*?',\s*'error'\);/g, "showToast('Vui lòng ch?n file hình ?nh (PNG, JPG, WEBP)', 'error');");
prod = prod.replace(/showToast\('.*?t.*?i.*?nh.*?l.*?n Cloud th.*?nh c.*?ng!',\s*'success'\);/g, "showToast('Ðã t?i ?nh lên Cloud thành công!', 'success');");
prod = prod.replace(/showToast\(e\?\.message \? `L.*?i: \${e\.message}` : 'L.*?i khi t.*?i.*?nh l.*?n Cloud',\s*'error'\);/g, "showToast(e?.message ? `L?i: ${e.message}` : 'L?i khi t?i ?nh lên Cloud', 'error');");
prod = prod.replace(/showToast\('.*?m.*?nh.*?di.*?n ch.*?nh!',\s*'success'\);/g, "showToast('Ðã d?t làm ?nh d?i di?n chính!', 'success');");
prod = prod.replace(/showToast\('Vui l.*?ng nh.*?p t.*?n s.*?n ph.*?m',\s*'error'\);/g, "showToast('Vui lòng nh?p tên s?n ph?m', 'error');");
prod = prod.replace(/showToast\(`.*?c.*?p nh.*?t s.*?n ph.*?m "\${formData\.name}"!`,/g, "showToast(`Ðã c?p nh?t s?n ph?m \"${formData.name}\"!`,");
prod = prod.replace(/showToast\(`.*?th.*?m m.*?i s.*?n ph.*?m "\${formData\.name}"!`,/g, "showToast(`Ðã thêm m?i s?n ph?m \"${formData.name}\"!`,");
prod = prod.replace(/showToast\(`.*?nh.*?n b.*?n "\${product\.name}".*?`,\s*'success'\);/g, "showToast(`Ðã nhân b?n \"${product.name}\"!`, 'success');");

fs.writeFileSync('src/components/ProductsView.tsx', prod, 'utf8');

// 2. Fix CategoriesView.tsx
let cat = fs.readFileSync('src/components/CategoriesView.tsx', 'utf8');
cat = cat.replace(/showToast\('.*?t.*?i.*?nh.*?danh m.*?c.*?l.*?n Cloud.*?th.*?nh c.*?ng!',\s*'success'\);/g, "showToast('T?i ?nh d?i di?n danh m?c lên Cloud thành công!', 'success');");
cat = cat.replace(/showToast\('.*?L.*?i khi t.*?i.*?nh.*?l.*?n Cloud',\s*'error'\);/g, "showToast('L?i khi t?i ?nh lên Cloud', 'error');");
fs.writeFileSync('src/components/CategoriesView.tsx', cat, 'utf8');

// 3. Fix SettingsView.tsx
let set = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');
set = set.replace(/showToast\(`.*?t.*?i file "\${file\.name}" l.*?n Cloud th.*?nh c.*?ng!.*?`,\s*'success'\);/g, "showToast(`Ðã t?i file \"${file.name}\" lên Cloud thành công! B?m nghe th? ho?c Thêm vào danh sách.`, 'success');");
set = set.replace(/showToast\('.*?L.*?i khi t.*?i.*?m thanh.*?l.*?n Cloud',\s*'error'\);/g, "showToast('L?i khi t?i âm thanh lên Cloud', 'error');");
set = set.replace(/showToast\('.*?t.*?i.*?nh.*?n.*?Banner.*?l.*?n Cloud th.*?nh c.*?ng!',\s*'success'\);/g, "showToast('Ðã t?i ?nh n?n Banner lên Cloud thành công!', 'success');");
fs.writeFileSync('src/components/SettingsView.tsx', set, 'utf8');

// 4. Fix StoreContext.tsx
let ctx = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');
ctx = ctx.replace(/showToast\(`.*?th.*?m s.*?n ph.*?m "\${newProduct\.name}" l.*?n Cloud th.*?nh c.*?ng!.*?`,\s*'success'\);/g, "showToast(`Ðã thêm s?n ph?m \"${newProduct.name}\" lên Cloud thành công!`, 'success');");
ctx = ctx.replace(/showToast\('.*?L.*?i khi l.*?u l.*?n Cloud.*?th.*?l.*?i',\s*'error'\);/g, "showToast('L?i khi luu lên Cloud, vui lòng th? l?i', 'error');");
fs.writeFileSync('src/context/StoreContext.tsx', ctx, 'utf8');

console.log('Fixed all toast messages to clean Vietnamese!');
