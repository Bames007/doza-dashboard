"use client";

import { Eye } from "lucide-react";

interface EyeExamScheduleProps {
  exams: Array<{
    id: string;
    patient: string;
    time: string;
    doctor: string;
    type: string;
  }>;
  loading: boolean;
}

export default function EyeExamSchedule({
  exams,
  loading,
}: EyeExamScheduleProps) {
  if (loading) {
    return <div className="bg-white rounded-xl p-6 animate-pulse h-48" />;
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Upcoming Eye Exams</h3>
      </div>
      <div className="space-y-3">
        {exams.slice(0, 5).map((exam) => (
          <div
            key={exam.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {exam.patient}
              </p>
              <p className="text-xs text-gray-500">{exam.type}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900">
                {exam.time}
              </span>
              <p className="text-xs text-gray-500">{exam.doctor}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
