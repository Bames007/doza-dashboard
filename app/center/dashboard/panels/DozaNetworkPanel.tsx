// app/center/dashboard/panels/DozaNetworkPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  Users,
  Building2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Import,
  ExternalLink,
  Shield,
  Eye,
  RefreshCw,
  Network,
  UserPlus,
  Star,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { useDashboard } from "../DashboardContext";

// ─── Types ────────────────────────────────────────────────────────────

interface DozaPatient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  facilityName: string;
  facilityId: string;
  phone?: string;
  email?: string;
  address?: string;
  consentGiven: boolean;
}

interface PatientSummary {
  patient: DozaPatient;
  allergies: string[];
  medications: string[];
  conditions: string[];
  labResults: { name: string; date: string; result: string }[];
  consent: { status: "active" | "revoked" | "pending"; expiry?: string };
}

interface SearchResponse {
  success: boolean;
  patients: DozaPatient[];
  total: number;
  error?: string;
}

interface CarouselItem {
  id: string;
  image: string;
  title: string;
  description: string;
  link?: string;
}

// ─── Carousel Data with Unsplash Images ─────────────────────────────

const carouselItems: CarouselItem[] = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80",
    title: "Doza Annual Medical Conference 2025",
    description:
      "Join healthcare professionals from across the network. Register now!",
    link: "#",
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&q=80",
    title: "New Telemedicine Partnership",
    description: "Connect patients to specialists in real-time. Learn more.",
    link: "#",
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=1200&q=80",
    title: "Research Grant for Diabetes",
    description: "Apply for the Doza Research Grant. Deadline: July 30, 2025.",
    link: "#",
  },
];

// ─── Helper Components ──────────────────────────────────────────────

const ConsentBadge = ({
  status,
}: {
  status: "active" | "revoked" | "pending";
}) => {
  const config = {
    active: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      icon: CheckCircle,
    },
    revoked: { bg: "bg-rose-100", text: "text-rose-700", icon: XCircle },
    pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  };
  const { bg, text, icon: Icon } = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full",
        bg,
        text,
      )}
    >
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ─── Carousel Component ──────────────────────────────────────────────

