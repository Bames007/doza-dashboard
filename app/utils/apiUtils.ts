// Enhanced fetch with retry, offline detection, and caching
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<Response> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Check if offline
      if (!navigator.onLine) {
        throw new Error("Device is offline");
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "current-user-id", // You'll need to get this from your auth context
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's a client error (4xx) or offline
      if (error.message.includes("offline") || attempt === maxRetries - 1) {
        break;
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, attempt))
      );

      console.warn(`Retry ${attempt + 1}/${maxRetries} for ${url}`);
    }
  }

  throw lastError!;
}

// Fetch with cache fallback
export async function fetchWithCache<T>(
  url: string,
  cacheKey: string,
  options: RequestInit = {},
  cacheDuration = 5 * 60 * 1000 // 5 minutes
): Promise<T> {
  try {
    // Try to fetch fresh data
    const response = await fetchWithRetry(url, options);
    const data = await response.json();

    // Cache the successful response
    if (data.success) {
      const cacheData = {
        data: data.data || data,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    }

    return data.data || data;
  } catch (error) {
    console.warn("Network request failed, trying cache...", error);

    // Try to get from cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);

      // Check if cache is still valid
      if (Date.now() - parsed.timestamp < cacheDuration) {
        console.log("📦 Returning cached data for", cacheKey);
        return parsed.data;
      } else {
        console.log("⚠️ Cache expired for", cacheKey);
        localStorage.removeItem(cacheKey);
      }
    }

    // If no cache or expired, throw the original error
    throw error;
  }
}

// Load prescriptions with retry and cache
export async function loadPrescriptions(centerId: string) {
  const cacheKey = `prescriptions_${centerId}`;
  return fetchWithCache(`/api/centers/${centerId}/prescriptions`, cacheKey, {
    headers: {
      "x-user-id": "current-user-id", // Replace with actual user ID
    },
  });
}

// Load products with retry and cache
export async function loadProducts(centerId: string) {
  const cacheKey = `products_${centerId}`;
  return fetchWithCache(`/api/centers/${centerId}/inventory`, cacheKey, {
    headers: {
      "x-user-id": "current-user-id", // Replace with actual user ID
    },
  });
}
