// app/center/dashboard/components/patient_panel/StatCard.tsx
import { cn } from "@/app/utils/utils";
import { bebasNeue } from "@/app/utils/constants";

interface StatCardProps {
  label: string;
  value: number;
  icon: any;
  color: "emerald" | "blue" | "purple" | "rose" | "amber" | "teal";
}

const colorMap: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  rose: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            {label}
          </p>
          <p
            className={cn(
              "text-2xl font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            {value}
          </p>
        </div>
        <div className={cn("p-2.5 rounded-xl", colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
