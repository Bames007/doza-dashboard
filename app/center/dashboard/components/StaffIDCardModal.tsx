"use client";

import { motion } from "framer-motion";
import {
  X,
  Download,
  RotateCcw,
  MapPin,
  Phone,
  Mail,
  Calendar,
  User as UserIcon,
  Crown,
  Shield,
  Loader2,
} from "lucide-react";
import { useRef, useState } from "react";
import jsPDF from "jspdf";
import { Center } from "@/app/center/type";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { toast } from "react-hot-toast";
import { useDozaMedic } from "@/app/hooks/useDozaMedic";

interface StaffMember {
  id: string;
  staffId: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    position: string;
  };
  professional: {
    role: string;
    department: string;
    employmentType: string;
    startDate: string;
  };
  isOwner: boolean;
  status: "active" | "inactive" | "on_leave";
  createdAt: string;
  joinedAt: string;
  lastUpdated: string;
  dozaMedic?: {
    isRegistered: boolean;
    medicId?: string;
    registrationDate?: string;
    registrationStatus?: "pending" | "approved" | "rejected";
    points?: number;
    level?: string;
    lastSynced?: string;
  };
}

interface StaffIDCardModalProps {
  staff: StaffMember;
  onClose: () => void;
  center: Center;
  currentUserId: string;
  onJoinDozaMedic?: (staffId: string, staffEmail: string) => Promise<void>;
}

