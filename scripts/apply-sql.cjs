/**
 * ÁP 2 FILE SQL + VERIFY — chạy: node scripts/apply-sql.cjs
 * Đọc SUPABASE_DB_URL từ .env.local (không in secret ra màn hình).
 * Thực hiện: security_fix_rls.sql -> migration_phase7_storefront_upgrade.sql
 * Sau đó tự verify theo đúng checklist production.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DB = process.env.SUPABASE_DB_URL;
if (!DB) {
  console.error('❌ Thiếu SUPABASE_DB_URL trong .env.local — xem hướng dẫn trong file đó.');
  process.exit(1);
}

const files = [
  path.join(__dirname, '..', 'security_fix_rls.sql'),
  path.join(__dirname, '..', 'migration_phase7_storefront_upgrade.sql'),
];

(async () => {
  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Kết nối database Supabase OK');

  // 1) Chạy 2 file SQL theo thứ tự
  for (const f of files) {
    const name = path.basename(f);
    const sql = fs.readFileSync(f, 'utf8');
    try {
      await client.query(sql);
      console.log(`✅ ĐÃ CHẠY: ${name}`);
    } catch (e) {
      console.error(`❌ LỖI ở ${name}: ${e.message}`);
      await client.end();
      process.exit(1);
    }
  }

  // 2) VERIFY — đúng checklist production
  console.log('\n========== VERIFY ==========');

  const perm = await client.query(
    `SELECT routine_name, grantee FROM information_schema.routine_privileges
     WHERE routine_name IN ('process_bank_webhook','admin_approve_topup')
       AND grantee IN ('anon','authenticated')`
  );
  console.log(perm.rowCount === 0
    ? '✅ 1. anon/authenticated KHÔNG còn quyền EXECUTE RPC tài chính (0 dòng)'
    : `⚠️ 1. VẪN còn: ${JSON.stringify(perm.rows)}`);

  const cols = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name='products' AND column_name IN ('packages','is_sale','sale_price','product_type','instructions','accounts_list','sold_count','featured')`
  );
  console.log(cols.rowCount >= 5
    ? `✅ 2. Migration phase7 OK (${cols.rowCount}/8 cột mới tồn tại)`
    : `⚠️ 2. Chỉ có ${cols.rowCount}/8 cột mới`);

  const pol = await client.query(
    `SELECT policyname FROM pg_policies WHERE tablename='topups'`
  );
  const hasOwnerInsert = pol.rows.some(r => /insert_own/i.test(r.policyname));
  console.log(hasOwnerInsert
    ? `✅ 3. Policy topups_insert_own tồn tại (user tự tạo topup được)`
    : `⚠️ 3. Thiếu policy topups_insert_own`);

  await client.end();
  console.log('\nHoàn tất. Nếu mọi mục ✅ → nhắn GLM tiếp tục bước verify production.');
})().catch((e) => { console.error('❌ Kết nối/lỗi:', e.message); process.exit(1); });
