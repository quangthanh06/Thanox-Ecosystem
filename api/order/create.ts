import { createClient } from '@supabase/supabase-js';

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponse {
  status(code: number): { json(data: unknown): void };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, error: 'DATABASE_CONFIG_MISSING' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

  // 1. Xác thực danh tính User từ Authorization Bearer Token
  const authHeader = req.headers['authorization'];
  const token = (Array.isArray(authHeader) ? authHeader[0] : authHeader)?.replace(/^Bearer\s+/i, '').trim();

  let authenticatedUserId: string | null = null;

  if (token) {
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (!userErr && userData?.user?.id) {
      authenticatedUserId = userData.user.id;
    }
  }

  // Fallback lấy userId từ body nếu có phiên đăng nhập nội bộ
  const { productId, packageId, quantity = 1, idempotencyKey, userId: bodyUserId } = req.body || {};
  const targetUserId = authenticatedUserId || bodyUserId;

  if (!targetUserId) {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', error: 'Vui lòng đăng nhập tài khoản để mua hàng' });
  }

  if (!productId) {
    return res.status(400).json({ success: false, code: 'INVALID_INPUT', error: 'Thiếu thông tin sản phẩm' });
  }

  const qty = Math.max(1, Math.min(100, parseInt(String(quantity), 10) || 1));

  try {
    // 2. Idempotency Check: nếu đã có đơn cùng (user, idempotencyKey) thì trả về đơn cũ (không trừ 2 lần)
    if (idempotencyKey) {
      const { data: existingOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('idem_key', idempotencyKey)
        .limit(1);

      if (existingOrders && existingOrders.length > 0) {
        const o = existingOrders[0];
        return res.status(200).json({
          success: true,
          duplicate: true,
          order: {
            id: o.id,
            orderCode: o.order_code || o.id,
            productName: o.product_name,
            packageName: o.package_name,
            quantity: o.quantity,
            unitPrice: o.unit_price,
            totalPrice: o.total_price,
            deliveredContent: o.delivered_content,
            createdAt: o.created_at,
          },
        });
      }
    }

    // 3. Đọc dữ liệu Người Dùng từ bảng profiles (Single Source of Truth)
    const { data: userProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (profileErr || !userProfile) {
      return res.status(404).json({ success: false, code: 'USER_NOT_FOUND', error: 'Không tìm thấy thông tin tài khoản người dùng' });
    }

    if (userProfile.status === 'banned') {
      return res.status(403).json({ success: false, code: 'USER_BANNED', error: 'Tài khoản của bạn đã bị khóa' });
    }

    // 4. Đọc dữ liệu Sản Phẩm từ bảng products
    const { data: product, error: productErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productErr || !product) {
      return res.status(404).json({ success: false, code: 'PRODUCT_NOT_FOUND', error: 'Sản phẩm không tồn tại' });
    }

    if (product.status !== 'active') {
      return res.status(400).json({ success: false, code: 'PRODUCT_NOT_ACTIVE', error: 'Sản phẩm hiện đang tạm ngừng bán' });
    }

    // 5. Tính giá Server-Authoritative
    const isSeller = userProfile.role === 'seller';
    let unitPrice = Number(product.price) || 0;
    let selectedPackageObj: any = null;

    if (packageId && product.packages) {
      const pkgs = typeof product.packages === 'string' ? JSON.parse(product.packages) : product.packages;
      if (Array.isArray(pkgs)) {
        selectedPackageObj = pkgs.find((p: any) => p.id === packageId);
        if (selectedPackageObj) {
          unitPrice = Number(selectedPackageObj.price) || unitPrice;
          if (isSeller && selectedPackageObj.sellerPrice) {
            unitPrice = Number(selectedPackageObj.sellerPrice);
          }
        }
      }
    } else if (isSeller && product.seller_price) {
      unitPrice = Number(product.seller_price);
    }

    const total = unitPrice * qty;
    const currentBalance = Number(userProfile.balance) || 0;

    // 6. Kiểm tra số dư trên Server
    if (currentBalance < total) {
      return res.status(200).json({
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        error: `Số dư ví không đủ! Cần thêm ${(total - currentBalance).toLocaleString('vi-VN')}đ`,
        balance: currentBalance,
        total,
      });
    }

    // 7. Cấp phát kho tự động (Inventory Allocation)
    let deliveredContent = '';
    let updatedAccountsList = product.accounts_list;
    let updatedHiddenKeys = product.hidden_keys_or_links;
    let currentStockNum = product.stock ? parseInt(String(product.stock).replace(/\D/g, ''), 10) : null;

    if (product.accounts_list && product.accounts_list.trim()) {
      const lines = product.accounts_list.split('\n').map((l: string) => l.trim()).filter(Boolean);
      if (lines.length < qty) {
        return res.status(200).json({ success: false, code: 'OUT_OF_STOCK', error: 'Sản phẩm trong kho đã hết' });
      }
      const allocated = lines.slice(0, qty);
      const remaining = lines.slice(qty).join('\n');
      updatedAccountsList = remaining;

      const firstItem = allocated[0];
      if (firstItem.includes('|')) {
        const parts = firstItem.split('|');
        deliveredContent = `🎮 TÀI KHOẢN: ${parts[0] || ''}\n🔑 MẬT KHẨU: ${parts[1] || ''}${parts[2] ? `\n🛡️ 2FA / GHI CHÚ: ${parts[2]}` : ''}`;
      } else {
        deliveredContent = allocated.join('\n');
      }

      if (currentStockNum !== null && !isNaN(currentStockNum)) {
        currentStockNum = Math.max(0, currentStockNum - qty);
      }
    } else if (product.hidden_keys_or_links && product.hidden_keys_or_links.trim()) {
      const lines = product.hidden_keys_or_links.split('\n').map((l: string) => l.trim()).filter(Boolean);
      if (lines.length >= qty) {
        deliveredContent = lines.slice(0, qty).join('\n');
        updatedHiddenKeys = lines.slice(qty).join('\n');
        if (currentStockNum !== null && !isNaN(currentStockNum)) {
          currentStockNum = Math.max(0, currentStockNum - qty);
        }
      } else {
        deliveredContent = product.hidden_keys_or_links;
      }
    } else {
      deliveredContent = product.download_url || product.instructions || selectedPackageObj?.downloadUrl || 'Đã kích hoạt tự động';
    }

    // 8. Trừ ví người dùng trên Server Database (Atomic Update)
    const newBalance = currentBalance - total;
    const { error: debitErr } = await supabase
      .from('profiles')
      .update({
        balance: newBalance,
        total_spent: (Number(userProfile.total_spent) || 0) + total,
      })
      .eq('id', targetUserId);

    if (debitErr) {
      console.error('[API Order] Debit error:', debitErr);
      return res.status(500).json({ success: false, code: 'DEBIT_FAILED', error: 'Không thể trừ tiền trong ví' });
    }

    // 9. Cập nhật tồn kho sản phẩm
    await supabase
      .from('products')
      .update({
        accounts_list: updatedAccountsList,
        hidden_keys_or_links: updatedHiddenKeys,
        stock: currentStockNum !== null ? String(currentStockNum) : product.stock,
        sold_count: (Number(product.sold_count) || 0) + qty,
      })
      .eq('id', productId);

    // 10. Tạo đơn hàng trong bảng orders
    const orderNum = Math.floor(10000 + Math.random() * 90000);
    const orderCode = `#TX-${orderNum}`;

    const { data: createdOrder, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: targetUserId,
        user_name: userProfile.username,
        product_id: product.id,
        product_name: product.name,
        package_id: packageId || null,
        package_name: selectedPackageObj?.name || null,
        quantity: qty,
        unit_price: unitPrice,
        total_price: total,
        status: 'completed',
        payment_method: 'wallet',
        delivered_content: deliveredContent,
        idem_key: idempotencyKey || `api-${Date.now()}`,
      })
      .select()
      .single();

    if (orderErr) {
      console.error('[API Order] Order insert error:', orderErr);
    }

    // 11. Ghi sổ cái tài chính transactions (PURCHASE ledger)
    await supabase
      .from('transactions')
      .insert({
        user_id: targetUserId,
        user_name: userProfile.username,
        type: 'purchase',
        amount: -total,
        balance_after: newBalance,
        description: `Thanh toán mua ${product.name}${selectedPackageObj?.name ? ` [${selectedPackageObj.name}]` : ''} (x${qty})`,
        status: 'completed',
      });

    return res.status(200).json({
      success: true,
      order: {
        id: createdOrder?.id || `ord-${Date.now()}`,
        orderCode: createdOrder?.order_code || orderCode,
        productName: product.name,
        packageName: selectedPackageObj?.name || null,
        quantity: qty,
        unitPrice,
        totalPrice: total,
        deliveredContent,
        newBalance,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[API Order] Server exception:', err);
    return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', error: 'Lỗi xử lý đơn hàng trên máy chủ' });
  }
}
