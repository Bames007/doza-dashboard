// app/utils/apiWrapper.ts
import { offlineService } from "./offlineService";
import logger from "@/app/utils/logger";

export interface ApiOptions {
  userId: string;
  centerId: string;
  retryCount?: number;
  offlineFirst?: boolean;
}

export class ApiWrapper {
  private userId: string;
  private centerId: string;

  constructor(options: ApiOptions) {
    this.userId = options.userId;
    this.centerId = options.centerId;
  }

  async get(endpoint: string, params?: Record<string, any>) {
    // ✅ Guard against SSR – window may be undefined
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = new URL(endpoint, origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "x-user-id": this.userId,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.warn(
        { endpoint, error },
        "Network request failed, trying offline",
      );
      return this.getFromOffline(endpoint);
    }
  }

  async post(endpoint: string, data: any, offlineFirst = true): Promise<any> {
    if (!offlineService.isConnected() || offlineFirst) {
      const operationId = await offlineService.queueOperation({
        type: "CREATE",
        endpoint,
        method: "POST",
        data: { ...data, userId: this.userId, centerId: this.centerId },
        centerId: this.centerId,
        userId: this.userId,
      });

      const localProduct = {
        id: `local_${Date.now()}`,
        data: { ...data, userId: this.userId, centerId: this.centerId },
        isSynced: false,
        lastUpdated: Date.now(),
        localId: `local_${Date.now()}`,
      };

      offlineService.saveProductLocally(localProduct);

      logger.info({ operationId, endpoint }, "Saved offline, queued for sync");
      return {
        success: true,
        data: { ...data, id: localProduct.localId, _local: true },
        message: "Saved offline. Will sync when connection is restored.",
        operationId,
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": this.userId,
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      logger.warn(
        { endpoint, error },
        "Online POST failed, falling back to offline",
      );
      return this.post(endpoint, data, true);
    }
  }

  async put(endpoint: string, data: any, offlineFirst = true): Promise<any> {
    const productId = data.id || endpoint.split("/").pop();

    if (!offlineService.isConnected() || offlineFirst) {
      const operationId = await offlineService.queueOperation({
        type: "UPDATE",
        endpoint,
        method: "PUT",
        data: { ...data, userId: this.userId, centerId: this.centerId },
        centerId: this.centerId,
        userId: this.userId,
      });

      const existingProduct = offlineService.getLocalProduct(productId);
      const localProduct = {
        id: productId,
        data: {
          ...(existingProduct?.data || {}),
          ...data,
          userId: this.userId,
          centerId: this.centerId,
          updatedAt: new Date().toISOString(),
        },
        isSynced: false,
        lastUpdated: Date.now(),
      };

      offlineService.saveProductLocally(localProduct);

      logger.info({ operationId, endpoint, productId }, "Update saved offline");
      return {
        success: true,
        data: { ...data, _local: true, _pendingUpdate: true },
        message: "Update saved offline.",
        operationId,
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": this.userId,
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      logger.warn(
        { endpoint, error },
        "Online PUT failed, falling back to offline",
      );
      return this.put(endpoint, data, true);
    }
  }

  async delete(endpoint: string, offlineFirst = true): Promise<any> {
    if (!offlineService.isConnected() || offlineFirst) {
      const operationId = await offlineService.queueOperation({
        type: "DELETE",
        endpoint,
        method: "DELETE",
        data: { userId: this.userId, centerId: this.centerId },
        centerId: this.centerId,
        userId: this.userId,
      });

      logger.info({ operationId, endpoint }, "Delete queued for offline sync");
      return {
        success: true,
        message: "Delete queued for offline sync.",
        operationId,
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "x-user-id": this.userId,
        },
      });

      return await response.json();
    } catch (error) {
      logger.warn(
        { endpoint, error },
        "Online DELETE failed, falling back to offline",
      );
      return this.delete(endpoint, true);
    }
  }

  private async getFromOffline(endpoint: string) {
    const segments = endpoint.split("/");
    const productId = segments[segments.length - 1];

    if (productId && productId !== "inventory") {
      const product = offlineService.getLocalProduct(productId);
      if (product) {
        return {
          success: true,
          data: product.data,
          _local: true,
        };
      }
    } else {
      const localProducts = offlineService.getLocalProductsByCenter(
        this.centerId,
      );
      return {
        success: true,
        data: {
          products: localProducts.map((p) => p.data),
          _local: true,
          _partial: !offlineService.isConnected(),
        },
      };
    }

    logger.warn({ endpoint }, "Not found in offline storage");
    throw new Error("Not found in offline storage");
  }

  getOfflineStats() {
    return {
      pendingOperations: offlineService.getPendingOperations().length,
      localProducts: offlineService.getLocalProductsCount(),
      isOnline: offlineService.isConnected(),
    };
  }

  forceSync() {
    return offlineService.syncAll();
  }
}
