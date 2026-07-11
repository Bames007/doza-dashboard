import { Users, Pill, Clock, Bell, Printer, Activity } from "lucide-react";

interface StatisticsCardsProps {
  totalPrescriptions: number;
  activePrescriptions: number;
  dozaUsersCount: number;
  remindersSent: number;
  slipsPrinted: number;
  avgResponseTime: string;
}

export const StatisticsCards = ({
  totalPrescriptions,
  activePrescriptions,
  dozaUsersCount,
  remindersSent,
  slipsPrinted,
  avgResponseTime,
}: StatisticsCardsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Total Prescriptions */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-xl font-bold text-gray-900">
              {totalPrescriptions}
            </p>
          </div>
          <div className="p-2 bg-purple-100 rounded-lg">
            <Pill className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">Prescriptions</p>
      </div>

      {/* Active Prescriptions */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Active</p>
            <p className="text-xl font-bold text-gray-900">
              {activePrescriptions}
            </p>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <Activity className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">Current</p>
      </div>

      {/* Doza Users */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Doza Users</p>
            <p className="text-xl font-bold text-gray-900">{dozaUsersCount}</p>
          </div>
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">Registered</p>
      </div>

      {/* Reminders Sent */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Reminders</p>
            <p className="text-xl font-bold text-gray-900">{remindersSent}</p>
          </div>
          <div className="p-2 bg-amber-100 rounded-lg">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">Sent</p>
      </div>

      {/* Slips Printed */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Slips</p>
            <p className="text-xl font-bold text-gray-900">{slipsPrinted}</p>
          </div>
          <div className="p-2 bg-gray-100 rounded-lg">
            <Printer className="w-5 h-5 text-gray-600" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">Printed</p>
      </div>

      {/* Avg Response Time */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Avg Time</p>
            <p className="text-xl font-bold text-gray-900">{avgResponseTime}</p>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">per patient</p>
      </div>
    </div>
  );
};