const Carousel = ({ items }: { items: CarouselItem[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    setIsAutoPlaying(false);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, items.length]);

  if (!items.length) return null;

  const current = items[currentIndex];

  return (
    <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/80">
      <div className="relative aspect-[21/9] md:aspect-[21/7]">
        <Image
          src={current.image}
          alt={current.title}
          fill
          className="object-cover"
          unoptimized // Unsplash images don't require optimization
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex items-center p-6 md:p-10">
          <div className="max-w-2xl text-white">
            <h3
              className={cn(
                "text-2xl md:text-3xl font-bold mb-2",
                bebasNeue.className,
              )}
            >
              {current.title}
            </h3>
            <p className="text-sm md:text-base text-white/90 max-w-xl">
              {current.description}
            </p>
            {current.link && (
              <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white border border-white/30 hover:border-white/60 rounded-lg px-4 py-2 transition">
                Learn More <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {/* Navigation controls */}
        <button
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/80",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton Components ─────────────────────────────────────────────

const CarouselSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 animate-pulse">
    <div className="aspect-[21/9] md:aspect-[21/7] bg-slate-200" />
  </div>
);

const SearchSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm animate-pulse">
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 h-12 bg-slate-200 rounded-xl" />
      <div className="h-12 w-32 bg-slate-200 rounded-xl" />
    </div>
  </div>
);

const PatientCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-slate-200 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-3 w-20 bg-slate-200 rounded" />
      </div>
    </div>
  </div>
);

const DetailSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="h-6 w-40 bg-slate-200 rounded" />
        <div className="h-4 w-32 bg-slate-100 rounded mt-1" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-28 bg-slate-200 rounded-xl" />
        <div className="h-10 w-20 bg-slate-200 rounded-xl" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="h-5 w-24 bg-slate-100 rounded" />
      <div className="h-5 w-24 bg-slate-100 rounded" />
    </div>
    <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
    <div className="space-y-4">
      <div className="h-4 w-32 bg-slate-200 rounded" />
      <div className="h-3 w-48 bg-slate-200 rounded" />
      <div className="h-3 w-36 bg-slate-200 rounded" />
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────

export default function DozaNetworkPanel() {
  const { center, user } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DozaPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<DozaPatient | null>(
    null,
  );
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(
    null,
  );
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [consentDialog, setConsentDialog] = useState<{
    patientId: string;
    action: "view" | "import";
  } | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const limit = 10;

  // Simulate initial loading (remove in production)
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const searchPatients = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setTotalResults(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/network/patients/search?${params}`, {
        headers: { "x-user-id": user?.id || "" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SearchResponse = await res.json();
      if (data.success) {
        setSearchResults(data.patients);
        setTotalResults(data.total);
      } else {
        throw new Error(data.error || "Search failed");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientSummary = async (patientId: string) => {
    setLoadingSummary(true);
    setError(null);
    try {
      const res = await fetch(`/api/network/patients/${patientId}/summary`, {
        headers: { "x-user-id": user?.id || "" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setPatientSummary(data.data);
      } else {
        throw new Error(data.error || "Failed to load patient summary");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  const importPatient = async (patientId: string) => {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch(`/api/network/patients/${patientId}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          targetFacilityId: center?.id,
          dataFields: [
            "demographics",
            "allergies",
            "medications",
            "conditions",
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Patient imported successfully!");
        setSelectedPatient(null);
        setPatientSummary(null);
      } else {
        throw new Error(data.error || "Import failed");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const referPatient = async (patientId: string, targetFacilityId: string) => {
    try {
      const res = await fetch(`/api/network/referrals`, {
        method: "POST",
        headers: { "x-user-id": user?.id || "" },
        body: JSON.stringify({
          patientId,
          sourceFacilityId: center?.id,
          targetFacilityId,
          reason: "Referral for specialist consultation",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Referral sent successfully!");
      } else {
        alert(data.error || "Referral failed");
      }
    } catch (err) {
      alert("Error sending referral");
    }
  };

  const handleConsentAction = async (
    patientId: string,
    action: "view" | "import",
  ) => {
    setConsentDialog(null);
    if (action === "view") {
      await fetchPatientSummary(patientId);
    } else if (action === "import") {
      await importPatient(patientId);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() && page > 0) {
      const timeout = setTimeout(searchPatients, 300);
      return () => clearTimeout(timeout);
    }
  }, [searchQuery, page]);

  // ─── Render ──────────────────────────────────────────────────────

  if (initialLoading) {
    return (
      <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-slate-200" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
            </div>
            <div className="h-10 w-64 bg-slate-200 rounded-lg" />
            <div className="h-5 w-80 bg-slate-100 rounded mt-2" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl" />
        </header>
        <CarouselSkeleton />
        <SearchSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {[1, 2, 3].map((i) => (
              <PatientCardSkeleton key={i} />
            ))}
          </div>
          <div className="lg:col-span-2">
            <DetailSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
              Doza Network
            </span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Connected
            </span>
          </div>
          <h1
            className={cn(
              "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
              bebasNeue.className,
            )}
          >
            Doza Network
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md">
            Search and collaborate with patients across Doza facilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={searchPatients}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      {/* ─── Carousel ────────────────────────────────────────────────── */}
      <Carousel items={carouselItems} />

      {/* ─── Search ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, or facility..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400 transition-all"
            />
          </div>
          <button
            onClick={searchPatients}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-emerald-200/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {searchResults.length > 0 &&
            `Found ${totalResults} patients across the Doza network`}
        </p>
      </div>

      {/* ─── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Search Results ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Results List */}
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => <PatientCardSkeleton key={i} />)
          ) : searchResults.length > 0 ? (
            searchResults.map((patient) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-white rounded-2xl p-4 border shadow-sm cursor-pointer transition-all hover:shadow-md",
                  selectedPatient?.id === patient.id
                    ? "border-emerald-400 shadow-md"
                    : "border-slate-200/80",
                )}
                onClick={() => {
                  setSelectedPatient(patient);
                  setPatientSummary(null);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                    {patient.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 truncate">
                        {patient.fullName}
                      </p>
                      {patient.consentGiven && (
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Consent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {patient.dateOfBirth} • {patient.gender}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3" />
                      {patient.facilityName}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm">
              <Network className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                Search for patients across the network
              </p>
            </div>
          )}
        </div>

        {/* Right: Patient Details */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            loadingSummary ? (
              <DetailSkeleton />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3
                      className={cn(
                        "text-xl font-bold text-slate-800",
                        bebasNeue.className,
                      )}
                    >
                      {selectedPatient.fullName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {selectedPatient.facilityName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setConsentDialog({
                          patientId: selectedPatient.id,
                          action: "view",
                        })
                      }
                      disabled={!selectedPatient.consentGiven}
                      className="px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      View Summary
                    </button>
                    <button
                      onClick={() =>
                        setConsentDialog({
                          patientId: selectedPatient.id,
                          action: "import",
                        })
                      }
                      disabled={!selectedPatient.consentGiven}
                      className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <Import className="w-4 h-4" />
                      Import
                    </button>
                  </div>
                </div>

                {/* Patient Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {selectedPatient.dateOfBirth}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    {selectedPatient.gender}
                  </div>
                  {selectedPatient.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {selectedPatient.phone}
                    </div>
                  )}
                  {selectedPatient.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {selectedPatient.email}
                    </div>
                  )}
                  {selectedPatient.address && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 col-span-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {selectedPatient.address}
                    </div>
                  )}
                </div>

                {/* Consent Status */}
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    Consent:
                  </span>
                  {selectedPatient.consentGiven ? (
                    <span className="text-sm text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Active
                    </span>
                  ) : (
                    <span className="text-sm text-rose-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Not Granted
                    </span>
                  )}
                  <button className="text-xs text-emerald-600 hover:underline ml-2">
                    Learn more
                  </button>
                </div>

                {/* Patient Summary */}
                {patientSummary ? (
                  <div className="space-y-4">
                    <h4
                      className={cn(
                        "text-lg font-bold text-slate-800",
                        bebasNeue.className,
                      )}
                    >
                      Health Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                        <p className="text-xs font-medium text-slate-500">
                          Allergies
                        </p>
                        {patientSummary.allergies.length > 0 ? (
                          <ul className="mt-1 space-y-1">
                            {patientSummary.allergies.map((a, i) => (
                              <li key={i} className="text-sm text-slate-700">
                                {a}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-400">
                            None recorded
                          </p>
                        )}
                      </div>
                      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                        <p className="text-xs font-medium text-slate-500">
                          Medications
                        </p>
                        {patientSummary.medications.length > 0 ? (
                          <ul className="mt-1 space-y-1">
                            {patientSummary.medications.map((m, i) => (
                              <li key={i} className="text-sm text-slate-700">
                                {m}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-400">
                            None recorded
                          </p>
                        )}
                      </div>
                      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60 col-span-2">
                        <p className="text-xs font-medium text-slate-500">
                          Conditions
                        </p>
                        {patientSummary.conditions.length > 0 ? (
                          <ul className="mt-1 space-y-1">
                            {patientSummary.conditions.map((c, i) => (
                              <li key={i} className="text-sm text-slate-700">
                                {c}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-400">
                            None recorded
                          </p>
                        )}
                      </div>
                      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60 col-span-2">
                        <p className="text-xs font-medium text-slate-500">
                          Recent Lab Results
                        </p>
                        {patientSummary.labResults.length > 0 ? (
                          <ul className="mt-1 space-y-1">
                            {patientSummary.labResults.map((l, i) => (
                              <li
                                key={i}
                                className="text-sm text-slate-700 flex justify-between"
                              >
                                <span>{l.name}</span>
                                <span className="text-xs text-slate-400">
                                  {l.date} – {l.result}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-400">
                            No lab results
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          referPatient(selectedPatient.id, "some-facility-id")
                        }
                        className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Refer
                      </button>
                      <button
                        onClick={() => importPatient(selectedPatient.id)}
                        disabled={importing}
                        className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        <Import className="w-4 h-4" />
                        {importing ? "Importing..." : "Import to my center"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
              <Network className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Select a patient to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Consent Dialog ────────────────────────────────────────── */}
      <AnimatePresence>
        {consentDialog && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80"
            >
              <h3
                className={cn(
                  "text-lg font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                {consentDialog.action === "view"
                  ? "View Patient Summary"
                  : "Import Patient"}
              </h3>
              <p className="text-sm text-slate-600 mt-2">
                {consentDialog.action === "view"
                  ? "This action requires the patient's consent. Proceed?"
                  : "Importing this patient will create a local record. Ensure you have consent."}
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setConsentDialog(null)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleConsentAction(
                      consentDialog.patientId,
                      consentDialog.action,
                    )
                  }
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-colors text-sm font-medium"
                >
                  Proceed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