export default function StaffIDCardModal({
  staff,
  onClose,
  center,
  currentUserId,
  onJoinDozaMedic,
}: StaffIDCardModalProps) {
  const idCardRef = useRef<HTMLDivElement>(null);
  const [showBack, setShowBack] = useState(false);
  const { inviteToDozaMedic, loading } = useDozaMedic();

  const hospitalName = center?.centerName || "Healthcare Center";
  const hospitalAddress = center?.location?.address || "Address not available";
  const hospitalPhone = center?.contact?.phone || "N/A";
  const hospitalEmail = center?.contact?.email || "N/A";

  const getInitials = (name: string): string => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 3);
  };

  const getJoinDate = (): string => {
    if (!staff?.joinedAt) return new Date().toLocaleDateString();
    return new Date(staff.joinedAt).toLocaleDateString();
  };

  const handleFlip = () => setShowBack(!showBack);

  const downloadPDF = async () => {
    try {
      const pdf = new jsPDF("p", "mm", [89, 140]);

      // Front – same logic as before, but we keep it functional
      // (simplified for readability – reuse existing logic)
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 89, 140, "F");
      pdf.setFillColor(41, 175, 69);
      pdf.rect(0, 0, 89, 25, "F");
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text(hospitalName.toUpperCase(), 44.5, 10, { align: "center" });
      pdf.setFontSize(7);
      pdf.text("STAFF IDENTIFICATION CARD", 44.5, 16, { align: "center" });

      const contentStartY = 35;
      pdf.setDrawColor(41, 175, 69);
      pdf.setFillColor(249, 250, 251);
      pdf.circle(44.5, contentStartY + 20, 15, "FD");
      pdf.setFontSize(16);
      pdf.setTextColor(156, 163, 175);
      const initials = getInitials(staff.personalInfo.fullName);
      pdf.text(initials, 44.5, contentStartY + 22, { align: "center" });

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      const fullName = staff.personalInfo.fullName;
      const nameLines = pdf.splitTextToSize(fullName.toUpperCase(), 80);
      pdf.text(nameLines, 44.5, contentStartY + 50, { align: "center" });

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(41, 175, 69);
      pdf.text(
        staff.professional.role.toUpperCase(),
        44.5,
        contentStartY + 58,
        {
          align: "center",
        },
      );

      const detailsYStart = contentStartY + 70;
      pdf.setFontSize(6);
      pdf.setTextColor(55, 65, 81);
      pdf.text(`STAFF ID: ${staff.staffId}`, 10, detailsYStart);
      pdf.text(`EMAIL: ${staff.personalInfo.email}`, 10, detailsYStart + 5);
      pdf.text(`PHONE: ${staff.personalInfo.phone}`, 10, detailsYStart + 10);
      pdf.text(`JOINED: ${getJoinDate()}`, 10, detailsYStart + 15);
      pdf.text(
        `DEPT: ${staff.professional.department.toUpperCase()}`,
        10,
        detailsYStart + 20,
      );

      if (staff.dozaMedic?.isRegistered) {
        pdf.text(
          `DOZA MEDIC: ${staff.dozaMedic.level?.toUpperCase() || "MEMBER"}`,
          10,
          detailsYStart + 25,
        );
      } else if (staff.isOwner) {
        pdf.text(`STATUS: OWNER`, 10, detailsYStart + 25);
      }

      pdf.setFontSize(5);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Issued: ${new Date().toLocaleDateString()}`, 10, 130);
      const validThrough = new Date();
      validThrough.setFullYear(validThrough.getFullYear() + 1);
      pdf.text(`Valid Through: ${validThrough.toLocaleDateString()}`, 10, 135);

      pdf.setDrawColor(200, 200, 200);
      pdf.line(50, 125, 85, 125);
      pdf.setFontSize(6);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(41, 175, 69);
      pdf.text(staff.personalInfo.fullName, 67.5, 132, { align: "center" });
      pdf.setFontSize(4);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text("Authorized Signature", 67.5, 135, { align: "center" });

      // Back
      pdf.addPage();
      pdf.setFillColor(249, 250, 251);
      pdf.rect(0, 0, 89, 140, "F");
      pdf.setFillColor(41, 175, 69);
      pdf.rect(0, 0, 89, 15, "F");
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      pdf.text("IDENTIFICATION CARD - BACK", 44.5, 8, { align: "center" });

      let currentY = 40;
      const sections = [
        {
          title: "IF FOUND, PLEASE RETURN TO:",
          content: [
            hospitalName,
            hospitalAddress,
            `Phone: ${hospitalPhone}`,
            `Email: ${hospitalEmail}`,
          ],
        },
        {
          title: "EMERGENCY CONTACT",
          content: ["Contact Hospital Security", "Available 24/7"],
        },
      ];
      sections.forEach((section) => {
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(200, 200, 200);
        pdf.roundedRect(10, currentY, 69, 12, 2, 2, "FD");
        pdf.setFontSize(5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text(section.title, 15, currentY + 3);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(4);
        section.content.forEach((line, idx) => {
          pdf.text(line, 15, currentY + 6 + idx * 2);
        });
        currentY += 15;
      });

      if (staff.dozaMedic?.isRegistered) {
        currentY += 5;
        pdf.setFillColor(236, 253, 245);
        pdf.setDrawColor(167, 243, 208);
        pdf.roundedRect(10, currentY, 69, 10, 2, 2, "FD");
        pdf.setFontSize(5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(6, 95, 70);
        pdf.text("DOZA MEDIC VERIFIED", 15, currentY + 3);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(4);
        pdf.text(
          `Level: ${staff.dozaMedic.level || "Member"}`,
          15,
          currentY + 6,
        );
        pdf.text(`Points: ${staff.dozaMedic.points || 0}`, 15, currentY + 9);
      }

      pdf.setFillColor(41, 175, 69);
      pdf.rect(0, 125, 89, 15, "F");
      pdf.setFontSize(6);
      pdf.setTextColor(255, 255, 255);
      pdf.text("Doza Healthcare Solutions", 44.5, 130, { align: "center" });
      pdf.setFontSize(4);
      pdf.text("Secure Staff Identification System", 44.5, 134, {
        align: "center",
      });

      pdf.save(
        `${staff.personalInfo.fullName.replace(/\s+/g, "_")}_ID_Card.pdf`,
      );
      toast.success("ID Card downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download ID card");
    }
  };

  const handleJoinDozaMedic = async () => {
    await inviteToDozaMedic(
      staff.id,
      staff.personalInfo.email,
      center.id,
      center.centerName,
      currentUserId,
    );
  };

  const fullName = staff.personalInfo.fullName;
  const initials = getInitials(staff.personalInfo.fullName);

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-[2px] w-8 bg-emerald-500" />
                <span
                  className={cn(
                    "text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]",
                    poppins.className,
                  )}
                >
                  Staff Identification
                </span>
              </div>
              <h2
                className={cn(
                  "text-3xl md:text-4xl text-slate-900",
                  bebasNeue.className,
                )}
              >
                ID <span className="text-emerald-600">CARD</span>
              </h2>
              <p
                className={cn("text-sm text-slate-500 mt-1", poppins.className)}
              >
                Preview and download identification card for {fullName}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleFlip}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-2"
              >
                <RotateCcw size={14} />
                {showBack ? "Front" : "Back"}
              </button>
              <button
                onClick={downloadPDF}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
              >
                <Download size={14} />
                Download PDF
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* ID Card Preview */}
            <div className="flex-1 flex flex-col items-center">
              <div
                className="relative w-full max-w-md aspect-[3/4] cursor-pointer"
                style={{ perspective: "1200px" }}
                onClick={handleFlip}
              >
                <motion.div
                  className="relative w-full h-full"
                  initial={false}
                  animate={{ rotateY: showBack ? 180 : 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 w-full h-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-5 pb-3">
                      <div className="text-center">
                        <h3
                          className={cn(
                            "text-lg font-bold tracking-tight",
                            bebasNeue.className,
                          )}
                        >
                          {hospitalName}
                        </h3>
                        <p className="text-emerald-100 text-[10px] font-bold tracking-widest uppercase">
                          Staff ID Card
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="relative flex-shrink-0">
                          <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100 border-4 border-emerald-200 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-2xl font-bold text-emerald-600">
                              {initials}
                            </span>
                          </div>
                          {staff.isOwner && (
                            <Crown className="absolute -top-1 -right-1 w-5 h-5 text-amber-400" />
                          )}
                          {staff.dozaMedic?.isRegistered && (
                            <Shield className="absolute -bottom-1 -right-1 w-5 h-5 text-emerald-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4
                            className={cn(
                              "text-xl font-bold text-slate-900 leading-tight",
                              bebasNeue.className,
                            )}
                          >
                            {fullName}
                          </h4>
                          <p className="text-emerald-600 font-bold text-sm uppercase tracking-wide">
                            {staff.professional.role}
                            {staff.isOwner && " (Owner)"}
                          </p>
                          {staff.dozaMedic?.isRegistered && (
                            <span className="inline-block mt-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Doza Medic
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        {[
                          {
                            label: "Staff ID",
                            value: staff.staffId,
                            mono: true,
                          },
                          {
                            label: "Joined",
                            value: getJoinDate(),
                            icon: Calendar,
                          },
                          {
                            label: "Email",
                            value: staff.personalInfo.email,
                            truncate: true,
                          },
                          { label: "Phone", value: staff.personalInfo.phone },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0"
                          >
                            <span className="text-slate-500 text-xs font-medium">
                              {item.label}
                            </span>
                            <span
                              className={cn(
                                "text-xs font-semibold text-slate-800",
                                item.mono && "font-mono",
                                item.truncate && "truncate max-w-[160px]",
                              )}
                            >
                              {item.value}
                            </span>
                          </div>
                        ))}
                        {staff.dozaMedic?.isRegistered &&
                          staff.dozaMedic.level && (
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                              <span className="text-slate-500 text-xs font-medium">
                                Doza Level
                              </span>
                              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {staff.dozaMedic.level.toUpperCase()}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-50 px-5 py-3 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-slate-500">
                            Issued: {new Date().toLocaleDateString()}
                          </div>
                          <div className="text-emerald-600 font-bold text-xs">
                            ● Active Staff
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] text-slate-400">
                            Signature
                          </div>
                          <div className="text-emerald-600 font-bold text-sm border-t-2 border-slate-300 pt-1">
                            {fullName}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className="absolute inset-0 w-full h-full bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-4">
                      <div className="text-center">
                        <h3
                          className={cn(
                            "text-sm font-bold",
                            bebasNeue.className,
                          )}
                        >
                          {hospitalName.toUpperCase()}
                        </h3>
                        <p className="text-emerald-100 text-[9px] font-bold tracking-widest uppercase">
                          ID Card – Back
                        </p>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h4 className="font-bold text-red-800 text-sm flex items-center gap-2">
                          <MapPin size={14} /> If Found, Return To:
                        </h4>
                        <div className="mt-2 text-sm text-slate-700 space-y-1">
                          <p className="font-semibold">{hospitalName}</p>
                          <p>{hospitalAddress}</p>
                          <p className="flex items-center gap-2">
                            <Phone size={12} /> {hospitalPhone}
                          </p>
                          <p className="flex items-center gap-2">
                            <Mail size={12} /> {hospitalEmail}
                          </p>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="font-bold text-blue-800 text-sm">
                          Emergency Contact
                        </h4>
                        <p className="text-sm text-slate-700 mt-1">
                          Contact Hospital Security (24/7)
                        </p>
                      </div>

                      {staff.dozaMedic?.isRegistered && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                          <h4 className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                            <Shield size={14} /> Doza Medic Verified
                          </h4>
                          <div className="mt-2 text-sm text-slate-700 space-y-1">
                            <div className="flex justify-between">
                              <span>Level:</span>
                              <span className="font-semibold">
                                {staff.dozaMedic.level || "Member"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Points:</span>
                              <span className="font-semibold">
                                {staff.dozaMedic.points?.toLocaleString() || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span className="font-semibold text-emerald-600">
                                VERIFIED
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                          <div className="w-5 h-5 bg-emerald-600 rounded-full" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-xs">
                            Doza Healthcare Solutions
                          </p>
                          <p className="text-emerald-100 text-[8px]">
                            Secure Staff ID System
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <p
                className={cn("text-xs text-slate-400 mt-4", poppins.className)}
              >
                Click the card to flip
              </p>
            </div>

            {/* Sidebar – Staff summary and Doza Medic integration */}
            <div className="lg:w-80 flex-shrink-0 space-y-4">
              {/* Staff Summary */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60">
                <h4
                  className={cn(
                    "text-sm font-bold text-slate-800 mb-4",
                    bebasNeue.className,
                  )}
                >
                  Staff Information
                </h4>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Full Name", value: fullName },
                    {
                      label: "Position",
                      value:
                        staff.professional.role +
                        (staff.isOwner ? " (Owner)" : ""),
                    },
                    { label: "Staff ID", value: staff.staffId, mono: true },
                    {
                      label: "Department",
                      value: staff.professional.department,
                    },
                    {
                      label: "Status",
                      value:
                        staff.status === "active"
                          ? "Active"
                          : staff.status === "inactive"
                            ? "Inactive"
                            : "On Leave",
                      emerald: staff.status === "active",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between items-center border-b border-slate-200/60 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-slate-500 text-xs">
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-semibold text-slate-800",
                          item.mono && "font-mono",
                          item.emerald && "text-emerald-600",
                        )}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doza Medic Integration */}
              {!staff.isOwner && (
                <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200/60">
                  <h4
                    className={cn(
                      "text-sm font-bold text-emerald-800 mb-3",
                      bebasNeue.className,
                    )}
                  >
                    Doza Medic Status
                  </h4>

                  {staff.dozaMedic?.isRegistered ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-900">
                            Verified Member
                          </span>
                        </div>
                        <a
                          href={`/medic/profile/${staff.dozaMedic.medicId}`}
                          className="text-emerald-600 text-xs font-bold hover:text-emerald-800 px-3 py-1 bg-white rounded-lg shadow-sm"
                        >
                          View →
                        </a>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-3 rounded-lg border border-emerald-100">
                          <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                            Level
                          </div>
                          <div className="text-lg font-bold text-emerald-900">
                            {staff.dozaMedic.level || "Member"}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-emerald-100">
                          <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                            Points
                          </div>
                          <div className="text-lg font-bold text-emerald-900">
                            {staff.dozaMedic.points?.toLocaleString() || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600">
                        Not registered as a Doza Medic.
                      </p>
                      {onJoinDozaMedic && (
                        <button
                          onClick={handleJoinDozaMedic}
                          disabled={loading}
                          className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Invite to Join"
                          )}
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400">
                        Invite this staff member to join the Doza Medic
                        platform.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
