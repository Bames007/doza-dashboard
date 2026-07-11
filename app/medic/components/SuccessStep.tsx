import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Mail, Phone, Users, Shield } from "lucide-react";
import { MedicRegistrationData } from "../type";
import { useRouter } from "next/router";

interface SuccessStepProps {
  formData: MedicRegistrationData;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ formData }) => {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl max-w-2xl mx-auto"
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="relative w-24 h-24 mx-auto mb-8"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#28B04B]/20 to-[#28B04B]/10 rounded-full animate-pulse" />
        <div className="absolute inset-4 bg-gradient-to-r from-[#28B04B] to-[#28B04B]/80 rounded-full flex items-center justify-center">
          <CheckCircle size={48} className="text-white" />
        </div>

        {/* Animated Rings */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{
            repeat: Infinity,
            duration: 2,
            delay: 0.5,
          }}
          className="absolute inset-0 border-2 border-[#28B04B]/30 rounded-full"
        />
      </motion.div>

      {/* Success Message */}
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-[#28B04B]">Doza Network</span>!
        </h2>
        <p className="text-gray-600 text-lg mb-2">
          Your application has been successfully submitted
        </p>
        <p className="text-gray-500 text-sm">
          Dr. {formData.personalInfo.firstName} {formData.personalInfo.lastName}
        </p>
      </div>

      {/* Verification Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-[#28B04B]/5 to-transparent rounded-2xl p-6 mb-8 border border-[#28B04B]/20"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#28B04B]/10 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-[#28B04B]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Application Status
              </h3>
              <p className="text-sm text-gray-600">Under Verification</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-[#28B04B]/10 text-[#28B04B] rounded-full text-sm font-medium">
            Pending Review
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "60%" }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-[#28B04B] to-[#28B04B]/70"
          />
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-10"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <Clock className="text-[#28B04B]" size={24} />
          What Happens Next?
        </h3>

        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Document Verification",
              desc: "Our team will verify your credentials within 24-48 hours",
              time: "24-48 hours",
            },
            {
              step: "2",
              title: "Profile Activation",
              desc: "Your profile will be activated on the Doza Network platform",
              time: "1-2 hours",
            },
            {
              step: "3",
              title: "Onboarding Session",
              desc: "Schedule a quick onboarding call with our support team",
              time: "30 minutes",
            },
            {
              step: "4",
              title: "Start Receiving Patients",
              desc: "Begin accepting appointments and consultations",
              time: "Immediately",
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition-all"
            >
              <div className="w-8 h-8 bg-[#28B04B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-[#28B04B] font-bold">{item.step}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {item.time}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Support Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="border-t pt-8"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
          Need Immediate Assistance?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="mailto:help@dozamedic.com"
            className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#28B04B] hover:bg-gradient-to-r hover:from-[#28B04B]/5 hover:to-transparent transition-all"
          >
            <div className="w-12 h-12 bg-[#28B04B]/10 rounded-lg flex items-center justify-center group-hover:bg-[#28B04B] transition-all">
              <Mail
                className="text-[#28B04B] group-hover:text-white transition-all"
                size={20}
              />
            </div>
            <div>
              <p className="font-medium text-gray-900">Email Support</p>
              <p className="text-sm text-gray-600">help@dozamedic.com</p>
            </div>
          </a>

          <a
            href="tel:+2348127728084"
            className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#28B04B] hover:bg-gradient-to-r hover:from-[#28B04B]/5 hover:to-transparent transition-all"
          >
            <div className="w-12 h-12 bg-[#28B04B]/10 rounded-lg flex items-center justify-center group-hover:bg-[#28B04B] transition-all">
              <Phone
                className="text-[#28B04B] group-hover:text-white transition-all"
                size={20}
              />
            </div>
            <div>
              <p className="font-medium text-gray-900">Phone Support</p>
              <p className="text-sm text-gray-600">+234 812 772 8084</p>
            </div>
          </a>
        </div>

        {/* Community */}
        <div className="mt-8 p-4 bg-gradient-to-r from-[#28B04B]/5 to-transparent rounded-xl border border-[#28B04B]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#28B04B] rounded-lg flex items-center justify-center">
              <Users className="text-white" size={20} />
            </div>
            <div>
              <p className="font-medium text-gray-900">Join Our Community</p>
              <p className="text-sm text-gray-600">
                Connect with other healthcare professionals on our platform
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Confetti Animation */}
      <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          className="h-full bg-gradient-to-r from-transparent via-[#28B04B] to-transparent"
        />
      </div>
    </motion.div>
  );
};

export default SuccessStep;
