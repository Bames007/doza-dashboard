// app/center/dashboard/components/patient_panel/PatientSkeleton.tsx

export default function PatientSkeleton() {
  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col gap-3">
        <div className="h-9 w-28 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
        <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse sm:w-36" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="h-3 w-16 bg-slate-200 rounded" />
                <div className="h-7 w-10 bg-slate-200 rounded mt-1" />
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 animate-pulse h-96" />
        <div className="bg-white rounded-2xl border border-slate-200/80 animate-pulse h-96" />
        <div className="bg-white rounded-2xl border border-slate-200/80 animate-pulse h-96" />
      </div>
    </div>
  );
}
