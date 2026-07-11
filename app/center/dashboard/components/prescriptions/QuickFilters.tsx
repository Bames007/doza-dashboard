import {
  Filter,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface QuickFiltersProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedDateRange: string;
  onDateRangeChange: (range: string) => void;
  selectedPrescriber: string;
  onPrescriberChange: (prescriber: string) => void;
}

export const QuickFilters = ({
  selectedStatus,
  onStatusChange,
  selectedDateRange,
  onDateRangeChange,
  selectedPrescriber,
  onPrescriberChange,
}: QuickFiltersProps) => {
  const statusOptions = [
    {
      value: "all",
      label: "All Status",
      icon: Filter,
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "ACTIVE",
      label: "Active",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800",
    },
    {
      value: "COMPLETED",
      label: "Completed",
      icon: CheckCircle,
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "EXPIRED",
      label: "Expired",
      icon: XCircle,
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "CANCELLED",
      label: "Cancelled",
      icon: XCircle,
      color: "bg-red-100 text-red-800",
    },
  ];

  const dateRanges = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "all", label: "All Time" },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200/60">
      <div className="flex flex-wrap gap-2">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => {
            const Icon = status.icon;
            return (
              <button
                key={status.value}
                onClick={() => onStatusChange(status.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  selectedStatus === status.value
                    ? `${status.color} border border-gray-300`
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{status.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Range */}
        <select
          value={selectedDateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm"
        >
          {dateRanges.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>

        {/* Prescriber Filter */}
        <select
          value={selectedPrescriber}
          onChange={(e) => onPrescriberChange(e.target.value)}
          className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Prescribers</option>
          <option value="DOCTOR">Doctors</option>
          <option value="NURSE">Nurses</option>
          <option value="PHARMACIST">Pharmacists</option>
        </select>
      </div>
    </div>
  );
};
