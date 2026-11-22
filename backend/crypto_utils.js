// ============================================================================
// KAVACH: Cryptographic Utilities (AES-256-GCM & SHA-256 Tamper Proofing)
// ============================================================================

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = Buffer.from(
  process.env.ENCRYPTION_KEY || 'kavach_defence_health_aes256_key32b!',
  'utf-8'
).subarray(0, 32);

/**
 * Encrypt sensitive clinical data using AES-256-GCM
 * @param {string|object} data - Data to encrypt
 * @returns {string} - JSON string containing ciphertext, iv, authTag
 */
function encryptAES256(data) {
  const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return JSON.stringify({
    iv: iv.toString('hex'),
    cipherText: encrypted,
    authTag: authTag,
    algorithm: ALGORITHM,
    encryptedAt: new Date().toISOString()
  });
}

/**
 * Decrypt sensitive clinical data
 * @param {string} payloadJson - JSON string containing ciphertext, iv, authTag
 * @returns {string} - Decrypted plaintext
 */
function decryptAES256(payloadJson) {
  try {
    const payload = JSON.parse(payloadJson);
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(payload.cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return '[Decryption Failed or Key Mismatch]';
  }
}

/**
 * Generate a tamper-proof SHA-256 HMAC for record verification
 * @param {object} record - Record data to hash
 * @returns {string} - SHA-256 hex string
 */
function generateTamperHash(record) {
  const normalized = `${record.soldier_id}|${record.type}|${record.date}|${record.posting}|${record.diagnosis || ''}|${record.is_mental_health}`;
  return crypto.createHmac('sha256', SECRET_KEY).update(normalized).digest('hex');
}

/**
 * Verify if record has been tampered with
 * @param {object} record
 * @returns {boolean}
 */
function verifyRecordTamper(record) {
  const expectedHash = generateTamperHash(record);
  return expectedHash === record.tamper_hash;
}

module.exports = {
  encryptAES256,
  decryptAES256,
  generateTamperHash,
  verifyRecordTamper
};
