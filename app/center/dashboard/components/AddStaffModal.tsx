// "use client";

// import { motion } from "framer-motion";
// import {
//   X,
//   User,
//   ChevronRight,
//   ChevronLeft,
//   Mail,
//   Phone,
//   Calendar,
//   BriefcaseMedical,
//   GraduationCap,
//   CheckCircle,
//   Building,
//   Clock,
//   AlertCircle,
//   Sparkles,
//   Shield,
//   BadgeCheck,
// } from "lucide-react";
// import { useState } from "react";
// import { Center, User as UserType } from "@/app/center/type";
// import { bebasNeue, poppins } from "@/app/utils/constants";
// import { cn } from "@/app/utils/utils";

// interface AddStaffModalProps {
//   onClose: () => void;
//   onStaffAdded: (staff: any) => void;
//   center: Center;
//   user: UserType;
// }

// interface FormData {
//   personalInfo: {
//     fullName: string;
//     email: string;
//     phone: string;
//     position: string;
//   };
//   professional: {
//     role: string;
//     department: string;
//     employmentType: string;
//     startDate: string;
//   };
//   status: "active" | "inactive" | "on_leave";
// }

// const roles = [
//   "Doctor",
//   "Nurse",
//   "Medical Officer",
//   "Consultant",
//   "Surgeon",
//   "Physician",
//   "Pediatrician",
//   "Gynecologist",
//   "Dentist",
//   "Pharmacist",
//   "Lab Technician",
//   "Radiologist",
//   "Physiotherapist",
//   "Dietician",
//   "Psychologist",
//   "Admin Manager",
//   "Receptionist",
//   "Accountant",
//   "IT Support",
//   "Cleaner",
//   "Security",
//   "Other",
// ];

// const departments = [
//   "General Medicine",
//   "Emergency",
//   "Surgery",
//   "Pediatrics",
//   "Gynecology",
//   "Dental",
//   "Pharmacy",
//   "Laboratory",
//   "Radiology",
//   "Physiotherapy",
//   "Administration",
//   "Support Services",
//   "Other",
// ];

// const employmentTypes = [
//   "full-time",
//   "part-time",
//   "contract",
//   "intern",
//   "volunteer",
// ];

// export default function AddStaffModal({
//   onClose,
//   onStaffAdded,
//   center,
//   user,
// }: AddStaffModalProps) {
//   const [currentStep, setCurrentStep] = useState(1);
//   const [formData, setFormData] = useState<FormData>({
//     personalInfo: {
//       fullName: "",
//       email: "",
//       phone: "",
//       position: "",
//     },
//     professional: {
//       role: "",
//       department: "",
//       employmentType: "full-time",
//       startDate: new Date().toISOString().split("T")[0],
//     },
//     status: "active",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleNext = () => {
//     if (currentStep < 3) setCurrentStep(currentStep + 1);
//   };

//   const handleBack = () => {
//     if (currentStep > 1) setCurrentStep(currentStep - 1);
//   };

//   const handlePersonalChange = (field: string, value: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       personalInfo: { ...prev.personalInfo, [field]: value },
//     }));
//   };

//   const handleProfessionalChange = (field: string, value: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       professional: { ...prev.professional, [field]: value },
//     }));
//   };

//   const isStepValid = () => {
//     switch (currentStep) {
//       case 1:
//         return (
//           formData.personalInfo.fullName.trim() &&
//           formData.personalInfo.email.trim() &&
//           formData.personalInfo.phone.trim() &&
//           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.email)
//         );
//       case 2:
//         return (
//           formData.professional.role.trim() &&
//           formData.professional.department.trim()
//         );
//       case 3:
//         return true;
//       default:
//         return false;
//     }
//   };

//   const handleSubmit = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const staffData = {
//         personalInfo: {
//           fullName: formData.personalInfo.fullName.trim(),
//           email: formData.personalInfo.email.trim().toLowerCase(),
//           phone: formData.personalInfo.phone.trim(),
//           position:
//             formData.personalInfo.position.trim() || formData.professional.role,
//         },
//         professional: {
//           role: formData.professional.role.trim(),
//           department: formData.professional.department.trim(),
//           employmentType: formData.professional.employmentType,
//           startDate: formData.professional.startDate,
//         },
//         isOwner: false,
//         status: formData.status,
//       };

//       onStaffAdded(staffData);
//     } catch (error: any) {
//       console.error("Error preparing staff data:", error);
//       setError(error.message);
//       setLoading(false);
//     }
//   };

//   const steps = [
//     { number: 1, title: "Personal Info" },
//     { number: 2, title: "Professional Info" },
//     { number: 3, title: "Review & Submit" },
//   ];

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };

