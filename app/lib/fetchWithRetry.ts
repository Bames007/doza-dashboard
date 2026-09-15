// app/lib/fetchWithRetry.ts

// ─── Types ───────────────────────────────────────────────────────────
export interface FetchWithCacheOptions extends RequestInit {
  /** Override cache duration in ms. Default: 5 min */
  cacheDuration?: number;
  /** Skip cache entirely (always fetch fresh) */
  skipCache?: boolean;
  /** Skip retry logic */
  skipRetry?: boolean;
  /** Abort signal timeout in ms. Default: 15_000 */
  timeoutMs?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// ─── SSR-safe storage ────────────────────────────────────────────────
const isBrowser = typeof window !== "undefined";

const safeStorage = {
  get(key: string): string | null {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // QuotaExceededError or private mode — silently ignore
    }
  },
  remove(key: string): void {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

// ─── Auth header injection ───────────────────────────────────────────
// Set this once at app startup from your auth provider.
let authHeaderProvider: (() => Record<string, string>) | null = null;

export function setAuthHeaderProvider(
  provider: () => Record<string, string>,
): void {
  authHeaderProvider = provider;
}

function getAuthHeaders(): Record<string, string> {
  return authHeaderProvider ? authHeaderProvider() : {};
}

// ─── Retry helper ────────────────────────────────────────────────────
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  timeoutMs = 15_000,
): Promise<Response> {
  let lastError: Error = new Error("Fetch failed before first attempt");

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      if (isBrowser && !navigator.onLine) {
        throw new Error("Device is offline");
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
          ...options.headers,
        },
      });

      clearTimeout(timeout);

      // Retry only on server errors and rate limits
      if (!response.ok) {
        if (RETRYABLE_STATUS.has(response.status) && attempt < maxRetries - 1) {
          throw new Error(`HTTP ${response.status}: retryable`);
        }
        // Non-retryable — return the response so callers can read the body
        return response;
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeout);
      lastError = error;

      const isOffline = error?.message?.includes("offline");
      const isAbort = error?.name === "AbortError";

      if (isOffline || attempt === maxRetries - 1) {
        break;
      }

      const delay = 1000 * Math.pow(2, attempt);
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[fetchWithRetry] attempt ${attempt + 1}/${maxRetries} failed for ${url} — retrying in ${delay}ms`,
          { reason: isAbort ? "timeout" : error?.message },
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ─── Cache wrapper ───────────────────────────────────────────────────
function readCache<T>(key: string, maxAgeMs: number): T | null {
  const raw = safeStorage.get(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (
      typeof parsed?.timestamp !== "number" ||
      Date.now() - parsed.timestamp > maxAgeMs
    ) {
      safeStorage.remove(key);
      return null;
    }
    return parsed.data;
  } catch {
    // Corrupted cache — drop it
    safeStorage.remove(key);
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  try {
    safeStorage.set(key, JSON.stringify(entry));
  } catch {
    // ignore quota errors
  }
}

export async function fetchWithCache<T>(
  url: string,
  cacheKey: string,
  options: FetchWithCacheOptions = {},
): Promise<T> {
  const {
    cacheDuration = 5 * 60 * 1000,
    skipCache = false,
    skipRetry = false,
    timeoutMs = 15_000,
    ...fetchOptions
  } = options;

  try {
    const response = skipRetry
      ? await fetch(url, {
          ...fetchOptions,
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
            ...fetchOptions.headers,
          },
        })
      : await fetchWithRetry(url, fetchOptions, 3, timeoutMs);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = await response.json();
    const data: T = payload?.data ?? payload;

    if (!skipCache) {
      writeCache(cacheKey, data);
    }

    return data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[fetchWithCache] network failed for ${cacheKey}`, error);
    }

    if (!skipCache) {
      const cached = readCache<T>(cacheKey, cacheDuration);
      if (cached !== null) {
        return cached;
      }
    }

    throw error;
  }
}

// ─── Domain helpers ──────────────────────────────────────────────────
export async function loadPrescriptions<T = unknown>(
  centerId: string,
  userId: string,
): Promise<T> {
  return fetchWithCache<T>(
    `/api/centers/${centerId}/prescriptions`,
    `prescriptions_${centerId}_${userId}`,
    {
      headers: { "x-user-id": userId },
    },
  );
}

export async function loadProducts<T = unknown>(
  centerId: string,
  userId: string,
): Promise<T> {
  return fetchWithCache<T>(
    `/api/centers/${centerId}/inventory`,
    `products_${centerId}_${userId}`,
    {
      headers: { "x-user-id": userId },
    },
  );
}
