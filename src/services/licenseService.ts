import { decryptData, encryptData } from './security';

export interface ClientRecord {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  status: 'active' | 'pending';
  customDomainDashboard?: string;
  customDomainApp?: string;
  deployedUrl?: string;
  isCompleted?: boolean;
  isSample?: boolean;
}

export const CLIENTS_STORAGE_KEY = 'ngabsen_seller_clients';

// In-memory cache for decrypted clients
let cachedClients: ClientRecord[] | null = null;
let isDecrypting = false;

// Pre-warm the cache immediately if raw storage is encrypted
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (raw) {
      if (raw.startsWith('ENC:')) {
        decryptData(raw.slice(4))
          .then((decrypted) => {
            try {
              const parsed = JSON.parse(decrypted);
              if (Array.isArray(parsed)) {
                cachedClients = parsed.filter(
                  (c: ClientRecord) => !c.isSample && c.id !== 'c1' && c.id !== 'c2' && c.id !== 'c3'
                );
              }
            } catch (_) {}
          })
          .catch(() => {});
      } else {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          cachedClients = parsed.filter(
            (c: ClientRecord) => !c.isSample && c.id !== 'c1' && c.id !== 'c2' && c.id !== 'c3'
          );
        }
      }
    }
  } catch (_) {}
}

// Default secret salt for token checksum validation (in production, can be set in config/env)
const TOKEN_SECRET_SALT = 'NGABSEN_SECURE_LICENSE_SALT_2026_KEY';

/**
 * Generate a short 4-character hex checksum from slug and random seed
 */
function generateChecksum(payload: string): string {
  let hash = 0x811c9dc5;
  const str = `${payload}:${TOKEN_SECRET_SALT}`;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (Math.abs(hash) % 0x10000).toString(16).padStart(4, '0').toUpperCase();
}

/**
 * Generate a secure license token
 * Format: NGABSEN-<SLUG>-<RANDOM4>-<CHECKSUM4>
 */
export function generateLicenseToken(clientName: string): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const cleanSlug = clientName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8) || 'CLIENT';
  
  const base = `${cleanSlug}-${randomSuffix}`;
  const checksum = generateChecksum(base);
  return `NGABSEN-${base}-${checksum}`;
}

/**
 * Get all registered client licenses from localStorage (synchronous)
 * Supports cached decrypted records if storage is encrypted with ENC:
 */
export function getRegisteredClients(): ClientRecord[] {
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (!raw) return [];

    // Jika terenkripsi dengan format ENC:, jangan JSON.parse langsung
    if (raw.startsWith('ENC:')) {
      if (cachedClients) {
        return cachedClients;
      }
      // Picu dekripsi di background untuk mengisi cache
      if (!isDecrypting) {
        isDecrypting = true;
        decryptData(raw.slice(4))
          .then((decrypted) => {
            try {
              const parsed = JSON.parse(decrypted);
              if (Array.isArray(parsed)) {
                cachedClients = parsed.filter(
                  (c: ClientRecord) => !c.isSample && c.id !== 'c1' && c.id !== 'c2' && c.id !== 'c3'
                );
              }
            } catch (_) {}
          })
          .catch(() => {})
          .finally(() => {
            isDecrypting = false;
          });
      }
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter(
        (c: ClientRecord) => !c.isSample && c.id !== 'c1' && c.id !== 'c2' && c.id !== 'c3'
      );
      cachedClients = filtered;
      return filtered;
    }
  } catch (err) {
    console.error('Error reading registered clients:', err);
  }
  return cachedClients || [];
}

/**
 * Get all registered client licenses asynchronously (decodes ENC: encrypted storage)
 */
export async function getRegisteredClientsAsync(): Promise<ClientRecord[]> {
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (!raw) return [];

    let jsonStr = raw;
    if (raw.startsWith('ENC:')) {
      jsonStr = await decryptData(raw.slice(4));
    }

    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter(
        (c: ClientRecord) => !c.isSample && c.id !== 'c1' && c.id !== 'c2' && c.id !== 'c3'
      );
      cachedClients = filtered;
      return filtered;
    }
  } catch (err) {
    console.error('Error reading registered clients async:', err);
  }
  return cachedClients || [];
}

/**
 * Save client list to localStorage with encryption
 */
export async function saveRegisteredClients(clients: ClientRecord[]): Promise<void> {
  cachedClients = clients;
  try {
    const json = JSON.stringify(clients);
    try {
      const encrypted = await encryptData(json);
      localStorage.setItem(CLIENTS_STORAGE_KEY, `ENC:${encrypted}`);
    } catch (_) {
      localStorage.setItem(CLIENTS_STORAGE_KEY, json);
    }
  } catch (err) {
    console.error('Error saving registered clients:', err);
  }
}

/**
 * Find a client by their license token
 */
export function getClientByToken(token: string): ClientRecord | null {
  if (!token || typeof token !== 'string') return null;
  const cleanToken = token.trim();
  const clients = getRegisteredClients();
  return clients.find((c) => c.token.toUpperCase() === cleanToken.toUpperCase()) || null;
}