//   return (
//     <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center z-50 safe-padding">
//       <motion.div
//         initial={{ opacity: 0, y: 40, scale: 0.96 }}
//         animate={{ opacity: 1, y: 0, scale: 1 }}
//         exit={{ opacity: 0, y: 40, scale: 0.96 }}
//         transition={{ duration: 0.3, ease: "easeOut" }}
//         className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* --- Header --- */}
//         <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 p-4 sm:p-6 flex items-center justify-between rounded-t-2xl z-10">
//           <div>
//             <h2
//               className={cn(
//                 "text-2xl font-bold text-slate-800",
//                 bebasNeue.className,
//               )}
//             >
//               Add New Staff Member
//             </h2>
//             <p className={cn("text-sm text-slate-500", poppins.className)}>
//               {center.centerName || "Medical Center"}
//             </p>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 active:scale-95"
//           >
//             <X className="w-5 h-5 text-slate-500" />
//           </button>
//         </div>

//         {/* --- Progress Steps --- */}
//         <div className="px-4 sm:px-6 py-4 border-b border-slate-200/80 bg-slate-50/50">
//           <div className="flex justify-between items-center">
//             {steps.map((step, index) => (
//               <div key={step.number} className="flex items-center">
//                 <div
//                   className={cn(
//                     "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
//                     currentStep >= step.number
//                       ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50"
//                       : "bg-slate-100 text-slate-400",
//                   )}
//                 >
//                   {currentStep > step.number ? (
//                     <CheckCircle className="w-5 h-5" />
//                   ) : (
//                     <span
//                       className={cn("font-bold text-sm", poppins.className)}
//                     >
//                       {step.number}
//                     </span>
//                   )}
//                 </div>
//                 {index < steps.length - 1 && (
//                   <div
//                     className={cn(
//                       "w-12 h-1 transition-all duration-300",
//                       currentStep > step.number
//                         ? "bg-emerald-500"
//                         : "bg-slate-200",
//                     )}
//                   />
//                 )}
//               </div>
//             ))}
//           </div>
//           <div className="flex justify-between mt-2">
//             {steps.map((step) => (
//               <span
//                 key={step.number}
//                 className={cn(
//                   "text-xs font-medium transition-all duration-300",
//                   currentStep >= step.number
//                     ? "text-emerald-600"
//                     : "text-slate-400",
//                   poppins.className,
//                 )}
//               >
//                 {step.title}
//               </span>
//             ))}
//           </div>
//         </div>

