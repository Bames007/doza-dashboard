import { getDatabase, ref, push, set } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { app } from "../utils/firebaseConfig";
import { MedicRegistrationData } from "./type";

export const submitMedicRegistration = async (data: MedicRegistrationData) => {
  const db = getDatabase(app);
  const storage = getStorage(app);

  try {
    // Upload documents first
    const uploadedDocuments = await Promise.all(
      data.credentials.documents.map(async (doc) => {
        if (doc.fileUrl.startsWith("blob:")) {
          // Convert blob to file and upload
          const response = await fetch(doc.fileUrl);
          const blob = await response.blob();
          const fileRef = storageRef(
            storage,
            `documents/${data.personalInfo.email}/${doc.type}_${Date.now()}`
          );
          const snapshot = await uploadBytes(fileRef, blob);
          const downloadURL = await getDownloadURL(snapshot.ref);
          return { ...doc, fileUrl: downloadURL };
        }
        return doc;
      })
    );

    // Prepare final data
    const registrationData = {
      ...data,
      credentials: {
        ...data.credentials,
        documents: uploadedDocuments,
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: "pending" as const,
      verified: false,
    };

    // Save to database
    const medicsRef = ref(db, "doza_medics");
    const newMedicRef = push(medicsRef);
    await set(newMedicRef, {
      ...registrationData,
      id: newMedicRef.key,
    });

    return newMedicRef.key;
  } catch (error) {
    console.error("Error submitting medic registration:", error);
    throw error;
  }
};