export type TokenVerificationResult =
  | {
      valid: true;
      client: ClientRecord;
      isAlreadyDeployed: boolean;
      message: string;
    }
  | {
      valid: false;
      reason: 'MISSING_TOKEN' | 'INVALID_FORMAT' | 'NOT_FOUND' | 'REVOKED';
      message: string;
      token?: string;
    };

/**
 * Verify license token against registered database and security rules
 */
export function verifyLicenseToken(token?: string | null): TokenVerificationResult {
  // 1. Check if token is present
  if (!token || !token.trim()) {
    return {
      valid: false,
      reason: 'MISSING_TOKEN',
      message: 'Token lisensi tidak ditemukan di URL. Akses ke portal onboarding memerlukan tautan token lisensi resmi.',
    };
  }

  const cleanToken = token.trim().toUpperCase();

  // 2. Check token prefix & basic format
  if (!cleanToken.startsWith('NGABSEN-')) {
    return {
      valid: false,
      reason: 'INVALID_FORMAT',
      token: cleanToken,
      message: `Format token "${cleanToken}" tidak valid. Token resmi akugawe harus diawali dengan 'NGABSEN-'.`,
    };
  }

  // 3. Check registered clients database
  const client = getClientByToken(cleanToken);

  if (client) {
    return {
      valid: true,
      client,
      isAlreadyDeployed: client.status === 'active',
      message: client.status === 'active'
        ? `Lisensi untuk "${client.name}" sudah pernah diaktivasi.`
        : `Token lisensi resmi terverifikasi untuk "${client.name}".`,
    };
  }

  // 4. Token has NGABSEN- prefix but is NOT registered in the system (e.g. NGABSEN-OPIKMAUL-3333)
  return {
    valid: false,
    reason: 'NOT_FOUND',
    token: cleanToken,
    message: `Token "${cleanToken}" tidak terdaftar di database lisensi akugawe. Pastikan Anda menggunakan tautan aktivasi resmi yang diberikan oleh penjual.`,
  };
}

/**
 * Verify license token against remote Cloudflare D1 database with local storage fallback
 */
export async function verifyLicenseTokenRemote(token?: string | null): Promise<TokenVerificationResult> {
  if (!token || !token.trim()) {
    return {
      valid: false,
      reason: 'MISSING_TOKEN',
      message: 'Token lisensi tidak ditemukan di URL. Akses ke portal onboarding memerlukan tautan token lisensi resmi.',
    };
  }

  const cleanToken = token.trim().toUpperCase();

  if (!cleanToken.startsWith('NGABSEN-')) {
    return {
      valid: false,
      reason: 'INVALID_FORMAT',
      token: cleanToken,
      message: `Format token "${cleanToken}" tidak valid. Token resmi akugawe harus diawali dengan 'NGABSEN-'.`,
    };
  }

  // 1. Coba verifikasi ke Remote Edge Serverless Database (/api/orders?token=...)
  try {
    const res = await fetch(`/api/orders?token=${encodeURIComponent(cleanToken)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.valid && data.client) {
        return {
          valid: true,
          client: data.client,
          isAlreadyDeployed: data.isAlreadyDeployed,
          message: data.message,
        };
      }
    }
  } catch (_) {
    // Jika offline atau dev mode lokal, fallback ke verifikasi lokal
  }

  // 2. Fallback ke database lokal (localStorage) dengan decoding ENC:
  const clients = await getRegisteredClientsAsync();
  const client = clients.find((c) => c.token.toUpperCase() === cleanToken) || null;

  if (client) {
    return {
      valid: true,
      client,
      isAlreadyDeployed: client.status === 'active',
      message: client.status === 'active'
        ? `Lisensi untuk "${client.name}" sudah pernah diaktivasi.`
        : `Token lisensi resmi terverifikasi untuk "${client.name}".`,
    };
  }

  return verifyLicenseToken(cleanToken);
}

/**
 * Mark a client as active/deployed (Syncs with Cloudflare D1 API)
 */
export async function markClientDeployed(
  token: string,
  urls: {
    deployedUrl: string;
    customDomainDashboard?: string;
    customDomainApp?: string;
    isCompleted?: boolean;
  }
): Promise<boolean> {
  const cleanToken = token.trim().toUpperCase();

  // 1. Kirim update ke Remote Database Cloudflare D1
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mark_deployed',
        token: cleanToken,
        deployedUrl: urls.deployedUrl,
        customDomainDashboard: urls.customDomainDashboard,
        customDomainApp: urls.customDomainApp,
      }),
    });
  } catch (_) {}

  // 2. Update database lokal
  try {
    const clients = await getRegisteredClientsAsync();
    let found = false;
    const updated = clients.map((c) => {
      if (c.token.toUpperCase() === cleanToken) {
        found = true;
        return {
          ...c,
          status: 'active' as const,
          deployedUrl: urls.deployedUrl,
          customDomainDashboard: urls.customDomainDashboard || c.customDomainDashboard,
          customDomainApp: urls.customDomainApp || c.customDomainApp,
          isCompleted: urls.isCompleted !== undefined ? urls.isCompleted : c.isCompleted,
        };
      }
      return c;
    });

    if (found) {
      await saveRegisteredClients(updated);
      return true;
    }
  } catch (err) {
    console.error('Error updating client status:', err);
  }
  return false;
}
