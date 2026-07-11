"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  X,
  ExternalLink,
  Copy,
} from "lucide-react";

interface DrugDuplicateCheckProps {
  duplicate: {
    drugId: string;
    confidence: number;
    message: string;
  };
  onClose: () => void;
}

const DrugDuplicateCheck: React.FC<DrugDuplicateCheckProps> = ({
  duplicate,
  onClose,
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-red-600";
    if (confidence >= 80) return "text-amber-600";
    return "text-yellow-600";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 90) return "High similarity - Likely duplicate";
    if (confidence >= 80) return "Medium similarity - Please review";
    return "Low similarity - May be different";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl"
    >
      <div className="flex items-start gap-3">
        <div className="bg-amber-100 p-2 rounded-full">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-amber-900">
              Potential Duplicate Found
            </h3>
            <button
              onClick={onClose}
              className="text-amber-600 hover:text-amber-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-amber-800 mb-3">
            A drug with similar information already exists in our database.
            Please review before proceeding.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-amber-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-amber-900">
                  Confidence Score
                </span>
                <span
                  className={`text-lg font-bold ${getConfidenceColor(
                    duplicate.confidence
                  )}`}
                >
                  {duplicate.confidence}%
                </span>
              </div>
              <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    duplicate.confidence >= 90
                      ? "bg-red-500"
                      : duplicate.confidence >= 80
                      ? "bg-amber-500"
                      : "bg-yellow-500"
                  }`}
                  style={{ width: `${duplicate.confidence}%` }}
                />
              </div>
              <p className="text-xs text-amber-600 mt-1">
                {getConfidenceText(duplicate.confidence)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  window.open(`/drugs/${duplicate.drugId}`, "_blank");
                }}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Existing Drug
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 font-medium"
              >
                Continue Anyway
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                Submission Rules
              </span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>
                • Duplicates with ≥90% similarity will be automatically rejected
              </li>
              <li>• Duplicates with 80-89% similarity require manual review</li>
              <li>
                • You can continue if you believe this is a different drug
              </li>
              <li>• False submissions may result in point deductions</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DrugDuplicateCheck;
