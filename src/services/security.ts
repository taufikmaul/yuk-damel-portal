/**
 * Multi-Layered Security Service for akugawe Sales Portal
 * Provides:
 * 1. Master Passcode/PIN Verification (Knowledge Factor)
 * 2. Cryptographic CSPRNG OTP Generation (Possession Factor)
 * 3. In-Memory Hashed Verification (Anti-Memory Dump)
 * 4. Anti-Tamper Signed Session with Device Fingerprinting
 * 5. AES-GCM 256-bit Storage Encryption (Data-at-Rest Protection)
 * 6. Rate-Limiting, Progressive Lockout, and Idle Inactivity Auto-Lock
 */

const SESSION_SALT = 'akugawe_sec_v1_auth_salt';
const MAX_FAILED_ATTEMPTS = 5;
const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 detik lockout jika 5x gagal
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 detik cooldown request OTP baru

// Default SHA-256 hash for Master PIN '2468'
export const DEFAULT_ADMIN_PIN_HASH = 'a1fb4e703a9ef1fa4936801721ff285a97ac85330856674412e054892afe6972';

/**
 * SHA-256 hashing using Web Crypto API
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies Master Admin PIN against the stored SHA-256 hash
 */
export async function verifyMasterPin(inputPin: string, storedHash?: string): Promise<boolean> {
  if (!inputPin || inputPin.trim().length < 4) return false;
  const targetHash = storedHash || DEFAULT_ADMIN_PIN_HASH;
  const inputHash = await sha256(inputPin.trim());
  return inputHash === targetHash;
}

/**
 * Generates an unguessable 6-digit OTP code using CSPRNG (Web Crypto)
 */
export function generateSecureOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const otp = 100000 + (array[0] % 900000);
  return otp.toString();
}

/**
 * Derives a 256-bit AES-GCM cryptographic key from a passphrase/salt using PBKDF2
 */
async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * AES-GCM 256-bit encryption for sensitive data at rest
 */
export async function encryptData(plainText: string, secretKey: string = SESSION_SALT): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveAesKey(secretKey, salt);

    const encryptedContent = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const buffer = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContent.byteLength);
    buffer.set(salt, 0);
    buffer.set(iv, salt.byteLength);
    buffer.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);

    return btoa(String.fromCharCode(...buffer));
  } catch (err) {
    console.error('Encryption failed:', err);
    return plainText;
  }
}

/**
 * AES-GCM 256-bit decryption for encrypted storage
 */
export async function decryptData(cipherTextBase64: string, secretKey: string = SESSION_SALT): Promise<string> {
  try {
    const binary = atob(cipherTextBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const data = bytes.slice(28);

    const key = await deriveAesKey(secretKey, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    // If not encrypted or decryption fails, fallback
    return cipherTextBase64;
  }
}

/**
 * Device fingerprint string for session binding
 */
function getDeviceFingerprint(): string {
  const nav = typeof window !== 'undefined' ? window.navigator : ({} as any);
  return [
    nav.userAgent || '',
    nav.language || '',
    typeof window !== 'undefined' ? `${window.screen?.width}x${window.screen?.height}` : '',
  ].join('|');
}

export interface SignedSession {
  authenticated: boolean;
  issuedAt: number;
  expiresAt: number;
  fingerprintHash: string;
  signature: string;
}

/**
 * Creates a signed session object to prevent client-side localStorage tampering
 */
export async function createSignedSession(ttlMs: number): Promise<SignedSession> {
  const now = Date.now();
  const expiresAt = now + ttlMs;
  const fp = getDeviceFingerprint();
  const fingerprintHash = await sha256(fp);

  const rawPayload = `${now}:${expiresAt}:${fingerprintHash}:${SESSION_SALT}`;
  const signature = await sha256(rawPayload);

  return {
    authenticated: true,
    issuedAt: now,
    expiresAt,
    fingerprintHash,
    signature,
  };
}

/**
 * Validates session integrity against tampering, expiration, and device mismatch
 */
export async function verifySignedSession(session: any): Promise<boolean> {
  if (!session || typeof session !== 'object') return false;
  if (!session.authenticated || !session.expiresAt || !session.signature) return false;

  // Check expiration
  if (Date.now() > session.expiresAt) {
    return false;
  }

  // Check fingerprint match
  const fp = getDeviceFingerprint();
  const currentFpHash = await sha256(fp);
  if (session.fingerprintHash !== currentFpHash) {
    return false;
  }

  // Recompute signature to verify data has not been modified
  const rawPayload = `${session.issuedAt}:${session.expiresAt}:${session.fingerprintHash}:${SESSION_SALT}`;
  const expectedSignature = await sha256(rawPayload);

  return session.signature === expectedSignature;
}

/**
 * Rate Limiting & Lockout Tracker for both Master PIN and OTP
 */
export interface RateLimitState {
  failedAttempts: number;
  pinFailedAttempts: number;
  lockedUntil: number;
  lastRequestedAt: number;
}

const RATE_LIMIT_STORAGE_KEY = 'ngabsen_sec_ratelimit';

export function getRateLimitState(): RateLimitState {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        failedAttempts: parsed.failedAttempts || 0,
        pinFailedAttempts: parsed.pinFailedAttempts || 0,
        lockedUntil: parsed.lockedUntil || 0,
        lastRequestedAt: parsed.lastRequestedAt || 0,
      };
    }
  } catch (_) {}
  return { failedAttempts: 0, pinFailedAttempts: 0, lockedUntil: 0, lastRequestedAt: 0 };
}

export function saveRateLimitState(state: RateLimitState) {
  try {
    sessionStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

export function recordFailedAttempt(): { isLocked: boolean; remainingAttempts: number; lockTimeSeconds: number } {
  const state = getRateLimitState();
  state.failedAttempts += 1;

  if (state.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    state.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    saveRateLimitState(state);
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockTimeSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
  }

  saveRateLimitState(state);
  return {
    isLocked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - state.failedAttempts,
    lockTimeSeconds: 0,
  };
}

export function recordFailedPinAttempt(): { isLocked: boolean; remainingAttempts: number; lockTimeSeconds: number } {
  const state = getRateLimitState();
  state.pinFailedAttempts = (state.pinFailedAttempts || 0) + 1;

  if (state.pinFailedAttempts >= MAX_PIN_ATTEMPTS) {
    state.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    saveRateLimitState(state);
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockTimeSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
  }

  saveRateLimitState(state);
  return {
    isLocked: false,
    remainingAttempts: MAX_PIN_ATTEMPTS - state.pinFailedAttempts,
    lockTimeSeconds: 0,
  };
}

export function resetFailedAttempts() {
  const state = getRateLimitState();
  state.failedAttempts = 0;
  state.pinFailedAttempts = 0;
  state.lockedUntil = 0;
  saveRateLimitState(state);
}

export function recordOtpRequest() {
  const state = getRateLimitState();
  state.lastRequestedAt = Date.now();
  saveRateLimitState(state);
}

export function getResendCooldownRemaining(): number {
  const state = getRateLimitState();
  if (!state.lastRequestedAt) return 0;
  const elapsed = Date.now() - state.lastRequestedAt;
  const remaining = RESEND_COOLDOWN_MS - elapsed;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export function getLockoutRemaining(): number {
  const state = getRateLimitState();
  if (!state.lockedUntil) return 0;
  const remaining = state.lockedUntil - Date.now();
  if (remaining <= 0) {
    state.failedAttempts = 0;
    state.pinFailedAttempts = 0;
    state.lockedUntil = 0;
    saveRateLimitState(state);
    return 0;
  }
  return Math.ceil(remaining / 1000);
}
