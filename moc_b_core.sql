-- ============================================================================
-- MỐC B CORE — SERVER-SIDE ORDERS + CHE KEY LỘ + SETTINGS AN TOÀN
-- Chạy SAU security_fix_rls.sql + migration_phase7. Idempotent, không đụng dữ liệu.
-- ============================================================================

-- ============================ 1) BẢNG ORDERS (CLOUD) ========================
CREATE TABLE IF NOT EXISTS public.orders (
  id                TEXT PRIMARY KEY DEFAULT ('ord-' || gen_random_uuid()::text),
  order_code        TEXT NOT NULL DEFAULT ('DH-' || upper(substr(md5(random()::text),1,8))),
  user_id           TEXT NOT NULL,
  user_name         TEXT,
  product_id        TEXT NOT NULL,
  product_name      TEXT,
  package_id        TEXT,
  package_name      TEXT,
  quantity          INT  NOT NULL DEFAULT 1,
  unit_price        BIGINT NOT NULL,
  total_price       BIGINT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'completed',
  payment_method    TEXT NOT NULL DEFAULT 'wallet',
  delivered_content TEXT,
  idem_key          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Tương thích bảng orders cũ (schema gốc: id uuid/user_id/product_id/amount/...) — bổ sung cột mới
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_code        TEXT NOT NULL DEFAULT ('DH-' || upper(substr(md5(random()::text),1,8)));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_name         TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_name      TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS package_id        TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS package_name      TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity          INT  NOT NULL DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS unit_price        BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_price       BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method    TEXT NOT NULL DEFAULT 'wallet';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_content TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idem_key          TEXT;
-- Đồng bộ kiểu user_id/product_id về TEXT cho nhất quán với topups & client
-- (phải DROP policy đang tham chiếu user_id trước, tạo lại ở mục RLS bên dưới)
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
ALTER TABLE public.orders ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.orders ALTER COLUMN product_id TYPE TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idem_uniq ON public.orders (user_id, idem_key)
  WHERE idem_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders (user_id, created_at DESC);

-- RLS: user chỉ đọc đơn của mình; ADMIN đọc tất cả; KHÔNG insert/update trực tiếp
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (
    auth.uid()::text = user_id::text
    OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
  );

-- ============================ 2) BẢNG AUDIT LOG =============================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    TEXT,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  detail      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_log;
CREATE POLICY "audit_admin_read" ON public.audit_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'));

-- ============================ 3) CHE CỘT KEY LỘ (P0) ========================
-- hidden_keys_or_links / accounts_list / download_url: KHÔNG còn đọc được từ
-- client (kể cả user đã đăng nhập). Admin xem qua RPC admin_get_product_secrets.
REVOKE SELECT (hidden_keys_or_links, accounts_list, download_url)
  ON public.products FROM anon, authenticated;
-- Cột packages giữ public cho UI, nhưng app sẽ STRIP keys trước khi lưu (xem app).

