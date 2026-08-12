type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowMs: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();
const maxStoredEntries = 10_000;

function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const address = forwardedFor?.split(",")[0]?.trim();

  return address || request.headers.get("x-real-ip") || "unknown";
}

function pruneExpiredEntries(now: number) {
  if (rateLimitStore.size < maxStoredEntries) {
    return;
  }

  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function checkRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  const key = `${options.scope}:${getClientAddress(request)}`;
  const existing = rateLimitStore.get(key);

  pruneExpiredEntries(now);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimit(request: Request, scope: string) {
  rateLimitStore.delete(`${scope}:${getClientAddress(request)}`);
}
