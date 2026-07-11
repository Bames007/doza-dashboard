// app/center/dashboard/panels/DoctorsPanel.tsx
"use client";

import { motion } from "framer-motion";
import { Stethoscope, Plus, Phone, Mail, Calendar } from "lucide-react";

export default function DoctorsPanel() {
  const doctors = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
      email: "sarah.johnson@hospital.com",
      phone: "+1-555-0101",
      status: "active",
      appointments: 8,
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      specialty: "Neurology",
      email: "michael.chen@hospital.com",
      phone: "+1-555-0102",
      status: "active",
      appointments: 6,
    },
    {
      id: 3,
      name: "Dr. Emily Rodriguez",
      specialty: "Pediatrics",
      email: "emily.rodriguez@hospital.com",
      phone: "+1-555-0103",
      status: "on-leave",
      appointments: 0,
    },
    {
      id: 4,
      name: "Dr. James Wilson",
      specialty: "Orthopedics",
      email: "james.wilson@hospital.com",
      phone: "+1-555-0104",
      status: "active",
      appointments: 5,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-gray-600">Manage medical staff and specialists</p>
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Doctor</span>
        </button>
      </div>

      {/* Doctors List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Medical Staff</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {doctor.name}
                    </h3>
                    <p className="text-sm text-gray-600">{doctor.specialty}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{doctor.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{doctor.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{doctor.appointments} appointments today</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      doctor.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {doctor.status}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Profile
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
