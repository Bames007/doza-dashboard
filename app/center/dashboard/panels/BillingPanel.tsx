// app/center/dashboard/panels/BillingPanel.tsx
"use client";

import { motion } from "framer-motion";
import { DollarSign, Download, Eye, Calendar, User } from "lucide-react";

export default function BillingPanel() {
  const bills = [
    {
      id: 1,
      patient: "John Smith",
      amount: 150.0,
      date: "2024-01-15",
      status: "paid",
      service: "Consultation",
    },
    {
      id: 2,
      patient: "Emma Wilson",
      amount: 89.5,
      date: "2024-01-14",
      status: "pending",
      service: "Lab Test",
    },
    {
      id: 3,
      patient: "Robert Brown",
      amount: 245.75,
      date: "2024-01-13",
      status: "paid",
      service: "Procedure",
    },
    {
      id: 4,
      patient: "Lisa Davis",
      amount: 120.0,
      date: "2024-01-12",
      status: "overdue",
      service: "Medication",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600">Manage patient billing and invoices</p>
        </div>
      </div>

      {/* Billing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">$12,458</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">$1,245</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">$560</p>
              <p className="text-sm text-gray-600">Overdue</p>
            </div>
            <DollarSign className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">128</p>
              <p className="text-sm text-gray-600">Invoices</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Billing List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bills</h2>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {bills.map((bill, index) => (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {bill.patient}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{bill.date}</span>
                      </span>
                      <span>{bill.service}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${bill.amount}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bill.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : bill.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {bill.status}
                    </span>
                    <button className="text-blue-600 hover:text-blue-800">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-800">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