-- ============================ 4) RPC MUA HÀNG SERVER-SIDE ==================
-- create_order: kiểm giá (từ DB), stock, số dư; trừ ví; giao key/acc; ghi đơn +
-- audit — TẤT CẢ trong 1 transaction. Idempotent theo (user, idem_key).
CREATE OR REPLACE FUNCTION public.create_order(
  p_product_id TEXT,
  p_package_id TEXT DEFAULT NULL,
  p_quantity   INT  DEFAULT 1,
  p_idem_key   TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_prod        RECORD;
  v_pkg         JSONB;
  v_user        RECORD;
  v_unit        BIGINT;
  v_total       BIGINT;
  v_is_seller   BOOLEAN := FALSE;
  v_delivered   TEXT := '';
  v_lines       TEXT[];
  v_take        TEXT[];
  v_stock_num   INT;
  v_order       public.orders%ROWTYPE;
  v_existing    public.orders%ROWTYPE;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100 THEN
    RETURN jsonb_build_object('status','error','code','INVALID_QUANTITY');
  END IF;

  -- Idempotency: trả đơn cũ nếu cùng (user, idem_key)
  IF p_idem_key IS NOT NULL THEN
    SELECT * INTO v_existing FROM orders
     WHERE user_id = auth.uid()::text AND idem_key = p_idem_key LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('status','success','duplicate',true,'order',
        jsonb_build_object('id',v_existing.id,'orderCode',v_existing.order_code,
          'totalPrice',v_existing.total_price,'deliveredContent',v_existing.delivered_content));
    END IF;
  END IF;

  SELECT * INTO v_user FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','error','code','USER_NOT_FOUND'); END IF;
  IF v_user.status = 'banned' THEN RETURN jsonb_build_object('status','error','code','USER_BANNED'); END IF;
  v_is_seller := (v_user.role = 'seller');

  SELECT * INTO v_prod FROM products WHERE id::text = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','error','code','PRODUCT_NOT_FOUND'); END IF;
  IF v_prod.status IS DISTINCT FROM 'active' THEN RETURN jsonb_build_object('status','error','code','PRODUCT_NOT_ACTIVE'); END IF;

  -- Giá từ DB (server-side): ưu tiên gói, rồi giá đại lý nếu seller
  v_unit := v_prod.price;
  IF p_package_id IS NOT NULL AND v_prod.packages IS NOT NULL THEN
    SELECT value INTO v_pkg FROM jsonb_array_elements(v_prod.packages)
     WHERE value->>'id' = p_package_id LIMIT 1;
    IF v_pkg IS NULL THEN RETURN jsonb_build_object('status','error','code','PACKAGE_NOT_FOUND'); END IF;
    v_unit := COALESCE(NULLIF((v_pkg->>'price')::BIGINT,0), v_prod.price);
    IF v_is_seller AND COALESCE((v_pkg->>'sellerPrice')::BIGINT,0) > 0 THEN
      v_unit := (v_pkg->>'sellerPrice')::BIGINT;
    END IF;
  ELSE
    v_pkg := NULL;
    IF v_is_seller AND COALESCE(v_prod.seller_price,0) > 0 THEN v_unit := v_prod.seller_price; END IF;
  END IF;

  v_total := v_unit * p_quantity;
  IF COALESCE(v_user.balance,0) < v_total THEN
    RETURN jsonb_build_object('status','error','code','INSUFFICIENT_BALANCE',
      'balance',v_user.balance,'total',v_total);
  END IF;

  -- Kho: numeric thì phải đủ
  IF v_prod.stock IS NOT NULL AND v_prod.stock <> 'unlimited' THEN
    v_stock_num := NULLIF(regexp_replace(v_prod.stock::text,'\D','','g'),'')::INT;
    IF v_stock_num IS NOT NULL AND v_stock_num < p_quantity THEN
      RETURN jsonb_build_object('status','error','code','OUT_OF_STOCK');
    END IF;
  END IF;

  -- Giao nội dung: account => bốc từ accounts_list; key/file => hidden_keys_or_links
  IF COALESCE(v_prod.accounts_list,'') <> '' THEN
    v_lines := ARRAY(SELECT line FROM unnest(string_to_array(v_prod.accounts_list, E'\n')) AS line
                     WHERE btrim(line) <> '');
    IF array_length(v_lines,1) < p_quantity THEN
      RETURN jsonb_build_object('status','error','code','OUT_OF_STOCK');
    END IF;
    v_take := v_lines[1:p_quantity];
    v_delivered := array_to_string(v_take, E'\n');
    UPDATE products SET accounts_list = CASE WHEN array_length(v_lines,1) > p_quantity
          THEN array_to_string(v_lines[p_quantity+1:], E'\n') ELSE '' END
     WHERE id = v_prod.id;
    IF v_prod.stock IS NOT NULL AND v_prod.stock <> 'unlimited' THEN
      UPDATE products SET stock = greatest(coalesce(v_stock_num,0) - p_quantity, 0)::text WHERE id = v_prod.id;
    END IF;
  ELSE
    v_lines := ARRAY(SELECT line FROM unnest(string_to_array(COALESCE(v_prod.hidden_keys_or_links,''), E'\n')) AS line
                     WHERE btrim(line) <> '');
    v_take := CASE WHEN array_length(v_lines,1) >= p_quantity THEN v_lines[1:p_quantity] ELSE ARRAY[]::TEXT[] END;
    v_delivered := CASE WHEN array_length(v_take,1) > 0 THEN array_to_string(v_take, E'\n')
                        ELSE COALESCE(v_prod.hidden_keys_or_links,'') END;
    IF v_prod.stock IS NOT NULL AND v_prod.stock <> 'unlimited' AND v_stock_num IS NOT NULL THEN
      UPDATE products SET stock = greatest(v_stock_num - p_quantity, 0)::text WHERE id = v_prod.id;
    END IF;
  END IF;

  -- Trừ ví + ghi đơn + audit (cùng transaction — lỗi nào cũng ROLLBACK toàn bộ)
  UPDATE profiles SET balance = balance - v_total WHERE id = auth.uid();
  INSERT INTO orders (user_id, user_name, product_id, product_name, package_id, package_name,
                      quantity, unit_price, total_price, status, payment_method, delivered_content, idem_key)
  VALUES (auth.uid()::text, v_user.username, v_prod.id::text, v_prod.name, p_package_id,
          COALESCE(v_pkg->>'name',''), p_quantity, v_unit, v_total, 'completed', 'wallet',
          v_delivered, p_idem_key)
  RETURNING * INTO v_order;
  UPDATE products SET sold_count = COALESCE(sold_count,0) + p_quantity WHERE id = v_prod.id;
  INSERT INTO audit_log (actor_id, action, target_type, target_id, detail)
  VALUES (auth.uid()::text, 'PURCHASE', 'order', v_order.id,
          jsonb_build_object('product', v_prod.name, 'qty', p_quantity, 'total', v_total));

  RETURN jsonb_build_object('status','success','order', jsonb_build_object(
    'id', v_order.id, 'orderCode', v_order.order_code, 'productName', v_order.product_name,
    'packageName', v_order.package_name, 'quantity', v_order.quantity, 'unitPrice', v_order.unit_price,
    'totalPrice', v_order.total_price, 'deliveredContent', v_order.delivered_content,
    'createdAt', v_order.created_at));
EXCEPTION WHEN OTHERS THEN
  -- EXCEPTION block tự rollback mọi thay đổi trong hàm (implicit subtransaction)
  RETURN jsonb_build_object('status','error','code','INTERNAL_ERROR');
END $$;

REVOKE EXECUTE ON FUNCTION public.create_order(TEXT,TEXT,INT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order(TEXT,TEXT,INT,TEXT) TO authenticated;

-- ============================ 5) RPC ADMIN ĐỌC SECRET =======================
CREATE OR REPLACE FUNCTION public.admin_get_product_secrets(p_product_id TEXT)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role='admin')
    THEN jsonb_build_object(
      'hidden_keys_or_links', p.hidden_keys_or_links,
      'accounts_list', p.accounts_list,
      'download_url', p.download_url)
    ELSE jsonb_build_object('status','error','code','FORBIDDEN') END
  FROM public.products p WHERE p.id::text = p_product_id;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_product_secrets(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_product_secrets(TEXT) TO authenticated;

-- ============================ 6) STORE_SETTINGS CHỈ ADMIN ===================
-- (trước đây anon đọc được cả settings_data gồm secret + gói kèm key)
-- Dọn MỌI policy cũ (dùng threshold rộng như using(true)) rồi chỉ giữ policy admin
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT policyname FROM pg_policies WHERE tablename = 'store_settings'
             AND policyname <> 'store_settings_admin_rw'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.store_settings', rec.policyname);
    RAISE NOTICE 'Đã bỏ policy cũ store_settings: %', rec.policyname;
  END LOOP;
