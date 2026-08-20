const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

file = file.replace(/const approveTopup = \(id: string\) => \{[\s\S]*?`Ðã duy?t n?p ti?n \$\{topup\.amount\.toLocaleString\('vi-VN'\)\}d cho \$\{topup\.userName\}!`,[\s\S]*?'success'[\s\S]*?\);[\s\S]*?\};/m, `const approveTopup = async (id: string) => {
    const topup = topups.find((t) => t.id === id);
    if (!topup || topup.status !== 'pending') {
      showToast('Yêu c?u n?p này dã du?c x? lý tru?c dó', 'warning');
      return;
    }

    try {
      // Call secure RPC for manual approval
      const { data, error } = await supabase.rpc('admin_approve_topup', {
        p_topup_id: id
      });

      if (error) throw error;
      if (data.status === 'error') {
        showToast('L?i t? Server: ' + data.reason, 'error');
        return;
      }

      // Optimistic update for UI speed
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

      showToast(\`Ðã duy?t n?p ti?n \${topup.amount.toLocaleString('vi-VN')}d cho \${topup.userName} thành công trên Cloud!\`, 'success');
    } catch (e) {
      console.error(e);
      showToast('L?i k?t n?i t?i Server', 'error');
    }
  };`);

fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched approveTopup');
