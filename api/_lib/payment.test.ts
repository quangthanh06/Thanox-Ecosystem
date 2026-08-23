import { normalizeTransaction, isProviderPayload, normalizeTransactionList } from './payment';

let pass = 0, fail = 0;
const check = (name: string, cond: boolean) => { cond ? pass++ : fail++; console.log((cond ? '✅' : '❌') + ' ' + name); };

// 1. Đúng spec: amount STRING "50000", date dd/MM/yyyy
const t1 = normalizeTransaction({ type: 'IN', transactionID: 'FT26012ABC', amount: '50000', description: 'CK STT TESTNAP123', transactionDate: '14/01/2026' });
check('amount string → 50000', t1 !== null && t1.amount === 50000);
check('date 14/01/2026 → ISO', t1 !== null && /^\d{4}-01-14T/.test(t1.transferTime));
check('transactionId giữ nguyên', t1 !== null && t1.transactionId === 'FT26012ABC');

// 2. Webhook payload (không có transactionDate) → dùng now
const t2 = normalizeTransaction({ type: 'IN', transactionID: 'X1', amount: '100000', description: 'nap tien' });
check('webhook không date → now ISO', t2 !== null && !Number.isNaN(Date.parse(t2.transferTime)));

// 3. type OUT → bỏ
const t3 = normalizeTransaction({ type: 'OUT', transactionID: 'X2', amount: '1000', description: 'rut' });
check('type OUT → null (không credit)', t3 === null);

// 4. Thiếu field → bỏ
check('thiếu transactionID → null', normalizeTransaction({ type: 'IN', amount: '1000', description: 'x' }) === null);
check('amount rỗng → null', normalizeTransaction({ type: 'IN', transactionID: 'X3', amount: '', description: 'x' }) === null);
check('amount 0 → null', normalizeTransaction({ type: 'IN', transactionID: 'X4', amount: '0', description: 'x' }) === null);
check('amount âm → null', normalizeTransaction({ type: 'IN', transactionID: 'X5', amount: '-50', description: 'x' }) === null);
check('thiếu description → null', normalizeTransaction({ type: 'IN', transactionID: 'X6', amount: '1000' }) === null);

// 5. Payload schema
check('payload đúng schema', isProviderPayload({ status: 'success', transactions: [] }) === true);
check('payload sai status → false', isProviderPayload({ status: 'error', transactions: [] }) === false);
check('payload thiếu transactions → false', isProviderPayload({ status: 'success' }) === false);
check('payload không phải object → false', isProviderPayload(null) === false);
check('transactions không phải mảng → false', isProviderPayload({ status: 'success', transactions: {} }) === false);

// 6. List hỗn hợp
const r = normalizeTransactionList([
  { type: 'IN', transactionID: 'A1', amount: '10000', description: 'ok' },
  { type: 'OUT', transactionID: 'A2', amount: '10000', description: 'out' },
  { type: 'IN', amount: '10000', description: 'no id' },
  { type: 'IN', transactionID: 'A3', amount: 'abc', description: 'bad amount' },
]);
check('list: 1 hợp lệ, 3 bỏ', r.valid.length === 1 && r.skippedCount === 3);
check('list: đúng A1', r.valid[0]?.transactionId === 'A1');

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILED'}: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