END $$;

DROP POLICY IF EXISTS "store_settings_admin_rw" ON public.store_settings;
CREATE POLICY "store_settings_admin_rw" ON public.store_settings
  USING (EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'));
REVOKE SELECT ON public.store_settings FROM anon;

-- RPC public settings: trả settings đã STRIP trường nhạy cảm cho khách
CREATE OR REPLACE FUNCTION public.get_public_settings()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT (SELECT settings_data - 'twoFactorSecret' - 'twoFactorBackupCode' - 'blockedIps'
                - 'whitelistedIps' - 'adminLogs'
          FROM public.store_settings WHERE id = 'default');
$$;
REVOKE EXECUTE ON FUNCTION public.get_public_settings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_settings() TO anon;

-- ============================ 7) VIEW PRODUCTS PUBLIC (che key triệt để) =====
-- Column-level REVOKE không thắng table-level GRANT qua PostgREST → dùng VIEW
-- chỉ chứa cột an toàn; bảng gốc chỉ admin đọc/ghi (RLS), service_role bypass.
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public AS
  SELECT id, name, category, price, seller_price, original_price, stock, status,
         description, image_url, packages, product_type, is_sale, sale_price,
         instructions, images, featured, sold_count, updated_at, created_at
  FROM public.products;
GRANT SELECT ON public.products_public TO anon, authenticated;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_admin_read" ON public.products;
CREATE POLICY "products_admin_read" ON public.products
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'));
DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
CREATE POLICY "products_admin_insert" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'));
DROP POLICY IF EXISTS "products_admin_update" ON public.products;
CREATE POLICY "products_admin_update" ON public.products
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'));
DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
CREATE POLICY "products_admin_delete" ON public.products
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'));

-- Dọn 2 policy cũ cấp cho role {public} (mọi người kể cả anon) — đã thay bằng
-- bộ products_admin_* ở trên + VIEW products_public cho khách
DROP POLICY IF EXISTS "Admin can manage all products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
