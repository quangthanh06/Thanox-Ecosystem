import { INITIAL_PRODUCTS } from './src/data/mockData.js';
import fs from 'fs';

let sql = `-- 1. Tạo tài khoản Admin\n`;
sql += `INSERT INTO public.users (username, email, password, role, balance) VALUES ('admin', 'admin@thanox.vn', 'Admin@123456', 'admin', 5000000);\n\n`;
sql += `-- 2. Thêm Sản phẩm\n`;

for (const p of INITIAL_PRODUCTS) {
  const name = p.name.replace(/'/g, "''");
  const category = p.category.replace(/'/g, "''");
  const desc = (p.description || '').replace(/'/g, "''");
  const img = (p.image || '').replace(/'/g, "''");
  const keys = (p.downloadLinkOrKeys || '').replace(/'/g, "''");
  
  sql += `INSERT INTO public.products (name, category, price, seller_price, stock, status, description, image_url, hidden_keys_or_links) VALUES ('${name}', '${category}', ${p.price}, ${p.sellerPrice || p.price}, '${p.stock || 'unlimited'}', '${p.status}', '${desc}', '${img}', '${keys}');\n`;
}

fs.writeFileSync('seed.sql', sql);
console.log('Generated seed.sql');
