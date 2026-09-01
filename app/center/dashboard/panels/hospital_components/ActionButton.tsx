// app/center/dashboard/components/patient_panel/ActionButton.tsx
import { cn } from "@/app/utils/utils";

const styles: any = {
  blue: "border-blue-300 text-blue-800 bg-blue-50/50 hover:bg-blue-100 focus:ring-2 focus:ring-blue-500",
  emerald:
    "border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-500",
  purple:
    "border-purple-300 text-purple-800 bg-purple-50/50 hover:bg-purple-100 focus:ring-2 focus:ring-purple-500",
  amber:
    "border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100 focus:ring-2 focus:ring-amber-500",
  rose: "border-rose-300 text-rose-800 bg-rose-50/50 hover:bg-rose-100 focus:ring-2 focus:ring-rose-500",
  slate:
    "border-slate-300 text-slate-800 bg-slate-50/50 hover:bg-slate-100 focus:ring-2 focus:ring-slate-500",
};

interface ActionButtonProps {
  onClick: () => void;
  label: string;
  color: keyof typeof styles;
}

export default function ActionButton({
  onClick,
  label,
  color,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-all active:scale-95 focus:outline-none",
        styles[color],
      )}
    >
      {label}
    </button>
  );
}
