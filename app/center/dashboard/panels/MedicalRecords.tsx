// app/center/dashboard/panels/MedicalRecordsPanel.tsx
"use client";

import { motion } from "framer-motion";
import { Search, FileText, User, Calendar } from "lucide-react";

export default function MedicalRecordsPanel() {
  const records = [
    {
      id: 1,
      patient: "John Smith",
      recordId: "MR-001",
      lastVisit: "2024-01-15",
      condition: "Hypertension",
      doctor: "Dr. Sarah Johnson",
    },
    {
      id: 2,
      patient: "Emma Wilson",
      recordId: "MR-002",
      lastVisit: "2024-01-14",
      condition: "Diabetes",
      doctor: "Dr. Michael Chen",
    },
    {
      id: 3,
      patient: "Robert Brown",
      recordId: "MR-003",
      lastVisit: "2024-01-13",
      condition: "Asthma",
      doctor: "Dr. Sarah Johnson",
    },
    {
      id: 4,
      patient: "Lisa Davis",
      recordId: "MR-004",
      lastVisit: "2024-01-12",
      condition: "Arthritis",
      doctor: "Dr. James Wilson",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600">
            Access and manage patient medical records
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search medical records..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
            <option>All Conditions</option>
            <option>Hypertension</option>
            <option>Diabetes</option>
            <option>Asthma</option>
            <option>Arthritis</option>
          </select>
        </div>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Patient Records
          </h2>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {records.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {record.patient}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{record.doctor}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{record.lastVisit}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono text-sm text-gray-500">
                    {record.recordId}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {record.condition}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
