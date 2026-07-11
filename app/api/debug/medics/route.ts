// // app/api/debug/medics/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { ref, get } from "firebase/database";
// import { db } from "@/app/utils/firebaseConfig";

// export async function GET(request: NextRequest) {
//   try {
//     const medicsRef = ref(db, "doza_medics");
//     const snapshot = await get(medicsRef);

//     console.log("Debug: Checking doza_medics database...");

//     let allMedics = [];

//     if (snapshot.exists()) {
//       const medics = snapshot.val();
//       console.log("Debug: Medics data structure:", medics);

//       if (medics) {
//         allMedics = Object.entries(medics).map(([id, medic]: [string, any]) => ({
//           id,
//           email: medic?.personalInfo?.email,
//           name: `${medic?.personalInfo?.firstName || ""} ${medic?.personalInfo?.lastName || ""}`.trim(),
//           status: medic?.status,
//           verified: medic?.verified,
//           points: medic?.points || 0,
//         }));
//       }
//     } else {
//       console.log("Debug: No medics found in database");
//     }

//     return NextResponse.json({
//       success: true,
//       count: allMedics.length,
//       medics: allMedics,
//       message: `Found ${allMedics.length} medics in database`,
//     });
//   } catch (error: any) {
//     console.error("Debug error:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message,
//         stack: error.stack
//       },
//       { status: 500 }
//     );
//   }
// }
