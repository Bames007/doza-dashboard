import { motion } from "framer-motion";
import { Equipment } from "../../panels/EquipmentPanel";
import { poppins } from "@/app/utils/constants";
import { Thermometer } from "lucide-react";

export default function EquipmentStatus({
  equipment,
  loading,
}: {
  equipment: Equipment[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
    >
      <h2
        className={`text-lg font-semibold mb-4 text-gray-600 flex items-center gap-2 ${poppins.className}`}
      >
        <Thermometer className="w-5 h-5 text-blue-600" />
        Equipment Status
      </h2>
      {equipment.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No equipment found</p>
      ) : (
        <ul className="space-y-3">
          {equipment.slice(0, 5).map((eq) => (
            <li
              key={eq.id}
              className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0"
            >
              <div>
                <p className={`font-medium text-gray-900 ${poppins.className}`}>
                  {eq.name}
                </p>
                <p className="text-sm text-gray-500">
                  {eq.model || eq.serialNumber}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  eq.status === "operational"
                    ? "bg-green-100 text-green-700"
                    : eq.status === "maintenance"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {eq.status.replace("_", " ")}
              </span>
            </li>
          ))}
          {equipment.length > 5 && (
            <p className="text-xs text-gray-400 text-center mt-2">
              +{equipment.length - 5} more
            </p>
          )}
        </ul>
      )}
    </motion.div>
  );
}
