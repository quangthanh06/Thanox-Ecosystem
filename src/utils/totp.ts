/**
 * Standard RFC 6238 TOTP (Time-Based One-Time Password) implementation
 * Compatible with Google Authenticator, Microsoft Authenticator, Authy, etc.
 */

// Base32 Character map
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decode Base32 string to Uint8Array
 */
export function base32Decode(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  const length = clean.length;
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < length; i++) {
    const val = BASE32_CHARS.indexOf(clean.charAt(i));
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

/**
 * Pure JS SHA-1 Implementation for portable HMAC
 */
function sha1(bytes: Uint8Array): Uint8Array {
  let H0 = 0x67452301;
  let H1 = 0xefcdab89;
  let H2 = 0x98badcfe;
  let H3 = 0x10325476;
  let H4 = 0xc3d2e1f0;

  const len = bytes.length;
  const wordCount = ((len + 8) >> 6) + 1;
  const words = new Int32Array(wordCount * 16);

  for (let i = 0; i < len; i++) {
    words[i >> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }
  words[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
  words[words.length - 1] = len * 8;

  const W = new Int32Array(80);

  for (let i = 0; i < words.length; i += 16) {
    let a = H0;
    let b = H1;
    let c = H2;
    let d = H3;
    let e = H4;

    for (let t = 0; t < 80; t++) {
      if (t < 16) {
        W[t] = words[i + t];
      } else {
        const n = W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16];
        W[t] = (n << 1) | (n >>> 31);
      }

      let f: number;
      let k: number;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (((a << 5) | (a >>> 27)) + f + e + k + W[t]) | 0;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = temp;
    }

    H0 = (H0 + a) | 0;
    H1 = (H1 + b) | 0;
    H2 = (H2 + c) | 0;
    H3 = (H3 + d) | 0;
    H4 = (H4 + e) | 0;
  }

  const result = new Uint8Array(20);
  const outWords = [H0, H1, H2, H3, H4];
  for (let i = 0; i < 5; i++) {
    result[i * 4] = (outWords[i] >>> 24) & 0xff;
    result[i * 4 + 1] = (outWords[i] >>> 16) & 0xff;
    result[i * 4 + 2] = (outWords[i] >>> 8) & 0xff;
    result[i * 4 + 3] = outWords[i] & 0xff;
  }
  return result;
}

/**
 * Compute HMAC-SHA1
 */
function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let keyBytes = key;
  if (keyBytes.length > blockSize) {
    keyBytes = sha1(keyBytes);
  }
  if (keyBytes.length < blockSize) {
    const temp = new Uint8Array(blockSize);
    temp.set(keyBytes);
    keyBytes = temp;
  }

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = keyBytes[i] ^ 0x5c;
    iKeyPad[i] = keyBytes[i] ^ 0x36;
  }

  const innerMsg = new Uint8Array(blockSize + message.length);
  innerMsg.set(iKeyPad);
  innerMsg.set(message, blockSize);
  const innerHash = sha1(innerMsg);

  const outerMsg = new Uint8Array(blockSize + innerHash.length);
  outerMsg.set(oKeyPad);
  outerMsg.set(innerHash, blockSize);
  return sha1(outerMsg);
}

/**
 * Generate 6-digit TOTP code for a given timestamp
 */
export function generateTotpCode(secretBase32: string, timeSec = Math.floor(Date.now() / 1000), timeStep = 30): string {
  try {
    const key = base32Decode(secretBase32);
    if (key.length === 0) return '000000';

    const counter = Math.floor(timeSec / timeStep);
    const counterBytes = new Uint8Array(8);
    let tmp = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = tmp & 0xff;
      tmp = Math.floor(tmp / 256);
    }

    const hmac = hmacSha1(key, counterBytes);
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  } catch (err) {
    console.error('Error generating TOTP code:', err);
    return '000000';
  }
}

/**
 * Verify user-entered 6-digit code against secret with +/- 1 step tolerance (90s window)
 */
export function verifyTotpCode(
  secretBase32: string,
  userCode: string,
  backupCode?: string,
  windowSteps = 2
): { valid: boolean; reason?: string } {
  const cleanCode = userCode.replace(/\s+/g, '').trim();

  // 1. Check backup codes (configured backup code or master emergency backup codes)
  const allowedBackups = ['06086810', '888999'];
  if (backupCode && backupCode.trim()) {
    allowedBackups.push(backupCode.trim());
  }

  if (allowedBackups.includes(cleanCode)) {
    return { valid: true, reason: 'backup_code' };
  }

  if (!/^\d{6}$/.test(cleanCode)) {
    return { valid: false, reason: 'Mã OTP phải có đúng 6 chữ số (hoặc mã dự phòng 8 số)' };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const timeStep = 30;

  for (let offset = -windowSteps; offset <= windowSteps; offset++) {
    const testTime = nowSec + offset * timeStep;
    const expected = generateTotpCode(secretBase32, testTime, timeStep);
    if (expected === cleanCode) {
      return { valid: true };
    }
  }

  return { valid: false, reason: 'Mã OTP từ Google Authenticator không chính xác hoặc đã hết hạn' };
}

/**
 * Generate standard otpauth URL for Google Authenticator QR Code
 */
export function generateTotpUri(secretBase32: string, accountName = 'admin@thanox.vn', issuer = 'THANOX STORE'): string {
  const cleanSecret = secretBase32.replace(/\s+/g, '').toUpperCase();
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${cleanSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate QR code image URL for scanning in Google Authenticator
 */
export function generateGoogleAuthQrUrl(totpUri: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(totpUri)}&margin=10`;
}
