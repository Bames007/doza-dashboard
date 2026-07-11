// app/utils/stockAdjustment.ts
import { ref, get, update, push } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";

export async function adjustStockForSale(
  centerId: string,
  userId: string,
  saleItems: any[],
  saleId: string,
  customerName?: string,
  isOfflineSync: boolean = false
) {
  const updates: any = {};

  for (const item of saleItems) {
    const productId = item.productId || item.id;
    const requestedQuantity = Number(item.quantity) || 0;

    if (!productId || requestedQuantity <= 0) continue;

    const productRef = ref(
      db,
      `doza_centers/${centerId}/products/${productId}`
    );
    const productSnapshot = await get(productRef);

    if (!productSnapshot.exists()) {
      console.warn(`Product ${productId} not found for stock adjustment`);
      continue;
    }

    const product = productSnapshot.val();
    const currentStock = Number(product.quantity) || 0;
    const newQuantity = currentStock - requestedQuantity;

    // Update product stock
    updates[`doza_centers/${centerId}/products/${productId}/quantity`] =
      newQuantity;
    updates[`doza_centers/${centerId}/products/${productId}/updatedAt`] =
      new Date().toISOString();
    updates[`doza_centers/${centerId}/products/${productId}/updatedBy`] =
      userId;

    // Create inventory audit log
    const auditLog = {
      productId,
      centerId,
      userId,
      action: "STOCK_OUT",
      previousQuantity: currentStock,
      newQuantity,
      difference: -requestedQuantity,
      reason: isOfflineSync ? "Offline sale sync" : "Sale",
      reference: `SALE_${saleId}`,
      notes: `Sold to ${customerName || "Customer"}${
        isOfflineSync ? " (offline)" : ""
      }`,
      timestamp: new Date().toISOString(),
    };

    const auditRef = ref(db, `doza_centers/${centerId}/inventoryAudits`);
    const newAuditKey = push(auditRef).key;
    updates[`doza_centers/${centerId}/inventoryAudits/${newAuditKey}`] =
      auditLog;
  }

  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates);
    console.log(`✅ Stock adjusted for sale ${saleId}`);
    return true;
  }

  return false;
}
