// app/lib/offlineQueue.ts

const QUEUE_KEY = "offline_queue";

export function addToOfflineQueue(action: {
  url: string;
  method: string;
  body: any;
  userId: string;
}) {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  queue.push({ ...action, timestamp: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getOfflineQueue() {
  return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
}
