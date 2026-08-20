const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

// 1. Add fetch functions
const fetchFunctions = `
      const fetchSupabaseOrders = async () => {
        try {
          const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (data) {
            setOrders(data.map((o) => ({
              id: o.id,
              orderCode: o.order_code,
              userId: o.user_id,
              userName: o.user_name || 'Khách',
              userEmail: o.user_email || '',
              productId: o.product_id,
              productName: o.product_name || 'S?n ph?m',
              category: o.category || 'Khác',
              quantity: o.quantity || 1,
              unitPrice: Number(o.unit_price),
              totalPrice: Number(o.total_price),
              totalAmount: Number(o.total_price),
              paymentMethod: (o.payment_method || 'wallet'),
              status: o.status,
              createdAt: new Date(o.created_at).toISOString().replace('T', ' ').substring(0, 16),
              deliveredContent: o.delivered_content || o.key,
              key: o.key,
              isSellerOrder: o.is_seller_order || false
            })));
          }
        } catch (err) { console.error(err); }
      };

      const fetchSupabaseTopups = async () => {
        try {
          const { data, error } = await supabase.from('topups').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (data) {
            setTopups(data.map((t) => ({
              id: t.id,
              requestCode: t.request_code,
              userId: t.user_id,
              userName: t.user_name || 'Khách',
              amount: Number(t.amount),
              method: (t.method || 'Bank Transfer'),
              transferNote: t.transfer_note || '',
              proofImage: t.proof_image,
              status: t.status,
              createdAt: new Date(t.created_at).toISOString().replace('T', ' ').substring(0, 16)
            })));
          }
        } catch (err) { console.error(err); }
      };

      const fetchSupabaseCardRecharges = async () => {
        try {
          const { data, error } = await supabase.from('card_recharges').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (data) {
            setCardRecharges(data.map((c) => ({
              id: c.id,
              requestCode: c.request_code,
              userId: c.user_id,
              userName: c.user_name || 'Khách',
              network: c.network,
              declaredAmount: Number(c.declared_amount),
              serial: c.serial,
              pin: c.pin,
              status: c.status,
              createdAt: new Date(c.created_at).toISOString().replace('T', ' ').substring(0, 16)
            })));
          }
        } catch (err) { console.error(err); }
      };

      const fetchSupabaseTransactions = async () => {
        try {
          const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (data) {
            setTransactions(data.map((tx) => ({
              id: tx.id,
              txCode: tx.tx_code,
              type: tx.type,
              userId: tx.user_id,
              userName: tx.user_name || 'Khách',
              description: tx.description || '',
              amount: Number(tx.amount),
              balanceAfter: Number(tx.balance_after || 0),
              status: tx.status,
              createdAt: new Date(tx.created_at).toISOString().replace('T', ' ').substring(0, 16)
            })));
          }
        } catch (err) { console.error(err); }
      };
      
      fetchSupabaseOrders();
      fetchSupabaseTopups();
      fetchSupabaseCardRecharges();
      fetchSupabaseTransactions();
`;
file = file.replace('fetchSupabaseProducts();\n      fetchSupabaseUsers();\n    }, []);', 'fetchSupabaseProducts();\n      fetchSupabaseUsers();\n' + fetchFunctions + '\n    }, []);');

