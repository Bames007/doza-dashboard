import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );

  const activeRef = ref(db, `doza_centers/${centerId}/activeSessions`);
  const snap = await get(activeRef);
  const data = snap.exists() ? snap.val() : {};
  return NextResponse.json({ success: true, data });
}