//         {/* --- Step Content --- */}
//         <div className="p-4 sm:p-6">
//           {currentStep === 1 && (
//             <motion.div
//               initial={{ opacity: 0, x: 16 }}
//               animate={{ opacity: 1, x: 0 }}
//               exit={{ opacity: 0, x: -16 }}
//               className="space-y-6"
//             >
//               <div className="flex items-center gap-3">
//                 <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
//                   <User className="w-5 h-5" />
//                 </div>
//                 <h3
//                   className={cn(
//                     "text-xl font-bold text-slate-800",
//                     bebasNeue.className,
//                   )}
//                 >
//                   Personal Information
//                 </h3>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label
//                     className={cn(
//                       "block text-sm font-semibold text-slate-700 mb-1.5",
//                       poppins.className,
//                     )}
//                   >
//                     Full Name *
//                   </label>
//                   <input
//                     type="text"
//                     className={cn(
//                       "w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200 text-sm text-slate-800 placeholder:text-slate-400",
//                       poppins.className,
//                     )}
//                     value={formData.personalInfo.fullName}
//                     onChange={(e) =>
//                       handlePersonalChange("fullName", e.target.value)
//                     }
//                     placeholder="Enter full name"
//                   />
//                 </div>
//                 <div>
//                   <label
//                     className={cn(
//                       "block text-sm font-semibold text-slate-700 mb-1.5",
//                       poppins.className,
//                     )}
//                   >
//                     Email *
//                   </label>
//                   <input
//                     type="email"
//                     className={cn(
//                       "w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200 text-sm text-slate-800 placeholder:text-slate-400",
//                       poppins.className,
//                     )}
//                     value={formData.personalInfo.email}
//                     onChange={(e) =>
//                       handlePersonalChange("email", e.target.value)
//                     }
//                     placeholder="Enter email address"
//                   />
//                 </div>
//                 <div>
//                   <label
//                     className={cn(
//                       "block text-sm font-semibold text-slate-700 mb-1.5",
//                       poppins.className,
//                     )}
//                   >
//                     Phone *
//                   </label>
//                   <input
//                     type="tel"
//                     className={cn(
//                       "w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200 text-sm text-slate-800 placeholder:text-slate-400",
//                       poppins.className,
//                     )}
//                     value={formData.personalInfo.phone}
//                     onChange={(e) =>
//                       handlePersonalChange("phone", e.target.value)
//                     }
//                     placeholder="Enter phone number"
//                   />
//                 </div>
//                 <div>
//                   <label
//                     className={cn(
//                       "block text-sm font-semibold text-slate-700 mb-1.5",
//                       poppins.className,
//                     )}
//                   >
//                     Position
//                   </label>
//                   <input
//                     type="text"
//                     className={cn(
//                       "w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200 text-sm text-slate-800 placeholder:text-slate-400",
//                       poppins.className,
//                     )}
//                     value={formData.personalInfo.position}
//                     onChange={(e) =>
//                       handlePersonalChange("position", e.target.value)
//                     }
//                     placeholder="e.g., Senior Doctor, Head Nurse"
//                   />
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {currentStep === 2 && (
//             <motion.div
//               initial={{ opacity: 0, x: 16 }}
//               animate={{ opacity: 1, x: 0 }}
//               exit={{ opacity: 0, x: -16 }}
//               className="space-y-6"
//             >
//               <div className="flex items-center gap-3">
//                 <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
//                   <BriefcaseMedical className="w-5 h-5" />
//                 </div>
//                 <h3
//                   className={cn(
//                     "text-xl font-bold text-slate-800",
//                     bebasNeue.className,
//                   )}
//                 >
//                   Professional Information
//                 </h3>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label
//                     className={cn(
//                       "block text-sm font-semibold text-slate-700 mb-1.5",
//                       poppins.className,
//                     )}
//                   >
//                     Role *
//                   </label>
//                   <select
//                     className={cn(
//                       "w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200 text-sm text-slate-800 appearance-none",
//                       poppins.className,
//                     )}
//                     value={formData.professional.role}
//                     onChange={(e) =>
//                       handleProfessionalChange("role", e.target.value)
//                     }
//                   >
//                     <option value="">Select Role</option>
//                     {roles.map((role) => (
//                       <option key={role} value={role}>
//                         {role}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div>
//                   <label
//                     className={cn(
//                       "block text-sm font-semibold text-slate-700 mb-1.5",
//                       poppins.className,
//                     )}
//                   >
//                     Department *
//                   </label>
//                   <select
//                     className={cn(
//                       "w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200 text-sm text-slate-800 appearance-none",
//                       poppins.className,
//                     )}
//                     value={formData.professional.department}
//                     onChange={(e) =>
//                       handleProfessionalChange("department", e.target.value)
//                     }
//                   >
//                     <option value="">Select Department</option>
//                     {departments.map((dept) => (
//                       <option key={dept} value={dept}>
//                         {dept}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div>
//                   <label
//                     className={cn(
//                       "block text-sm font-semibold text-slate-700 mb-1.5",
//                       poppins.className,
//                     )}
//                   >
//                     Employment Type
//                   </label>
//                   <select
//                     className={cn(
//                       "w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200 text-sm text-slate-800 appearance-none",
//                       poppins.className,
//                     )}
//                     value={formData.professional.employmentType}
//                     onChange={(e) =>
//                       handleProfessionalChange("employmentType", e.target.value)
//                     }
//                   >
//                     {employmentTypes.map((type) => (
//                       <option key={type} value={type}>
//                         {type.charAt(0).toUpperCase() + type.slice(1)}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div>
//                   <label
//                     className={cn(
//                       "block text-sm font-semibold text-slate-700 mb-1.5",
//                       poppins.className,
//                     )}
//                   >
//                     Start Date
//                   </label>
//                   <input
//                     type="date"
//                     className={cn(
//                       "w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200 text-sm text-slate-800",
//                       poppins.className,
//                     )}
//                     value={formData.professional.startDate}
//                     onChange={(e) =>
//                       handleProfessionalChange("startDate", e.target.value)
//                     }
//                     max={new Date().toISOString().split("T")[0]}
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label
//                   className={cn(
//                     "block text-sm font-semibold text-slate-700 mb-2",
//                     poppins.className,
//                   )}
//                 >
//                   Status
//                 </label>
//                 <div className="flex space-x-6">
//                   {["active", "on_leave"].map((status) => (
//                     <label
//                       key={status}
//                       className="flex items-center space-x-2.5 cursor-pointer"
//                     >
//                       <input
//                         type="radio"
//                         checked={formData.status === status}
//                         onChange={() =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             status: status as any,
//                           }))
//                         }
//                         className="w-4 h-4 text-emerald-600 focus:ring-emerald-500/40 border-slate-300"
//                       />
//                       <span
//                         className={cn(
//                           "text-sm text-slate-700",
//                           poppins.className,
//                         )}
//                       >
//                         {status === "active" ? "Active" : "On Leave"}
//                       </span>
//                     </label>
//                   ))}
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {currentStep === 3 && (
//             <motion.div
//               initial={{ opacity: 0, x: 16 }}
//               animate={{ opacity: 1, x: 0 }}
//               exit={{ opacity: 0, x: -16 }}
//               className="space-y-6"
//             >
//               <div className="flex items-center gap-3">
//                 <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
//                   <GraduationCap className="w-5 h-5" />
//                 </div>
//                 <h3
//                   className={cn(
//                     "text-xl font-bold text-slate-800",
//                     bebasNeue.className,
//                   )}
//                 >
//                   Review Information
//                 </h3>
//               </div>

//               <div className="bg-slate-50/80 rounded-2xl p-6 space-y-6 border border-slate-200/80">
//                 {/* Personal Info */}
//                 <div>
//                   <h4
//                     className={cn(
//                       "font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider",
//                       bebasNeue.className,
//                     )}
//                   >
//                     Personal Information
//                   </h4>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                     <div className="flex items-start gap-2.5">
//                       <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
//                       <div>
//                         <div className="text-slate-500 text-xs">Full Name</div>
//                         <div className="text-slate-800 font-semibold">
//                           {formData.personalInfo.fullName}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex items-start gap-2.5">
//                       <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
//                       <div>
//                         <div className="text-slate-500 text-xs">Email</div>
//                         <div className="text-slate-800 font-semibold">
//                           {formData.personalInfo.email}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex items-start gap-2.5">
//                       <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
//                       <div>
//                         <div className="text-slate-500 text-xs">Phone</div>
//                         <div className="text-slate-800 font-semibold">
//                           {formData.personalInfo.phone}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex items-start gap-2.5">
//                       <BriefcaseMedical className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
//                       <div>
//                         <div className="text-slate-500 text-xs">Position</div>
//                         <div className="text-slate-800 font-semibold">
//                           {formData.personalInfo.position ||
//                             formData.professional.role}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Professional Info */}
//                 <div>
//                   <h4
//                     className={cn(
//                       "font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider",
//                       bebasNeue.className,
//                     )}
//                   >
//                     Professional Information
//                   </h4>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                     <div>
//                       <div className="text-slate-500 text-xs">Role</div>
//                       <div className="text-slate-800 font-semibold">
//                         {formData.professional.role}
//                       </div>
//                     </div>
//                     <div>
//                       <div className="text-slate-500 text-xs">Department</div>
//                       <div className="text-slate-800 font-semibold">
//                         {formData.professional.department}
//                       </div>
//                     </div>
//                     <div>
//                       <div className="text-slate-500 text-xs">
//                         Employment Type
//                       </div>
//                       <div className="text-slate-800 font-semibold capitalize">
//                         {formData.professional.employmentType.replace("-", " ")}
//                       </div>
//                     </div>
//                     <div>
//                       <div className="text-slate-500 text-xs">Start Date</div>
//                       <div className="text-slate-800 font-semibold">
//                         {formatDate(formData.professional.startDate)}
//                       </div>
//                     </div>
//                     <div>
//                       <div className="text-slate-500 text-xs">Status</div>
//                       <div
//                         className={cn(
//                           "font-semibold",
//                           formData.status === "active"
//                             ? "text-emerald-600"
//                             : "text-amber-600",
//                         )}
//                       >
//                         {formData.status === "active" ? "Active" : "On Leave"}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Center Info */}
//                 <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/60">
//                   <div className="flex items-center gap-3 mb-1">
//                     <Building className="w-5 h-5 text-emerald-600" />
//                     <h5
//                       className={cn(
//                         "font-semibold text-emerald-800",
//                         bebasNeue.className,
//                       )}
//                     >
//                       Will be added to:
//                     </h5>
//                   </div>
//                   <div className="text-emerald-700 font-medium">
//                     {center.centerName || "Medical Center"}
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {/* Error Display */}
//           {error && (
//             <div className="mt-4">
//               <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
//                 <div className="flex items-center gap-2.5">
//                   <AlertCircle className="w-4 h-4 text-rose-600" />
//                   <span
//                     className={cn("text-sm text-rose-700", poppins.className)}
//                   >
//                     {error}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* --- Navigation Buttons --- */}
//         <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200/80 p-4 sm:p-6 flex justify-between rounded-b-2xl">
//           <button
//             onClick={handleBack}
//             disabled={currentStep === 1 || loading}
//             className="px-6 py-3 text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
//           >
//             <ChevronLeft className="w-4 h-4" />
//             <span className={poppins.className}>Back</span>
//           </button>

//           {currentStep < 3 ? (
//             <button
//               onClick={handleNext}
//               disabled={!isStepValid() || loading}
//               className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
//             >
//               <span className={poppins.className}>Next</span>
//               <ChevronRight className="w-4 h-4" />
//             </button>
//           ) : (
//             <button
//               onClick={handleSubmit}
//               disabled={loading}
//               className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-lg shadow-emerald-200/30"
//             >
//               {loading ? (
//                 <>
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                   <span className={poppins.className}>Adding...</span>
//                 </>
//               ) : (
//                 <span className={poppins.className}>Add Staff Member</span>
//               )}
//             </button>
//           )}
//         </div>
//       </motion.div>
//     </div>
//   );
// }

"use client";

import { motion } from "framer-motion";
import {
  X,
  User,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  Calendar,
  BriefcaseMedical,
  GraduationCap,
  CheckCircle,
  Building,
  AlertCircle,
  Award,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Center, User as UserType, UserRole } from "@/app/center/type";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { getDisplayRole } from "../../config/center-based-navigation";

interface AddStaffModalProps {
  onClose: () => void;
  onStaffAdded: (staff: any) => void;
  center: Center;
  user: UserType;
}

interface FormData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  professional: {
    role: string; // system role value or free‑text if 'other'
    roleType: "system" | "other";
    specialty: string; // doctor/nurse/pharmacist/lab
    specialtyCustom: string;
    isHeadOfDepartment: boolean;
    department: string;
    employmentType: string;
    startDate: string;
  };
  status: "active" | "inactive" | "on_leave";
}

// All system roles (centre‑agnostic)
const ALL_SYSTEM_ROLES: string[] = [
  "admin",
  "doctor",
  "nurse",
  "receptionist",
  "lab_technician",
  "pharmacist",
  "accountant",
  "hr",
  "center_head",
  "center_owner",
];

// Extended display mapping (add "admin")
const roleDisplayMap: Record<string, string> = {
  admin: "Administrator",
  doctor: "Doctor",
  nurse: "Nurse",
  receptionist: "Receptionist",
  lab_technician: "Lab Technician",
  pharmacist: "Pharmacist",
  accountant: "Accountant",
  hr: "Human Resources",
  center_head: "Center Head",
  center_owner: "Center Owner",
};

function getRoleLabel(role: string): string {
  return roleDisplayMap[role] || role;
}

// Specialty lists
const doctorSpecialties = [
  "General Practitioner",
  "Cardiologist",
  "Dermatologist",
  "Endocrinologist",
  "Gastroenterologist",
  "Hematologist",
  "Nephrologist",
  "Neurologist",
  "Oncologist",
  "Ophthalmologist",
  "Orthopedic Surgeon",
  "Otolaryngologist (ENT)",
  "Pediatrician",
  "Psychiatrist",
  "Pulmonologist",
  "Radiologist",
  "Rheumatologist",
  "Urologist",
  "Obstetrician/Gynecologist",
  "Anesthesiologist",
  "Emergency Medicine",
  "Dentist",
  "Optometrist",
  "Other",
];

const nurseSpecialties = [
  "General Nursing",
  "Midwifery",
  "Pediatric Nursing",
  "ICU/Critical Care",
  "Emergency Nursing",
  "Oncology Nursing",
  "Cardiac Nursing",
  "Orthopedic Nursing",
  "Psychiatric Nursing",
  "Community Health Nursing",
  "Dental Nursing",
  "Ophthalmic Nursing",
  "Other",
];

const pharmacistSpecialties = [
  "Community Pharmacy",
  "Hospital Pharmacy",
  "Clinical Pharmacy",
  "Industrial Pharmacy",
  "Regulatory Pharmacy",
  "Compounding Pharmacy",
  "Oncology Pharmacy",
  "Nuclear Pharmacy",
  "Other",
];

const labSpecialties = [
  "Clinical Chemistry",
  "Hematology",
  "Microbiology",
  "Immunology",
  "Molecular Diagnostics",
  "Histopathology",
  "Cytology",
  "Blood Bank/Transfusion",
  "Phlebotomy",
  "Other",
];

const employmentTypes = [
  "full-time",
  "part-time",
  "contract",
  "intern",
  "volunteer",
];

export default function AddStaffModal({
  onClose,
  onStaffAdded,
  center,
  user,
}: AddStaffModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
    },
    professional: {
      role: "",
      roleType: "system",
      specialty: "",
      specialtyCustom: "",
      isHeadOfDepartment: false,
      department: "",
      employmentType: "full-time",
      startDate: new Date().toISOString().split("T")[0],
    },
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };
  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handlePersonalChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const handleProfessionalChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      professional: { ...prev.professional, [field]: value },
    }));
  };

  const handleRoleChange = (value: string) => {
    if (value === "other") {
      setFormData((prev) => ({
        ...prev,
        professional: {
          ...prev.professional,
          role: "",
          roleType: "other",
          specialty: "", // reset specialty
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        professional: {
          ...prev.professional,
          role: value,
          roleType: "system",
          specialty: "", // reset when role changes
        },
      }));
    }
  };

  const isEmailRequired = formData.professional.roleType === "system";

  // Determine if specialty field should be shown
  const showSpecialty =
    formData.professional.roleType === "system" &&
    ["doctor", "nurse", "pharmacist", "lab_technician"].includes(
      formData.professional.role,
    );

  // Get the correct specialty list based on role
  const getSpecialtyOptions = (): string[] => {
    switch (formData.professional.role) {
      case "doctor":
        return doctorSpecialties;
      case "nurse":
        return nurseSpecialties;
      case "pharmacist":
        return pharmacistSpecialties;
      case "lab_technician":
        return labSpecialties;
      default:
        return [];
    }
  };

  const isSpecialtyOther = formData.professional.specialty === "Other";

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.personalInfo.fullName.trim() &&
          (isEmailRequired
            ? formData.personalInfo.email.trim() &&
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.email)
            : true) &&
          formData.personalInfo.phone.trim()
        );
      case 2:
        if (formData.professional.roleType === "system") {
          const roleValid = formData.professional.role.trim() !== "";
          // If specialty is required (showing) and 'Other' is selected, custom text must be filled
          if (showSpecialty && formData.professional.specialty === "Other") {
            return roleValid && formData.professional.specialty.trim() !== "";
          }
          return roleValid;
        }
        return formData.professional.role.trim() !== "";
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      const staffData = {
        personalInfo: {
          fullName: formData.personalInfo.fullName.trim(),
          email: formData.personalInfo.email.trim().toLowerCase(),
          phone: formData.personalInfo.phone.trim(),
        },
        professional: {
          role: formData.professional.role.trim(),
          department: formData.professional.department.trim(),
          employmentType: formData.professional.employmentType,
          startDate: formData.professional.startDate,
          specialty: formData.professional.specialty,
          isHeadOfDepartment: formData.professional.isHeadOfDepartment,
        },
        sendInvite: formData.professional.roleType === "system",
        systemRole:
          formData.professional.roleType === "system"
            ? formData.professional.role
            : undefined,
        status: formData.status,
      };

      onStaffAdded(staffData);
    } catch (error: any) {
      console.error("Error preparing staff data:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Personal Info" },
    { number: 2, title: "Professional Info" },
    { number: 3, title: "Review & Submit" },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center z-50 safe-padding">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 p-4 sm:p-6 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2
              className={cn(
                "text-2xl font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              Add New Staff Member
            </h2>
            <p className={cn("text-sm text-slate-600", poppins.className)}>
              {center.centerName || "Medical Center"} –{" "}
              {center.centerType?.replace("_", " ") || "Healthcare"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 active:scale-95"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200/80 bg-slate-50/50">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    currentStep >= step.number
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50"
                      : "bg-slate-200 text-slate-500",
                  )}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span
                      className={cn("font-bold text-sm", poppins.className)}
                    >
                      {step.number}
                    </span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-12 h-1 transition-all duration-300",
                      currentStep > step.number
                        ? "bg-emerald-500"
                        : "bg-slate-300",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <span
                key={step.number}
                className={cn(
                  "text-xs font-medium transition-all duration-300",
                  currentStep >= step.number
                    ? "text-emerald-700"
                    : "text-slate-500",
                  poppins.className,
                )}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4 sm:p-6">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-700">
                  <User className="w-5 h-5" />
                </div>
                <h3
                  className={cn(
                    "text-xl font-bold text-slate-900",
                    bebasNeue.className,
                  )}
                >
                  Personal Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={cn(
                      "block text-sm font-semibold text-slate-800 mb-1.5",
                      poppins.className,
                    )}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition text-slate-900 placeholder:text-slate-400 text-sm"
                    value={formData.personalInfo.fullName}
                    onChange={(e) =>
                      handlePersonalChange("fullName", e.target.value)
                    }
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label
                    className={cn(
                      "block text-sm font-semibold text-slate-800 mb-1.5",
                      poppins.className,
                    )}
                  >
                    Email {isEmailRequired ? "*" : ""}
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition text-slate-900 placeholder:text-slate-400 text-sm"
                    value={formData.personalInfo.email}
                    onChange={(e) =>
                      handlePersonalChange("email", e.target.value)
                    }
                    placeholder={
                      isEmailRequired ? "Required for login access" : "Optional"
                    }
                  />
                </div>
                <div>
                  <label
                    className={cn(
                      "block text-sm font-semibold text-slate-800 mb-1.5",
                      poppins.className,
                    )}
                  >
                    Phone *
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition text-slate-900 placeholder:text-slate-400 text-sm"
                    value={formData.personalInfo.phone}
                    onChange={(e) =>
                      handlePersonalChange("phone", e.target.value)
                    }
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 rounded-xl text-purple-700">
                  <BriefcaseMedical className="w-5 h-5" />
                </div>
                <h3
                  className={cn(
                    "text-xl font-bold text-slate-900",
                    bebasNeue.className,
                  )}
                >
                  Professional Information
                </h3>
              </div>

              {/* Role Selection */}
              <div>
                <label
                  className={cn(
                    "block text-sm font-semibold text-slate-800 mb-1.5",
                    poppins.className,
                  )}
                >
                  Role *
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition text-slate-900 text-sm appearance-none"
                  value={
                    formData.professional.roleType === "system"
                      ? formData.professional.role
                      : "other"
                  }
                  onChange={(e) => handleRoleChange(e.target.value)}
                >
                  <option value="">Select role</option>
                  {ALL_SYSTEM_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                  <option value="other">Other (non‑clinical staff)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.professional.roleType === "system"
                    ? "This role will receive a login invitation."
                    : "Record‑only – no system access will be created."}
                </p>
              </div>

              {/* Free‑text role input when 'Other' is selected */}
              {formData.professional.roleType === "other" && (
                <div>
                  <label
                    className={cn(
                      "block text-sm font-semibold text-slate-800 mb-1.5",
                      poppins.className,
                    )}
                  >
                    Specify Role Title *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition text-slate-900 placeholder:text-slate-400 text-sm"
                    value={formData.professional.role}
                    onChange={(e) =>
                      handleProfessionalChange("role", e.target.value)
                    }
                    placeholder="e.g. Cleaner, Security, Volunteer"
                  />
                </div>
              )}

              {/* Specialty field (doctor, nurse, pharmacist, lab) */}
              {showSpecialty && (
                <div>
                  <label
                    className={cn(
                      "block text-sm font-semibold text-slate-800 mb-1.5",
                      poppins.className,
                    )}
                  >
                    Specialty
                  </label>
                  <select
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition text-slate-900 text-sm appearance-none"
                    value={formData.professional.specialty}
                    onChange={(e) =>
                      handleProfessionalChange("specialty", e.target.value)
                    }
                  >
                    <option value="">Select specialty</option>
                    {getSpecialtyOptions().map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                  {isSpecialtyOther && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition text-slate-900 placeholder:text-slate-400 text-sm"
                        value={
                          formData.professional.specialty === "Other"
                            ? formData.professional.specialtyCustom || ""
                            : ""
                        }
                        onChange={(e) => {
                          // handle custom specialty
                          handleProfessionalChange(
                            "specialtyCustom",
                            e.target.value,
                          );
                        }}
                        placeholder="Enter your specialty"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Head of Department toggle */}
              <div className="flex items-center justify-between bg-slate-50/80 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <span
                    className={cn(
                      "font-semibold text-slate-800",
                      poppins.className,
                    )}
                  >
                    Head of Department
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleProfessionalChange(
                      "isHeadOfDepartment",
                      !formData.professional.isHeadOfDepartment,
                    )
                  }
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                    formData.professional.isHeadOfDepartment
                      ? "bg-emerald-600"
                      : "bg-slate-300",
                  )}
                >
                  <div
                    className={cn(
                      "absolute w-5 h-5 bg-white rounded-full shadow top-0.5 transition-transform duration-200",
                      formData.professional.isHeadOfDepartment
                        ? "translate-x-6"
                        : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={cn(
                      "block text-sm font-semibold text-slate-800 mb-1.5",
                      poppins.className,
                    )}
                  >
                    Department
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition text-slate-900 placeholder:text-slate-400 text-sm"
                    value={formData.professional.department}
                    onChange={(e) =>
                      handleProfessionalChange("department", e.target.value)
                    }
                    placeholder="e.g. Cardiology, Pharmacy, Ward A"
                  />
                </div>
                <div>
                  <label
                    className={cn(
                      "block text-sm font-semibold text-slate-800 mb-1.5",
                      poppins.className,
                    )}
                  >
                    Employment Type
                  </label>
                  <select
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition text-slate-900 text-sm appearance-none"
                    value={formData.professional.employmentType}
                    onChange={(e) =>
                      handleProfessionalChange("employmentType", e.target.value)
                    }
                  >
                    {employmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={cn(
                      "block text-sm font-semibold text-slate-800 mb-1.5",
                      poppins.className,
                    )}
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition text-slate-900 text-sm"
                    value={formData.professional.startDate}
                    onChange={(e) =>
                      handleProfessionalChange("startDate", e.target.value)
                    }
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label
                    className={cn(
                      "block text-sm font-semibold text-slate-800 mb-2",
                      poppins.className,
                    )}
                  >
                    Status
                  </label>
                  <div className="flex space-x-6">
                    {["active", "on_leave"].map((status) => (
                      <label
                        key={status}
                        className="flex items-center space-x-2.5 cursor-pointer"
                      >
                        <input
                          type="radio"
                          checked={formData.status === status}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              status: status as any,
                            }))
                          }
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500/40 border-slate-400"
                        />
                        <span
                          className={cn(
                            "text-sm text-slate-800",
                            poppins.className,
                          )}
                        >
                          {status === "active" ? "Active" : "On Leave"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-700">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3
                  className={cn(
                    "text-xl font-bold text-slate-900",
                    bebasNeue.className,
                  )}
                >
                  Review Information
                </h3>
              </div>

              <div className="bg-slate-50/80 rounded-2xl p-6 space-y-6 border border-slate-200/80">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wider">
                    Personal Info
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2.5">
                      <User className="w-4 h-4 text-slate-500 mt-0.5" />
                      <div>
                        <div className="text-slate-600 text-xs">Full Name</div>
                        <div className="text-slate-900 font-semibold">
                          {formData.personalInfo.fullName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-slate-500 mt-0.5" />
                      <div>
                        <div className="text-slate-600 text-xs">Email</div>
                        <div className="text-slate-900 font-semibold">
                          {formData.personalInfo.email || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-slate-500 mt-0.5" />
                      <div>
                        <div className="text-slate-600 text-xs">Phone</div>
                        <div className="text-slate-900 font-semibold">
                          {formData.personalInfo.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wider">
                    Professional Info
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-600 text-xs">Role</div>
                      <div className="text-slate-900 font-semibold">
                        {formData.professional.roleType === "system"
                          ? getRoleLabel(formData.professional.role)
                          : formData.professional.role}
                      </div>
                    </div>
                    {formData.professional.specialty && (
                      <div>
                        <div className="text-slate-600 text-xs">Specialty</div>
                        <div className="text-slate-900 font-semibold">
                          {formData.professional.specialty}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-slate-600 text-xs">
                        Head of Department
                      </div>
                      <div className="text-slate-900 font-semibold">
                        {formData.professional.isHeadOfDepartment
                          ? "Yes"
                          : "No"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-600 text-xs">Department</div>
                      <div className="text-slate-900 font-semibold">
                        {formData.professional.department || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-600 text-xs">
                        Employment Type
                      </div>
                      <div className="text-slate-900 font-semibold capitalize">
                        {formData.professional.employmentType.replace("-", " ")}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-600 text-xs">Start Date</div>
                      <div className="text-slate-900 font-semibold">
                        {formatDate(formData.professional.startDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-600 text-xs">Status</div>
                      <div
                        className={cn(
                          "font-semibold",
                          formData.status === "active"
                            ? "text-emerald-700"
                            : "text-amber-700",
                        )}
                      >
                        {formData.status === "active" ? "Active" : "On Leave"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-600 text-xs">
                        System Access
                      </div>
                      <div className="text-slate-900 font-semibold">
                        {formData.professional.roleType === "system" ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Will be invited
                          </span>
                        ) : (
                          <span className="text-slate-500">No login</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/60">
                  <div className="flex items-center gap-3 mb-1">
                    <Building className="w-5 h-5 text-emerald-700" />
                    <h5
                      className={cn(
                        "font-semibold text-emerald-800",
                        bebasNeue.className,
                      )}
                    >
                      Will be added to:
                    </h5>
                  </div>
                  <div className="text-emerald-800 font-medium">
                    {center.centerName || "Medical Center"}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span className="text-sm text-rose-700">{error}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200/80 p-4 sm:p-6 flex justify-between rounded-b-2xl">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            className="px-6 py-3 text-slate-700 hover:bg-slate-100 rounded-xl disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Staff Member"
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
