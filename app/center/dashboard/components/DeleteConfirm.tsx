// components/DeleteConfirm.tsx
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { poppins } from "@/app/utils/constants";

export default function DeleteConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl"
      >
        <div className="flex items-center space-x-2 text-amber-600 mb-4">
          <AlertCircle className="w-6 h-6" />
          <h3 className={`text-lg font-bold ${poppins.className}`}>
            Confirm Deletion
          </h3>
        </div>
        <p className={`text-gray-600 mb-6 ${poppins.className}`}>
          Are you sure you want to delete this item? This action cannot be
          undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}
