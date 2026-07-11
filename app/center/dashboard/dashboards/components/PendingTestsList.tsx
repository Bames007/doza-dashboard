import { motion } from "framer-motion";
import { LabTest } from "../../types/lab";
import { poppins } from "@/app/utils/constants";
import { Clock } from "lucide-react";

export default function PendingTestsList({
  tests,
  loading,
}: {
  tests: LabTest[];
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
        className={`text-lg font-semibold mb-4 flex items-center text-gray-600 gap-2 ${poppins.className}`}
      >
        <Clock className="w-5 h-5 text-amber-600" />
        Pending Tests
      </h2>
      {tests.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No pending tests</p>
      ) : (
        <ul className="space-y-3">
          {tests.slice(0, 5).map((test) => (
            <li
              key={test.id}
              className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0"
            >
              <div>
                <p className={`font-medium text-gray-900 ${poppins.className}`}>
                  {test.patientName}
                </p>
                <p className="text-sm text-gray-500">{test.testType}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  test.status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {test.status}
              </span>
            </li>
          ))}
          {tests.length > 5 && (
            <p className="text-xs text-gray-400 text-center mt-2">
              +{tests.length - 5} more
            </p>
          )}
        </ul>
      )}
    </motion.div>
  );
}
