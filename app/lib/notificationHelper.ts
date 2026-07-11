import { ref, push, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";

interface NotificationPayload {
  centerId: string;
  userId: string;
  title: string;
  message: string;
  type: "requisition" | "approval" | "fulfillment" | "stock-alert";
  relatedId: string;
  link?: string;
}

export async function createNotification(payload: NotificationPayload) {
  const { centerId, userId, title, message, type, relatedId, link } = payload;
  const refPath = `doza_centers/${centerId}/notifications`;
  const newRef = push(ref(db, refPath));
  await update(newRef, {
    userId,
    title,
    message,
    type,
    relatedId,
    link: link || "",
    read: false,
    createdAt: new Date().toISOString(),
  });
  logger.info(`Notification created for ${userId}: ${title} (${relatedId})`);
}
