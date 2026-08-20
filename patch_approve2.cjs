const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const oldFunc = `  // Topup review actions with double-action prevention
  const approveTopup = (id: string) => {
    const topup = topups.find((t) => t.id === id);
    if (!topup || topup.status !== 'pending') {
      showToast('Yêu c?u n?p này dã du?c x? lý tru?c dó', 'warning');
      return;
    }

    const targetUser = users.find((u) => u.id === topup.userId);
    const newBalance = (targetUser ? targetUser.balance : 0) + topup.amount;

    setUsers((prev) =>
      prev.map((u) => (u.id === topup.userId ? { ...u, balance: newBalance } : u))
    );

    setTopups((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'approved',
              processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : t
      )
    );

    // Add deposit transaction
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
      type: 'deposit',
      userId: topup.userId,
      userName: topup.userName,
      description: \`N?p ti?n qua \${topup.method} (\${topup.transferNote})\`,
      amount: topup.amount,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);
    syncTransactionToSupabase(newTx);

    showToast(
      \`Ðã duy?t n?p ti?n \${topup.amount.toLocaleString('vi-VN')}d cho \${topup.userName}!\`,
      'success'
    );
  };`;

const newFunc = `  // Topup review actions with double-action prevention
  const approveTopup = async (id: string) => {
    const topup = topups.find((t) => t.id === id);
    if (!topup || topup.status !== 'pending') {
      showToast('Yêu c?u n?p này dã du?c x? lý tru?c dó', 'warning');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('admin_approve_topup', { p_topup_id: id });
      if (error) throw error;
      
      if (data && data.status === 'error') {
        showToast('L?i t? Server: ' + data.reason, 'error');
        return;
      }

      const targetUser = users.find((u) => u.id === topup.userId);
      const newBalance = (targetUser ? targetUser.balance : 0) + topup.amount;

      setUsers((prev) => prev.map((u) => (u.id === topup.userId ? { ...u, balance: newBalance } : u)));
      
      setTopups((prev) => prev.map((t) => t.id === id ? {
        ...t, status: 'approved', processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      } : t));

      setTransactions((prev) => [{
        id: 'tx-temp-' + Date.now(),
        txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
        type: 'deposit',
        userId: topup.userId,
        userName: topup.userName,
        description: \`Admin duy?t n?p ti?n qua \${topup.method} (\${topup.transferNote})\`,
        amount: topup.amount,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'completed',
      }, ...prev]);

      showToast(\`Ðã duy?t n?p ti?n \${topup.amount.toLocaleString('vi-VN')}d cho \${topup.userName} an toàn qua Server!\`, 'success');
    } catch (e) {
      console.error(e);
      showToast('L?i k?t n?i Server RPC', 'error');
    }
  };`;

if(file.includes(oldFunc)) {
  file = file.replace(oldFunc, newFunc);
  fs.writeFileSync('src/context/StoreContext.tsx', file);
  console.log('Patched approveTopup exactly!');
} else {
  console.log('Could not find oldFunc exact match!');
}
