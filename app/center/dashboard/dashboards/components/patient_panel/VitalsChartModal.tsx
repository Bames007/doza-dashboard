// app/center/dashboard/dashboards/components/patient_panel/VitalsChartModal.tsx

"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  X,
  HeartPulse,
  Activity,
  Thermometer,
  Weight,
  Ruler,
  BarChart3,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  ScatterChart as ScatterChartIcon,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface VitalsHistoryEntry {
  timestamp: string;
  recordedBy: string;
  recordedById: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  bloodSugar?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  [key: string]: any;
}

interface VitalsChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  vitalsHistory: VitalsHistoryEntry[];
}

type ChartType = "line" | "bar" | "area" | "scatter";

const VITAL_CONFIG = {
  bloodPressureSystolic: {
    label: "Systolic BP",
    unit: "mmHg",
    color: "#ef4444",
    icon: Activity,
  },
  bloodPressureDiastolic: {
    label: "Diastolic BP",
    unit: "mmHg",
    color: "#dc2626",
    icon: Activity,
  },
  heartRate: {
    label: "Heart Rate",
    unit: "bpm",
    color: "#8b5cf6",
    icon: HeartPulse,
  },
  temperature: {
    label: "Temperature",
    unit: "°C",
    color: "#f59e0b",
    icon: Thermometer,
  },
  oxygenSaturation: {
    label: "O₂ Saturation",
    unit: "%",
    color: "#3b82f6",
    icon: Activity,
  },
  respiratoryRate: {
    label: "Respiratory Rate",
    unit: "/min",
    color: "#10b981",
    icon: Activity,
  },
  bloodSugar: {
    label: "Blood Sugar",
    unit: "mg/dL",
    color: "#ec4899",
    icon: Activity,
  },
  weight: { label: "Weight", unit: "kg", color: "#8b5cf6", icon: Weight },
  bmi: { label: "BMI", unit: "", color: "#14b8a6", icon: Ruler },
};

type VitalsKey = keyof typeof VITAL_CONFIG;

const CHART_TYPES: { value: ChartType; label: string; icon: any }[] = [
  { value: "line", label: "Line", icon: LineChartIcon },
  { value: "bar", label: "Bar", icon: BarChart3 },
  { value: "area", label: "Area", icon: AreaChartIcon },
  { value: "scatter", label: "Scatter", icon: ScatterChartIcon },
];

