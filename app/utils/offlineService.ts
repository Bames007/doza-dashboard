// app/utils/offlineService.ts
import logger from "@/app/utils/logger";

interface PendingOperation {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE" | "AUDIT";
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  data: any;
  timestamp: number;
  retries: number;
  status: "pending" | "failed" | "retrying";
  centerId: string;
  userId: string;
}

interface OfflineProduct {
  id: string;
  data: any;
  isSynced: boolean;
  lastUpdated: number;
  localId?: string;
}

class OfflineService {
  private static instance: OfflineService;
  private isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  private syncQueue: PendingOperation[] = [];
  private localProducts: Map<string, OfflineProduct> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private isSyncing = false;
  private lastSyncTime = 0;
  private readonly SYNC_COOLDOWN = 5000;
  private syncDebounceTimer: NodeJS.Timeout | null = null;
  private readonly SYNC_DEBOUNCE_DELAY = 2000;
  private processingQueue = false;
  private syncRequested = false;

  private constructor() {
    this.init();
  }

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private init() {
    this.loadFromStorage();

    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        logger.info("Device came online");
        this.isOnline = true;
        this.debounceSync(3000);
      });

      window.addEventListener("offline", () => {
        logger.info("Device went offline");
        this.isOnline = false;
        this.cancelPendingSync();
      });

      // Start sync interval only in browser
      this.syncInterval = setInterval(() => {
        if (this.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
          const now = Date.now();
          if (now - this.lastSyncTime > this.SYNC_COOLDOWN) {
            this.debounceSync();
          }
        }
      }, 60000);
    }
  }

  private cancelPendingSync() {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }
  }

  private debounceSync(delay?: number) {
    this.cancelPendingSync();
    if (this.syncRequested) return;
    this.syncRequested = true;
    const syncDelay = delay || this.SYNC_DEBOUNCE_DELAY;
    this.syncDebounceTimer = setTimeout(() => {
      this.syncRequested = false;
      if (this.isOnline && !this.isSyncing) {
        this.syncAll();
      }
    }, syncDelay);
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;

    try {
      const queue = localStorage.getItem("offline_sync_queue");
      const products = localStorage.getItem("offline_products");

      if (queue) {
        const parsedQueue = JSON.parse(queue);
        this.syncQueue = this.deduplicateOperations(parsedQueue);
        logger.info(`Loaded ${this.syncQueue.length} pending operations`);
      }

      if (products) {
        const parsed = JSON.parse(products);
        Object.entries(parsed).forEach(([key, value]) => {
          this.localProducts.set(key, value as OfflineProduct);
        });
        logger.info(`Loaded ${this.localProducts.size} local products`);
      }
    } catch (error) {
      logger.error(error, "Failed to load offline data");
    }
  }

  private deduplicateOperations(
    operations: PendingOperation[],
  ): PendingOperation[] {
    const seen = new Map<string, PendingOperation>();
    const result: PendingOperation[] = [];
    operations.sort((a, b) => a.timestamp - b.timestamp);
    for (const op of operations) {
      const key = this.getOperationKey(op);
      if (!seen.has(key) || seen.get(key)!.timestamp < op.timestamp) {
        seen.set(key, op);
      }
    }
    seen.forEach((op) => result.push(op));
    return result;
  }

  private getOperationKey(operation: PendingOperation): string {
    if (operation.endpoint.includes("/sales")) {
      const saleId = operation.data.id || operation.data.saleId;
      return `sale_${saleId}_${operation.type}`;
    } else if (operation.endpoint.includes("/products")) {
      const productId = operation.data.id || operation.data.productId;
      return `product_${productId}_${operation.type}`;
    }
    return `${operation.endpoint}_${operation.method}_${JSON.stringify(operation.data)}`;
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;

    try {
      const productsObj = Object.fromEntries(this.localProducts);
      localStorage.setItem(
        "offline_sync_queue",
        JSON.stringify(this.syncQueue),
      );
      localStorage.setItem("offline_products", JSON.stringify(productsObj));
    } catch (error) {
      logger.error(error, "Failed to save offline data");
    }
  }

  async queueOperation(
    operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "status"
    >,
  ) {
    let data = operation.data;
    if (operation.endpoint.includes("/sales") && operation.method === "POST") {
      logger.info("Marking sale operation as offline sync");
      if (!data.saleId && !data.id) {
        data.saleId = `offline_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      data = { ...data, _local: true, _offline: true, syncing: true };
    }

    const op: PendingOperation = {
      ...operation,
      data,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
      status: "pending",
    };

    logger.debug("Queuing operation: %o", {
      id: op.id,
      endpoint: op.endpoint,
      method: op.method,
      dataSummary: {
        itemsCount: data.items?.length || 0,
        totalAmount: data.totalAmount,
        hasLocalFlag: data._local,
        hasSaleId: !!data.saleId,
        hasId: !!data.id,
      },
    });

    const existingIndex = this.syncQueue.findIndex(
      (existingOp) =>
        this.getOperationKey(existingOp) === this.getOperationKey(op),
    );
    if (existingIndex !== -1) {
      logger.info("Updating existing operation in queue");
      this.syncQueue[existingIndex] = {
        ...this.syncQueue[existingIndex],
        data: op.data,
        timestamp: op.timestamp,
        retries: 0,
        status: "pending",
      };
    } else {
      this.syncQueue.push(op);
    }

    this.saveToStorage();
    this.debounceSync();
    return op.id;
  }

  async processQueue() {
    if (!this.isOnline) {
      logger.info("Device offline, skipping queue processing");
      return;
    }
    if (this.syncQueue.length === 0) {
      logger.info("Sync queue is empty");
      return;
    }
    if (this.processingQueue) {
      logger.info("Queue processing already in progress");
      return;
    }

    this.processingQueue = true;
    logger.info(`Processing ${this.syncQueue.length} operations`);

    const queueCopy = [...this.syncQueue].sort((a, b) => {
      if (a.endpoint.includes("/sales") && !b.endpoint.includes("/sales"))
        return -1;
      if (!a.endpoint.includes("/sales") && b.endpoint.includes("/sales"))
        return 1;
      return a.timestamp - b.timestamp;
    });

    const failedOperations: PendingOperation[] = [];

    for (const operation of queueCopy) {
      try {
        logger.debug(
          `Processing operation ${operation.id}: ${operation.method} ${operation.endpoint}`,
        );
        await this.delay(1000);
        await this.executeOperation(operation);
        this.syncQueue = this.syncQueue.filter((op) => op.id !== operation.id);
        logger.info(`Operation ${operation.id} completed successfully`);
        this.saveToStorage();
      } catch (error: any) {
        logger.error(
          error,
          `Operation ${operation.id} failed: ${error.message}`,
        );
        operation.retries++;
        operation.status =
          operation.retries >= this.maxRetries ? "failed" : "retrying";
        if (operation.retries >= this.maxRetries) {
          logger.error(
            error,
            `Operation ${operation.id} failed after ${this.maxRetries} retries`,
          );
          this.syncQueue = this.syncQueue.filter(
            (op) => op.id !== operation.id,
          );
          failedOperations.push(operation);
        } else {
          const index = this.syncQueue.findIndex(
            (op) => op.id === operation.id,
          );
          if (index !== -1) this.syncQueue[index] = operation;
        }
        this.saveToStorage();
      }
    }

    if (failedOperations.length > 0) {
      logger.warn(`${failedOperations.length} operations failed permanently`);
      this.saveFailedOperations(failedOperations);
    }

    this.processingQueue = false;
    logger.info(
      `Queue processing completed. Remaining: ${this.syncQueue.length}`,
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private saveFailedOperations(operations: PendingOperation[]) {
    try {
      localStorage.setItem(
        "offline_failed_operations",
        JSON.stringify(operations),
      );
    } catch (error) {
      logger.error(error, "Failed to save failed operations");
    }
  }

  private async executeOperation(operation: PendingOperation) {
    const { endpoint, method, data, userId } = operation;
    logger.debug(`Sending ${method} request to: ${endpoint}`);
    logger.debug({
      message: "Request data (summary):",
      itemsCount: data.items?.length || 0,
      totalAmount: data.totalAmount,
      customerName: data.customerName,
      hasLocalFlag: data._local,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: method !== "GET" ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After") || "60";
        throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorBody = await response.json();
          logger.error("Server error response:", errorBody);
          errorMessage = errorBody.error || errorBody.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          logger.error(`Server error text: ${errorText}`);
          errorMessage = `${errorMessage} - ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      logger.info(
        `Request successful: ${result.message || "Operation completed"}`,
      );
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      logger.error(error, `Request failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async syncAll() {
    if (this.isSyncing) {
      logger.info("Sync already in progress, skipping");
      return;
    }
    if (!this.isOnline) {
      logger.info("Device offline, cannot sync");
      return;
    }
    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_COOLDOWN) {
      logger.info("Too soon after last sync, skipping");
      return;
    }

    logger.info("Starting full sync...");
    this.isSyncing = true;
    this.lastSyncTime = now;

    try {
      await this.processQueue();
      const unsyncedProducts = Array.from(this.localProducts.values()).filter(
        (p) => !p.isSynced,
      );
      if (unsyncedProducts.length > 0) {
        logger.info(`Syncing ${unsyncedProducts.length} local products...`);
        for (let i = 0; i < unsyncedProducts.length; i++) {
          const product = unsyncedProducts[i];
          try {
            await this.delay(2000);
            await this.syncProduct(product);
          } catch (error) {
            logger.error(error, "Failed to sync product");
          }
        }
      }
      logger.info("Full sync completed");
    } catch (error) {
      logger.error(error, "Full sync failed");
    } finally {
      this.isSyncing = false;
      this.saveToStorage();
    }
  }

  private async syncProduct(product: OfflineProduct) {
    try {
      if (product.localId) {
        const productData = product.data;
        if (!productData.name || !productData.category) {
          logger.warn("Product missing required fields, marking as synced");
          product.isSynced = true;
          this.saveToStorage();
          return;
        }
        if (!productData.centerId || productData.centerId === "undefined") {
          logger.warn("Invalid centerId, marking product as synced");
          product.isSynced = true;
          this.saveToStorage();
          return;
        }

        const response = await fetch(
          `/api/centers/${productData.centerId}/inventory`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": productData.userId,
            },
            body: JSON.stringify({
              name: productData.name,
              category: productData.category,
              quantity: Number(productData.quantity) || 0,
              unitPrice: Number(productData.unitPrice) || 0,
              sku: productData.sku || `SKU_${Date.now()}`,
              ...(productData.description && {
                description: productData.description,
              }),
              ...(productData.supplier && { supplier: productData.supplier }),
              ...(productData.barcode && { barcode: productData.barcode }),
            }),
          },
        );

        if (response.ok) {
          const result = await response.json();
          product.isSynced = true;
          product.id = result.data?.id || productData.id;
          delete product.localId;
          logger.info(`Product synced: ${productData.name}`);
        } else if (response.status === 429) {
          logger.warn("Rate limited while syncing product, will retry later");
        } else if (response.status === 400) {
          logger.warn("Invalid product data, marking as synced");
          product.isSynced = true;
        } else {
          logger.warn(`Product sync failed with status: ${response.status}`);
        }
      }
    } catch (error) {
      logger.error(error, "Failed to sync product");
    } finally {
      this.saveToStorage();
    }
  }

  saveProductLocally(product: OfflineProduct) {
    this.localProducts.set(product.id, product);
    this.saveToStorage();
    this.debounceSync(5000);
  }

  getLocalProduct(productId: string): OfflineProduct | undefined {
    return this.localProducts.get(productId);
  }

  getLocalProductsByCenter(centerId: string): OfflineProduct[] {
    return Array.from(this.localProducts.values()).filter(
      (product) => product.data.centerId === centerId,
    );
  }

  isConnected(): boolean {
    return this.isOnline;
  }

  getPendingOperations(): PendingOperation[] {
    return this.syncQueue;
  }

  getLocalProductsCount(): number {
    return this.localProducts.size;
  }

  clearQueue() {
    this.syncQueue = [];
    this.saveToStorage();
    logger.info("Cleared sync queue");
  }

  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      isOnline: this.isOnline,
      pendingOperations: this.syncQueue.length,
      localProducts: this.localProducts.size,
      lastSyncTime: this.lastSyncTime,
      nextSyncAvailable: this.lastSyncTime + this.SYNC_COOLDOWN,
    };
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.cancelPendingSync();
  }
}

export const offlineService = OfflineService.getInstance();
