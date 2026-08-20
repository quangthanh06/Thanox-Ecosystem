import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { INITIAL_PRODUCTS } from './src/data/mockData.js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function seed() {
  console.log('Bắt đầu đồng bộ dữ liệu lên Supabase...');

  // 1. Tạo tài khoản Admin
  const { data: admin, error: adminErr } = await supabase.from('users').insert({
    username: 'admin',
    email: 'admin@thanox.vn',
    password: 'Admin@123456', // Sẽ thêm mã hóa sau
    role: 'admin',
    balance: 5000000
  }).select().single();

  if (adminErr) {
    if (adminErr.code === '23505') {
      console.log('✅ Tài khoản Admin đã tồn tại.');
    } else {
      console.error('Lỗi tạo Admin:', adminErr);
    }
  } else {
    console.log('✅ Đã tạo tài khoản Admin thành công!');
  }

  // 2. Chuyển Products lên Supabase
  console.log('Đang đồng bộ Sản phẩm...');
  for (const p of INITIAL_PRODUCTS) {
    const { error: pErr } = await supabase.from('products').insert({
      name: p.name,
      category: p.category,
      price: p.price,
      seller_price: p.sellerPrice || p.price,
      original_price: p.basePrice || p.price,
      stock: p.stock?.toString() || 'unlimited',
      status: p.status,
      description: p.description || '',
      image_url: p.image || '',
      hidden_keys_or_links: p.downloadLinkOrKeys || ''
    });
    if (pErr) {
      console.error(`Lỗi khi thêm ${p.name}:`, pErr.message);
    }
  }
  console.log('✅ Đồng bộ Sản phẩm hoàn tất!');
  console.log('🎉 XONG! Database đã sẵn sàng.');
}

seed();