// 2. Add sync helpers
const syncHelpers = `
  // --- SUPABASE BACKGROUND SYNC HELPERS ---
  const syncOrderToSupabase = (o) => {
    supabase.from('orders').upsert({
      id: o.id, order_code: o.orderCode, user_id: o.userId, user_name: o.userName, user_email: o.userEmail,
      product_id: o.productId, product_name: o.productName, category: o.category, quantity: o.quantity,
      unit_price: o.unitPrice, total_price: o.totalPrice, payment_method: o.paymentMethod, status: o.status,
      delivered_content: o.deliveredContent, key: o.key, is_seller_order: o.isSellerOrder,
      created_at: new Date(o.createdAt.replace(' ', 'T') + ':00.000Z').toISOString()
    }).then(res => { if(res.error) console.error('L?i sync Order:', res.error); });
  };
  
  const syncTopupToSupabase = (t) => {
    supabase.from('topups').upsert({
      id: t.id, request_code: t.requestCode, user_id: t.userId, user_name: t.userName,
      amount: t.amount, method: t.method, transfer_note: t.transferNote, proof_image: t.proofImage, status: t.status,
      created_at: new Date(t.createdAt.replace(' ', 'T') + ':00.000Z').toISOString()
    }).then(res => { if(res.error) console.error('L?i sync Topup:', res.error); });
  };

  const syncCardRechargeToSupabase = (c) => {
    supabase.from('card_recharges').upsert({
      id: c.id, request_code: c.requestCode, user_id: c.userId, user_name: c.userName, network: c.network,
      declared_amount: c.declaredAmount, serial: c.serial, pin: c.pin, status: c.status,
      created_at: new Date(c.createdAt.replace(' ', 'T') + ':00.000Z').toISOString()
    }).then(res => { if(res.error) console.error('L?i sync Card:', res.error); });
  };

  const syncTransactionToSupabase = (tx) => {
    supabase.from('transactions').upsert({
      id: tx.id, tx_code: tx.txCode, type: tx.type, user_id: tx.userId, user_name: tx.userName,
      description: tx.description, amount: tx.amount, balance_after: tx.balanceAfter, status: tx.status,
      created_at: new Date(tx.createdAt.replace(' ', 'T') + ':00.000Z').toISOString()
    }).then(res => { if(res.error) console.error('L?i sync Transaction:', res.error); });
  };
  // ----------------------------------------
`;
file = file.replace('// Supabase Data Sync: Products', syncHelpers + '\n  // Supabase Data Sync: Products');


// 3. Inject calls
file = file.replace(/createdOrders\.push\(newOrder\);/g, 'createdOrders.push(newOrder);\n      syncOrderToSupabase(newOrder);');
file = file.replace(/setOrders\(\(prev\) => \[newOrder, \.\.\.prev\]\);/g, 'setOrders((prev) => [newOrder, ...prev]);\n    syncOrderToSupabase(newOrder);');

file = file.replace(/setTransactions\(\(prev\) => \[newTx, \.\.\.prev\]\);/g, 'setTransactions((prev) => [newTx, ...prev]);\n    syncTransactionToSupabase(newTx);');
file = file.replace(/setTransactions\(\(prev\) => \[autoTx, \.\.\.prev\]\);/g, 'setTransactions((prev) => [autoTx, ...prev]);\n    syncTransactionToSupabase(autoTx);');

file = file.replace(/setTopups\(\(prev\) => \[newTopup, \.\.\.prev\]\);/g, 'setTopups((prev) => [newTopup, ...prev]);\n    syncTopupToSupabase(newTopup);');

file = file.replace(/setCardRecharges\(\(prev\) => \[newCard, \.\.\.prev\]\);/g, 'setCardRecharges((prev) => [newCard, ...prev]);\n    syncCardRechargeToSupabase(newCard);');

// Approve / Reject Topup
file = file.replace(/processedAt: new Date\(\)\.toISOString\(\)\.replace\('T', ' '\)\.substring\(0, 16\),\n              }\n            : t\n        \)\n      \);\n/g, "processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),\n              }\n            : t\n        )\n      );\n      const __t = topups.find(x => x.id === id);\n      if(__t) syncTopupToSupabase({ ...__t, status: 'approved' });\n");

// Approve / Reject Card
file = file.replace(/status: 'success',\n              processedAt: new Date\(\)\.toISOString\(\)\.replace\('T', ' '\)\.substring\(0, 16\),\n            \}\n          : c\n      \)\n    \);\n/g, "status: 'success',\n              processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),\n            }\n          : c\n      )\n    );\n    const __c1 = cardRecharges.find(x => x.id === id);\n    if(__c1) syncCardRechargeToSupabase({ ...__c1, status: 'success' });\n");
file = file.replace(/status: 'failed',\n              processedAt: new Date\(\)\.toISOString\(\)\.replace\('T', ' '\)\.substring\(0, 16\),\n            \}\n          : c\n      \)\n    \);\n/g, "status: 'failed',\n              processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),\n            }\n          : c\n      )\n    );\n    const __c2 = cardRecharges.find(x => x.id === id);\n    if(__c2) syncCardRechargeToSupabase({ ...__c2, status: 'failed' });\n");


fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched!');
