import { Env, jsonResponse } from './_db';

const memoryRateLimitCache = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  return 'unknown';
}

export async function checkRateLimit(
  env: Env,
  request: Request,
  prefix: string,
  maxAttempts: number = 5,
  windowSeconds: number = 600
): Promise<{ allowed: boolean; response?: Response }> {
  const ip = getClientIp(request);
  const now = Date.now();
  const key = `rl:${prefix}:${ip}`;

  // 1. Coba via Cloudflare KV jika tersedia
  if (env.CONFIG_KV) {
    try {
      const current = await env.CONFIG_KV.get(key);
      let count = 1;
      if (current) {
        count = parseInt(current, 10) + 1;
        if (count > maxAttempts) {
          const excess = count - maxAttempts;
          const backoff = Math.min(windowSeconds, Math.max(5, Math.pow(2, excess) * 5));
          return {
            allowed: false,
            response: jsonResponse(
              {
                ok: false,
                error: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba kembali.',
              },
              429,
              { 'Retry-After': String(backoff) }
            ),
          };
        }
      }
      await env.CONFIG_KV.put(key, count.toString(), { expirationTtl: windowSeconds });
      return { allowed: true };
    } catch (_) {}
  }

  // 2. In-Memory fallback untuk ketahanan jika KV belum dibind
  const entry = memoryRateLimitCache.get(key);
  if (!entry || now > entry.resetAt) {
    memoryRateLimitCache.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count > maxAttempts) {
    const remainingSeconds = Math.max(5, Math.ceil((entry.resetAt - now) / 1000));
    return {
      allowed: false,
      response: jsonResponse(
        {
          ok: false,
          error: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba kembali.',
        },
        429,
        { 'Retry-After': String(remainingSeconds) }
      ),
    };
  }

  return { allowed: true };
}
