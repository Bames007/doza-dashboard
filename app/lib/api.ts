// app/lib/api.ts

import logger from "@/app/utils/logger";

/**
 * Enhanced fetch wrapper with:
 * - Authentication headers (x-user-id, x-user-role, x-user-name)
 * - Automatic retry with exponential backoff
 * - Cache fallback (localStorage) with TTL
 * - Offline detection
 * - Mutation queue for offline operations
 * - Consistent error handling
 * - Support for explicit userId (overrides localStorage)
 */

type FetchOptions = RequestInit & {
  /** Cache key for localStorage (optional) */
  cacheKey?: string;
  /** Cache TTL in milliseconds (default: 5 min) */
  cacheDuration?: number;
  /** Max retries (default: 3) */
  maxRetries?: number;
  /** Headers to include (will be merged with auth headers) */
  headers?: Record<string, string>;
  /** Explicit userId – if provided, overrides localStorage */
  userId?: string;
};

// ─── Auth Headers ─────────────────────────────────────────────────────

function getAuthHeaders(userId?: string): Record<string, string> {
  const finalUserId =
    userId ||
    (typeof window !== "undefined" ? localStorage.getItem("userId") : "") ||
    "";
  const userName =
    typeof window !== "undefined" ? localStorage.getItem("userName") : "";
  const userRole =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : "";
  return {
    "x-user-id": finalUserId,
    "x-user-name": userName || "",
    "x-user-role": userRole || "",
  };
}

// ─── Cache Helpers ──────────────────────────────────────────────────

const CACHE_PREFIX = "api_cache_";
const MAX_QUEUE_SIZE = 50;
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(url: string, params?: Record<string, any>): string {
  const key = params ? `${url}?${JSON.stringify(params)}` : url;
  return CACHE_PREFIX + btoa(key);
}

function getCachedData(cacheKey: string): any | null {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > DEFAULT_CACHE_TTL) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedData(cacheKey: string, data: any): void {
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch (e) {
    // localStorage full or unavailable
  }
}

// ─── Offline Queue ──────────────────────────────────────────────────

const QUEUE_KEY = "offline_mutation_queue";

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  userId?: string;
  timestamp: number;
}

function getQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setQueue(queue: QueuedRequest[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function addToQueue(request: Omit<QueuedRequest, "id" | "timestamp">): void {
  const queue = getQueue();
  if (queue.length >= MAX_QUEUE_SIZE) {
    logger.warn(`Offline queue full (${MAX_QUEUE_SIZE}), dropping oldest`);
    queue.shift();
  }
  queue.push({
    ...request,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    timestamp: Date.now(),
  });
  setQueue(queue);
}

function removeFromQueue(id: string): void {
  const queue = getQueue().filter((item) => item.id !== id);
  setQueue(queue);
}

export async function processOfflineQueue(): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;

  logger.info(`Processing ${queue.length} queued offline requests`);

  for (const request of queue) {
    try {
      const { url, method, body, headers, userId } = request;
      await fetchWithRetry(
        url,
        {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        },
        3,
        userId,
      );

      // fetchWithRetry resolves only on 2xx — success
      removeFromQueue(request.id);
      logger.info(`Queued request succeeded: ${method} ${url}`);
    } catch (error: any) {
      const message = error?.message || "";

      // Permanent failure (4xx) — URL/payload is wrong, will never succeed.
      // Drop from queue so it stops retrying forever.
      if (/^HTTP 4\d\d/.test(message)) {
        removeFromQueue(request.id);
        logger.warn(
          `Queued request dropped (permanent): ${request.method} ${request.url} — ${message}`,
        );
      } else {
        // Network error, timeout, or 5xx — keep in queue for next attempt
        logger.warn(
          `Queued request failed (will retry): ${request.method} ${request.url} — ${message}`,
        );
      }
    }
  }
}
// ─── Internal fetch with retry ─────────────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  userId?: string,
): Promise<Response> {
  let lastError: Error;

  // Check offline before attempting
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("Device is offline");
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const headers = new Headers(options.headers || {});
      const authHeaders = getAuthHeaders(userId);
      for (const [key, value] of Object.entries(authHeaders)) {
        if (value) headers.set(key, value);
      }
      if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = response.statusText;
        try {
          const json = await response.clone().json();
          errorMsg = json.error || errorMsg;
        } catch (_) {
          // ignore
        }
        throw new Error(`HTTP ${response.status}: ${errorMsg}`);
      }

      return response;
    } catch (error: any) {
      lastError = error;
      const isClientError = error.message?.includes("HTTP 4");
      if (isClientError || attempt === maxRetries - 1) break;
      const delay = 1000 * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError!;
}

// ─── Public API ────────────────────────────────────────────────────

export async function apiFetch<T = any>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const {
    cacheKey,
    cacheDuration = DEFAULT_CACHE_TTL,
    maxRetries = 3,
    userId,
    ...fetchOptions
  } = options;

  const key =
    cacheKey ||
    getCacheKey(
      url,
      typeof fetchOptions.body === "object" && fetchOptions.body !== null
        ? (fetchOptions.body as Record<string, any>)
        : undefined,
    );

  // 1. Try cache (stale-while-revalidate)
  if (key && typeof window !== "undefined") {
    const cached = getCachedData(key);
    if (cached) {
      logger.debug(`Using cached data for ${key}`);
      return cached;
    }
  }

  // 2. If offline, throw (no cache available)
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("Device is offline and no cached data is available.");
  }

  // 3. Attempt network request
  try {
    const response = await fetchWithRetry(
      url,
      fetchOptions,
      maxRetries,
      userId,
    );
    const json = await response.json();
    const result = json.success !== undefined ? json.data : json;

    if (key && typeof window !== "undefined") {
      setCachedData(key, result);
    }

    return result;
  } catch (error) {
    // 4. Network error: try cache again (expired or not)
    if (key && typeof window !== "undefined") {
      const cached = getCachedData(key);
      if (cached) {
        logger.warn(`Using stale cache for ${key} due to network error`);
        return cached;
      }
    }
    throw error;
  }
}

export async function apiPost<T = any>(
  url: string,
  body: any,
  options?: FetchOptions,
): Promise<T> {
  const fetchOptions = {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  };

  // If offline, queue the request
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    addToQueue({
      url,
      method: "POST",
      body,
      headers: options?.headers,
      userId: options?.userId,
    });
    // Still throw so the caller knows it's not immediate
    throw new Error("Device is offline – request queued for later sync.");
  }

  return apiFetch<T>(url, fetchOptions);
}

export async function apiPut<T = any>(
  url: string,
  body: any,
  options?: FetchOptions,
): Promise<T> {
  const fetchOptions = {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    addToQueue({
      url,
      method: "PUT",
      body,
      headers: options?.headers,
      userId: options?.userId,
    });
    throw new Error("Device is offline – request queued for later sync.");
  }

  return apiFetch<T>(url, fetchOptions);
}

export async function apiDelete<T = any>(
  url: string,
  options?: FetchOptions,
): Promise<T> {
  const fetchOptions = {
    ...options,
    method: "DELETE",
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    addToQueue({
      url,
      method: "DELETE",
      headers: options?.headers,
      userId: options?.userId,
    });
    throw new Error("Device is offline – request queued for later sync.");
  }

  return apiFetch<T>(url, fetchOptions);
}
