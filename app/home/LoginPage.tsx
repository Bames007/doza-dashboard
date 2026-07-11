"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Building,
  Shield,
  AlertCircle,
  Mail,
  Phone,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { bebasNeue, poppins } from "../utils/constants";
import Image from "next/image";
import LoadingScreen from "../center/dashboard/dashboards/components/LoadingScreen";

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    centerName: "",
    otp: "",
  });
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",
    centerName: "",
    otp: "",
  });

  const router = useRouter();

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "Full name is required";
        if (value.trim().length < 2)
          return "Full name must be at least 2 characters";
        return "";
      case "centerName":
        if (!value.trim()) return "Center name is required";
        return "";
      case "otp":
        if (!value.trim()) return "Verification code is required";
        if (value.length !== 6) return "Code must be exactly 6 digits";
        if (!/^\d+$/.test(value)) return "Code must contain only numbers";
        return "";
      default:
        return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "otp" && value && !/^\d*$/.test(value)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const hasErrors = () => {
    return (
      Object.values(fieldErrors).some((error) => error !== "") ||
      !formData.fullName.trim() ||
      !formData.centerName.trim() ||
      !formData.otp.trim()
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setFieldErrors({
      fullName: "",
      centerName: "",
      otp: "",
    });

    const newFieldErrors = {
      fullName: validateField("fullName", formData.fullName),
      centerName: validateField("centerName", formData.centerName),
      otp: validateField("otp", formData.otp),
    };

    setFieldErrors(newFieldErrors);

    if (Object.values(newFieldErrors).some((error) => error !== "")) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          centerName: formData.centerName.trim(),
          otp: formData.otp.trim(),
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        setError(
          `Server returned an invalid response (HTTP ${response.status}). Please try again later.`,
        );
        setLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMessage =
          data.error ||
          data.message ||
          "Login failed. Please check your credentials.";

        if (errorMessage.includes("Center not found")) {
          errorMessage =
            "Healthcare center not found. Please check the center name and try again.";
        } else if (errorMessage.includes("Staff member not found")) {
          errorMessage =
            "Staff member not found. Please check your full name and try again.";
        } else if (
          errorMessage.includes("Invalid verification code") ||
          errorMessage.includes("OTP")
        ) {
          errorMessage =
            "The verification code is incorrect. Please use the code that was provided during your center registration.";
        } else if (errorMessage.includes("No staff")) {
          errorMessage =
            "No staff members are registered for this center. Please contact the center owner.";
        } else if (errorMessage.includes("No OTP found")) {
          errorMessage =
            "This center is not properly configured. Please contact support.";
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data.success) {
        const sessionResponse = await fetch("/api/auth/set-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data.data),
        });

        const sessionData = await sessionResponse.json();

        if (!sessionResponse.ok) {
          throw new Error("Failed to create secure session");
        }

        const sessionWithExpiry = {
          ...data.data,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };

        localStorage.setItem("userSession", JSON.stringify(sessionWithExpiry));
        localStorage.setItem(
          "authToken",
          `doza-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        );
        localStorage.setItem("loginTime", new Date().toISOString());
        localStorage.setItem("lastActivity", Date.now().toString());

        window.addEventListener("storage", (e) => {
          if (e.key === "logout") {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/";
          }
        });

        const userRole = data.data.user.role;
        const isOwner = data.data.user.isOwner;

        if (
          isOwner ||
          userRole === "owner" ||
          userRole === "admin" ||
          userRole === "center_owner"
        ) {
          router.push("/center/dashboard");
        } else {
          router.push("/center/dashboard");
        }
      } else {
        setError(data.error || "Login failed");
        setLoading(false);
      }
    } catch (err: any) {
      setError(
        err.message ||
          "Login failed. Please check your credentials and try again.",
      );
      setLoading(false);
    }
  };

  const handleGetHelp = () => {
    window.location.href =
      "mailto:support@doza.com?subject=Login Assistance&body=Please help me with login access to my healthcare center.";
  };

  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

  return (
    <div
      className={`min-h-screen bg-slate-50 selection:bg-emerald-100 ${poppins.className}`}
    >
      <AnimatePresence>{loading && <LoadingScreen />}</AnimatePresence>

      {/* Dynamic Background Blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)] border border-white overflow-hidden"
        >
          {/* LEFT COLUMN: BRANDING (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-emerald-600 to-teal-700 p-16 flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700" />
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:32px_32px]" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-16">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Image
                    src="/logo.png"
                    alt="Doza Logo"
                    width={28}
                    height={28}
                  />
                </div>
                <span
                  className={`text-2xl tracking-tighter font-bold text-white ${bebasNeue.className}`}
                >
                  DOZA
                </span>
              </div>

              <h1
                className={`text-6xl font-bold text-white leading-[0.95] mb-8 ${bebasNeue.className}`}
              >
                STAFF <br />{" "}
                <span className="text-emerald-200 text-7xl">ACCESS.</span>
              </h1>
              <p className="text-emerald-50/70 text-lg leading-relaxed max-w-sm">
                Secure portal for healthcare professionals to manage patients,
                appointments, and center operations.
              </p>
            </div>

            <div className="relative z-10 space-y-8">
              <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                <div className="flex items-center gap-4 text-white">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">HIPAA Compliant</p>
                    <p className="text-xs text-emerald-100/60">
                      Your data is encrypted end-to-end.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LOGIN FORM */}
          <div className="lg:col-span-7 p-8 md:p-16 lg:p-20 flex flex-col justify-center bg-white/50">
            <div className="max-w-md mx-auto w-full">
              {/* Mobile Branding */}
              <div className="lg:hidden flex items-center justify-between mb-12">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="Doza Logo"
                    width={32}
                    height={32}
                  />
                  <span
                    className={`text-2xl font-bold text-slate-900 ${bebasNeue.className}`}
                  >
                    DOZA
                  </span>
                </div>
              </div>

              <header className="mb-10 text-left">
                <h2
                  className={`text-5xl font-bold text-slate-700 mb-2 ${bebasNeue.className}`}
                >
                  Staff Login
                </h2>
                <p className="text-slate-500 font-medium">
                  Access your healthcare center management system.
                </p>
              </header>

              {/* Error Handling */}
              {(error || Object.values(fieldErrors).some((err) => err)) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3 mb-8"
                >
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Authentication Error</p>
                        <p className="opacity-80">{error}</p>
                      </div>
                    </div>
                  )}
                  {Object.values(fieldErrors).some((err) => err) && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Please fix the following issues:
                      </p>
                      <ul className="text-xs text-amber-700 mt-1 list-disc list-inside space-y-1">
                        {fieldErrors.fullName && (
                          <li>Full name: {fieldErrors.fullName}</li>
                        )}
                        {fieldErrors.centerName && (
                          <li>Center name: {fieldErrors.centerName}</li>
                        )}
                        {fieldErrors.otp && (
                          <li>Verification code: {fieldErrors.otp}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                {/* Full Name Field */}
                <div>
                  <div className="flex justify-between items-end mb-2 ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Full Name
                    </label>
                    {fieldErrors.fullName && (
                      <span className="text-[10px] font-bold text-red-500 uppercase italic">
                        {fieldErrors.fullName}
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"
                      size={18}
                    />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className={`w-full bg-slate-100 border-2 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 transition-all outline-none 
                        ${fieldErrors.fullName ? "border-red-200 bg-red-50/30" : "border-transparent focus:bg-white focus:border-emerald-500"}`}
                      placeholder="Enter your registered full name"
                      required
                    />
                  </div>
                </div>

                {/* Center Name Field */}
                <div>
                  <div className="flex justify-between items-end mb-2 ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Center Name
                    </label>
                    {fieldErrors.centerName && (
                      <span className="text-[10px] font-bold text-red-500 uppercase italic">
                        {fieldErrors.centerName}
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <Building
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"
                      size={18}
                    />
                    <input
                      type="text"
                      name="centerName"
                      value={formData.centerName}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className={`w-full bg-slate-100 border-2 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 transition-all outline-none 
                        ${fieldErrors.centerName ? "border-red-200 bg-red-50/30" : "border-transparent focus:bg-white focus:border-emerald-500"}`}
                      placeholder="Enter your healthcare center name"
                      required
                    />
                  </div>
                </div>

                {/* OTP Field */}
                <div>
                  <div className="flex justify-between items-end mb-2 ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Verification Code
                    </label>
                    {fieldErrors.otp && (
                      <span className="text-[10px] font-bold text-red-500 uppercase italic">
                        {fieldErrors.otp}
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"
                      size={18}
                    />
                    <input
                      type={showOtp ? "text" : "password"}
                      name="otp"
                      value={formData.otp}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      maxLength={6}
                      className={`w-full bg-slate-100 border-2 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-slate-900 transition-all outline-none 
                        ${fieldErrors.otp ? "border-red-200 bg-red-50/30" : "border-transparent focus:bg-white focus:border-emerald-500"}`}
                      placeholder="Enter 6-digit verification code"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOtp(!showOtp)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                    >
                      {showOtp ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || hasErrors()}
                  className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 group shadow-2xl shadow-slate-900/10 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <>
                      ACCESS CENTER{" "}
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </motion.button>
              </form>

              <footer className="mt-12 text-center">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={handleGetHelp}
                    className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"
                  >
                    <Mail size={14} /> Email Support
                  </button>
                  <span className="text-slate-300">•</span>
                  <a
                    href="tel:+2348127728084"
                    className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"
                  >
                    <Phone size={14} /> Call Support
                  </a>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-center">
                  <button
                    onClick={() => router.push("/")}
                    className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"
                  >
                    <ChevronLeft size={14} /> Back to Site
                  </button>
                </div>
              </footer>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
