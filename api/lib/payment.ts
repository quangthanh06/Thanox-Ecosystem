/**
 * THUEAPIBANK shared payment utilities (provider: MB Bank qua THUEAPI)
 * ===================================================================
 * ĐÚNG THEO SPEC CUNG CẤP — KHÔNG THÊM, KHÔNG ĐOÁN:
 *
 * GET HISTORY:
 *   GET https://thueapibank.vn/historyapimbv2/{SECRET_KEY}
 *   → { status:'success', msg, merchant, transactions:[ {
 *        type:'IN', transactionID:'...', amount:'50000',
 *        description:'...', transactionDate:'14/01/2026' } ] }
 *
 * WEBHOOK (dịch vụ gọi về ta):
 *   POST /api/webhook/mbbank, header `signature: <secret>`
 *   → { status:'success', message, transactions:[ {
 *        type:'IN', transactionID:'...', amount:'100000', description:'...' } ] }
 *
 * Lưu ý quan trọng:
 *  - amount là STRING số ("50000") — chấp nhận cả number để phòng provider đổi.
 *  - transactionDate dạng dd/MM/yyyy — PHẢI parse sang ISO, không truyền thẳng
 *    vào RPC (PostgreSQL không cast được '14/01/2026' → TIMESTAMPTZ).
 *  - Chỉ type='IN' được xét cho deposit.
 */

export interface ThueapibankTransaction {
  type?: string;
  transactionID?: string | number;
  amount?: string | number;
  description?: string;
  transactionDate?: string;
}

export interface NormalizedTransaction {
  transactionId: string;
  amount: number;
  description: string;
  transferTime: string; // ISO 8601
}

export interface ParseResult {
  valid: NormalizedTransaction[];
  skippedCount: number;
  skipReasons: string[];
}

const MAX_DESCRIPTION_LENGTH = 500;

/** dd/MM/yyyy → ISO (giờ Việt Nam UTC+7, noon fallback để an toàn múi giờ) */
const parseVietnamDate = (raw?: string): string => {
  if (!raw) return new Date().toISOString();
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
  if (!m) {
    // Nếu provider gửi ISO thì dùng luôn; không thì lấy thời điểm hiện tại
    const asIso = new Date(raw).getTime();
    return Number.isFinite(asIso) ? new Date(asIso).toISOString() : new Date().toISOString();
  }
  const [, dd, mm, yyyy] = m;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 7, 0, 0));
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
};

/**
 * Chuẩn hóa + validate MỘT giao dịch theo spec.
 * Trả về null nếu giao dịch không hợp lệ (không bao giờ credit).
 */
export const normalizeTransaction = (tx: ThueapibankTransaction): NormalizedTransaction | null => {
  if (!tx || typeof tx !== 'object') return null;

  // 1. Chỉ giao dịch INTO tài khoản (type = 'IN') được xét
  if (tx.type !== undefined && tx.type !== 'IN') return null;

  // 2. transactionID bắt buộc, chuỗi không rỗng
  const transactionId = tx.transactionID === undefined ? '' : String(tx.transactionID).trim();
  if (!transactionId || transactionId.length > 100) return null;

  // 3. amount: STRING số theo spec ("50000"), chấp nhận number; phải là số dương hợp lệ
  const amountNum = typeof tx.amount === 'number' ? tx.amount : Number(String(tx.amount ?? '').replace(/[,\s]/g, ''));
  if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > 1_000_000_000) return null;

  // 4. description bắt buộc (chứa mã chuyển khoản để match topup)
  const description = String(tx.description ?? '').trim();
  if (!description) return null;

  return {
    transactionId,
    amount: Math.round(amountNum),
    description: description.slice(0, MAX_DESCRIPTION_LENGTH),
    transferTime: parseVietnamDate(tx.transactionDate),
  };
};

/**
 * Validate payload gốc từ THUEAPIBANK theo schema spec.
 * invalid → null (caller phải từ chối / bỏ qua, KHÔNG xử lý tài chính).
 */
export const isProviderPayload = (payload: unknown): payload is { transactions: ThueapibankTransaction[] } => {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as { status?: unknown; transactions?: unknown };
  return p.status === 'success' && Array.isArray(p.transactions);
};

/** Chuẩn hóa cả danh sách — trả về giao dịch hợp lệ + số bị bỏ qua kèm lý do */
export const normalizeTransactionList = (list: ThueapibankTransaction[]): ParseResult => {
  const valid: NormalizedTransaction[] = [];
  const skipReasons: string[] = [];
  for (const tx of list) {
    const normalized = normalizeTransaction(tx);
    if (normalized) {
      valid.push(normalized);
    } else {
      skipReasons.push(
        !tx || (tx.type !== undefined && tx.type !== 'IN')
          ? 'type_not_IN'
          : !String(tx?.transactionID ?? '').trim()
            ? 'missing_transactionID'
            : !(Number(String(tx?.amount ?? '')) > 0)
              ? 'invalid_amount'
              : 'missing_description'
      );
    }
  }
  return { valid, skippedCount: list.length - valid.length, skipReasons };
};

/** So sánh secret hằng thời gian (chống timing attack) */
export const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/**
 * Xác thực request webhook: fail-closed.
 * Env (theo thứ tự ưu tiên): THUEAPIBANK_SECRET_KEY → MBBANK_SECRET_KEY → SEPAY_API_KEY.
 * Chưa cấu hình bất kỳ secret nào → từ chối mọi request.
 */
export const getWebhookSecret = (): string | null =>
  process.env.THUEAPIBANK_SECRET_KEY ||
  process.env.MBBANK_SECRET_KEY ||
  process.env.SEPAY_API_KEY ||
  null;

export const verifyWebhookAuth = (
  signatureHeader: string | string[] | undefined,
  authorizationHeader: string | string[] | undefined,
  expectedSecret: string | null
): boolean => {
  if (!expectedSecret) return false; // fail-closed
  const provided = (Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader) || '';
  const bearer = (Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader) || '';
  return safeEqual(provided, expectedSecret) || safeEqual(bearer, 'Bearer ' + expectedSecret);
};

/** Giới hạn kích thước body webhook (chống payload khổng lồ làm chết function) */
export const MAX_WEBHOOK_BODY_BYTES = 256 * 1024; // 256 KB

/** URL GET history theo spec (cho phép override qua env nếu provider đổi host) */
export const getHistoryUrl = (): string => {
  const base = process.env.THUEAPIBANK_HISTORY_URL || 'https://thueapibank.vn/historyapimbv2';
  const token = process.env.THUEAPI_MB_TOKEN || process.env.THUEAPIBANK_SECRET_KEY || '';
  return `${base}/${token}`;
};

export const HISTORY_TIMEOUT_MS = 10_000;