export default function VitalsChartModal({
  isOpen,
  onClose,
  patientName,
  vitalsHistory,
}: VitalsChartModalProps) {
  const [selectedVitals, setSelectedVitals] = useState<VitalsKey[]>([
    "heartRate",
    "bloodPressureSystolic",
    "temperature",
    "oxygenSaturation",
  ]);
  const [chartType, setChartType] = useState<ChartType>("line");

  const chartData = useMemo(() => {
    return vitalsHistory
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
      .map((entry) => {
        const formatted: any = {
          timestamp: new Date(entry.timestamp).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          fullTimestamp: entry.timestamp,
        };
        Object.keys(VITAL_CONFIG).forEach((key) => {
          const k = key as VitalsKey;
          if (entry[k] !== undefined && entry[k] !== null) {
            formatted[k] = entry[k];
          }
        });
        return formatted;
      });
  }, [vitalsHistory]);

  const toggleVital = (key: VitalsKey) => {
    setSelectedVitals((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const selectAll = () => {
    setSelectedVitals(Object.keys(VITAL_CONFIG) as VitalsKey[]);
  };

  const deselectAll = () => {
    setSelectedVitals([]);
  };

  // Compute summary stats for selected vitals
  const summaryStats = useMemo(() => {
    const stats: Record<
      string,
      { latest: number; min: number; max: number; avg: number; trend: number }
    > = {};
    selectedVitals.forEach((key) => {
      const values = chartData
        .map((d) => d[key])
        .filter((v) => v !== undefined && v !== null) as number[];
      if (values.length === 0) return;
      const latest = values[values.length - 1];
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const trend =
        values.length > 1
          ? values[values.length - 1] - values[values.length - 2]
          : 0;
      stats[key] = { latest, min, max, avg, trend };
    });
    return stats;
  }, [selectedVitals, chartData]);

  const renderChart = () => {
    if (chartData.length === 0 || selectedVitals.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
          <Activity className="w-12 h-12 text-slate-300 mb-3" />
          <p className="font-medium text-slate-700">
            {chartData.length === 0
              ? "No vitals recorded"
              : "Select at least one vital sign"}
          </p>
          <p className="text-sm">
            {chartData.length === 0
              ? "This patient has no vitals history."
              : "Toggle vitals above to display."}
          </p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    const renderLines = () =>
      selectedVitals.map((key) => {
        const config = VITAL_CONFIG[key];
        const isRightAxis = [
          "bloodPressureDiastolic",
          "temperature",
          "oxygenSaturation",
          "respiratoryRate",
        ].includes(key);
        return (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={config.label}
            stroke={config.color}
            strokeWidth={2}
            dot={{ r: 4, fill: config.color }}
            activeDot={{ r: 6 }}
            yAxisId={isRightAxis ? "right" : "left"}
          />
        );
      });

    const renderBars = () =>
      selectedVitals.map((key) => {
        const config = VITAL_CONFIG[key];
        const isRightAxis = [
          "bloodPressureDiastolic",
          "temperature",
          "oxygenSaturation",
          "respiratoryRate",
        ].includes(key);
        return (
          <Bar
            key={key}
            dataKey={key}
            name={config.label}
            fill={config.color}
            yAxisId={isRightAxis ? "right" : "left"}
          />
        );
      });

    const renderAreas = () =>
      selectedVitals.map((key) => {
        const config = VITAL_CONFIG[key];
        const isRightAxis = [
          "bloodPressureDiastolic",
          "temperature",
          "oxygenSaturation",
          "respiratoryRate",
        ].includes(key);
        return (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            name={config.label}
            stroke={config.color}
            fill={config.color}
            fillOpacity={0.2}
            yAxisId={isRightAxis ? "right" : "left"}
          />
        );
      });

    const renderScatter = () =>
      selectedVitals.map((key) => {
        const config = VITAL_CONFIG[key];
        const isRightAxis = [
          "bloodPressureDiastolic",
          "temperature",
          "oxygenSaturation",
          "respiratoryRate",
        ].includes(key);
        return (
          <Scatter
            key={key}
            name={config.label}
            data={chartData}
            fill={config.color}
            yAxisId={isRightAxis ? "right" : "left"}
          />
        );
      });

    const renderAxis = () => (
      <>
        <XAxis
          dataKey="timestamp"
          tick={{ fontSize: 10, fill: "#64748b" }}
          interval="preserveStartEnd"
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 10, fill: "#64748b" }}
          domain={["auto", "auto"]}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 10, fill: "#64748b" }}
          domain={["auto", "auto"]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
          labelStyle={{ fontWeight: 600, color: "#1e293b" }}
          formatter={(value, name) => {
            const config = VITAL_CONFIG[name as VitalsKey];
            return config ? `${value} ${config.unit}` : value;
          }}
        />
        <Legend
          wrapperStyle={{
            fontSize: 12,
            color: "#1e293b",
            paddingTop: 10,
          }}
        />
      </>
    );

    switch (chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            {renderAxis()}
            {renderLines()}
          </LineChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            {renderAxis()}
            {renderBars()}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            {renderAxis()}
            {renderAreas()}
          </AreaChart>
        );
      case "scatter":
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 10, fill: "#64748b" }}
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: "#64748b" }}
              domain={["auto", "auto"]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: "#64748b" }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              labelStyle={{ fontWeight: 600, color: "#1e293b" }}
              formatter={(value, name) => {
                const config = VITAL_CONFIG[name as VitalsKey];
                return config ? `${value} ${config.unit}` : value;
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: 12,
                color: "#1e293b",
                paddingTop: 10,
              }}
            />
            {renderScatter()}
          </ScatterChart>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vitals-chart-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
          <div>
            <h2
              id="vitals-chart-title"
              className={cn(
                "text-2xl font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              Vitals History – {patientName}
            </h2>
            <p className="text-sm text-slate-500">
              {vitalsHistory.length} records • {chartData.length} data points
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Controls Row: Chart Type + Select All/Deselect All */}
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              {CHART_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setChartType(type.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                      chartType === type.value
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:bg-white/50",
                    )}
                    aria-pressed={chartType === type.value}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {type.label}
                  </button>
                );
              })}
            </div>
            <div className="flex-1" />
            <div className="flex gap-1.5">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors focus:ring-2 focus:ring-emerald-500"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:ring-2 focus:ring-emerald-500"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Vital Toggles */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(VITAL_CONFIG).map(([key, config]) => {
              const k = key as VitalsKey;
              const isSelected = selectedVitals.includes(k);
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => toggleVital(k)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                    isSelected
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200/50"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                  aria-pressed={isSelected}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <ResponsiveContainer width="100%" height={400}>
              {renderChart()}
            </ResponsiveContainer>
          </div>

          {/* Summary Table */}
          {Object.keys(summaryStats).length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Data Summary
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                        Vital
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                        Latest
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                        Min
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                        Max
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                        Avg
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(summaryStats).map(([key, stats]) => {
                      const config = VITAL_CONFIG[key as VitalsKey];
                      if (!config) return null;
                      return (
                        <tr key={key} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {config.label}
                          </td>
                          <td className="px-3 py-2 font-bold text-slate-900">
                            {stats.latest} {config.unit}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {stats.min} {config.unit}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {stats.max} {config.unit}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {stats.avg.toFixed(1)} {config.unit}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs font-medium",
                                stats.trend > 0.1
                                  ? "text-emerald-700"
                                  : stats.trend < -0.1
                                    ? "text-rose-700"
                                    : "text-slate-500",
                              )}
                            >
                              {stats.trend > 0.1
                                ? "↑"
                                : stats.trend < -0.1
                                  ? "↓"
                                  : "→"}
                              {Math.abs(stats.trend).toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
