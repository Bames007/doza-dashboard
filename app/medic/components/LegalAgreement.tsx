import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  FileText,
  Lock,
  Eye,
  Target,
  Check,
} from "lucide-react";
import { MedicRegistrationData } from "../type";

interface LegalAgreementProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

const LegalAgreement: React.FC<LegalAgreementProps> = ({
  formData,
  updateFormData,
  onBack,
  onSubmit,
  isSubmitting,
}) => {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "quality">(
    "terms"
  );

  const handleSignatureChange = (signature: string) => {
    updateFormData({
      legal: {
        ...formData.legal,
        signature,
        date: new Date().toISOString(),
      },
    });
  };

  const isFormValid =
    formData.legal.agreedToTerms &&
    formData.legal.agreedToPrivacy &&
    formData.legal.agreedToCommitment &&
    formData.legal.signature.trim() ===
      `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`;

  // Font style for signature - using a cursive font as fallback if alexBrush doesn't work
  const signatureFont = {
    fontFamily: "'Brush Script MT', 'Bradley Hand', cursive, sans-serif",
  };

  const tabs = [
    { id: "terms", label: "Terms of Service", icon: FileText },
    { id: "privacy", label: "Privacy Policy", icon: Eye },
    { id: "quality", label: "Quality Commitment", icon: Target },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "terms":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900 mb-2">
                1. Professional Commitment
              </p>
              <p className="text-gray-700">
                I agree to maintain regular activity on the platform and respond
                to patient inquiries within 24 hours during business days.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900 mb-2">
                2. Service Quality
              </p>
              <p className="text-gray-700">
                I commit to providing high-quality healthcare services and
                maintaining professional standards as per licensing board
                requirements.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900 mb-2">3. Revenue Share</p>
              <p className="text-gray-700">
                I agree to the platform's revenue sharing model of 15% per
                consultation, which supports platform maintenance and patient
                acquisition.
              </p>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900 mb-2">Data Protection</p>
              <p className="text-gray-700">
                Your professional information will be displayed to patients
                seeking healthcare services. We protect your personal contact
                information and facilitate communication through our secure
                platform.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900 mb-2">
                Patient Confidentiality
              </p>
              <p className="text-gray-700">
                Patient medical information is confidential and protected under
                healthcare privacy laws. You are responsible for maintaining
                patient confidentiality.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#28B04B]/5 to-transparent rounded-xl border border-[#28B04B]/20">
              <Lock className="text-[#28B04B]" size={20} />
              <div>
                <p className="font-medium text-gray-900">
                  End-to-end Encryption
                </p>
                <p className="text-sm text-gray-600">
                  All patient data is encrypted and protected
                </p>
              </div>
            </div>
          </div>
        );

      case "quality":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900 mb-2">
                Performance Metrics
              </p>
              <p className="text-gray-700">
                Your profile performance will be measured based on patient
                ratings, response times, and appointment completion rates.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900 mb-2">
                Continuous Engagement
              </p>
              <p className="text-gray-700">
                We expect professionals to maintain minimum platform activity
                levels to ensure patient access to quality care.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900 mb-2">
                Professional Development
              </p>
              <p className="text-gray-700">
                You agree to maintain current certifications and licenses
                required for your practice.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8 md:mb-10">
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring" }}
          className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#28B04B]/10 to-[#28B04B]/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
        >
          <Shield className="text-[#28B04B]" size={32} />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Professional Agreement
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Review and accept the terms to complete your registration
        </p>
      </div>

      {/* Important Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 p-5 bg-gradient-to-r from-[#28B04B]/5 to-transparent rounded-2xl border border-[#28B04B]/20"
      >
        <div className="flex items-start gap-4">
          <AlertTriangle
            className="text-[#28B04B] mt-1 flex-shrink-0"
            size={24}
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Important Notice
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              By joining Doza Network, you agree to maintain professional
              standards, respond to patient inquiries within 24 hours, and
              uphold the quality of care expected on our platform.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all relative ${
                  isActive
                    ? "text-[#28B04B]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#28B04B]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Terms Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          {/* Content */}
          <div className="max-h-96 overflow-y-auto p-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  {activeTab === "terms" && (
                    <FileText size={20} className="text-[#28B04B]" />
                  )}
                  {activeTab === "privacy" && (
                    <Eye size={20} className="text-[#28B04B]" />
                  )}
                  {activeTab === "quality" && (
                    <Target size={20} className="text-[#28B04B]" />
                  )}
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h4>
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Agreement Checkboxes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 mb-8"
      >
        {[
          {
            id: "terms",
            checked: formData.legal.agreedToTerms,
            label:
              "I agree to the Terms of Service and Professional Commitment requirements",
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData({
                legal: {
                  ...formData.legal,
                  agreedToTerms: e.target.checked,
                },
              }),
          },
          {
            id: "privacy",
            checked: formData.legal.agreedToPrivacy,
            label: "I agree to the Privacy Policy and data handling practices",
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData({
                legal: {
                  ...formData.legal,
                  agreedToPrivacy: e.target.checked,
                },
              }),
          },
          {
            id: "commitment",
            checked: formData.legal.agreedToCommitment,
            label:
              "I commit to maintaining active engagement and providing quality healthcare services",
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              updateFormData({
                legal: {
                  ...formData.legal,
                  agreedToCommitment: e.target.checked,
                },
              }),
          },
        ].map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            onClick={() =>
              item.onChange({ target: { checked: !item.checked } } as any)
            }
            className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#28B04B]/50 transition-all cursor-pointer"
          >
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 transition-all ${
                item.checked
                  ? "border-[#28B04B] bg-[#28B04B]"
                  : "border-gray-300"
              }`}
            >
              {item.checked && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-gray-700">{item.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Electronic Signature */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <label className="block text-gray-700 font-medium mb-4">
          <span className="text-[#28B04B]">*</span> Electronic Signature
          <span className="text-sm text-gray-500 block font-normal mt-1">
            Type your full name exactly as registered
          </span>
        </label>

        <div className="relative">
          <input
            type="text"
            value={formData.legal.signature}
            onChange={(e) => handleSignatureChange(e.target.value)}
            className={`w-full px-4 py-5 rounded-xl border-2 bg-gray-50 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all text-center text-3xl sm:text-4xl text-gray-800`}
            style={signatureFont}
            placeholder="Type your full name here"
          />

          {/* Signature Validation */}
          {formData.legal.signature && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <div
                className={`p-4 rounded-xl border ${
                  formData.legal.signature ===
                  `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`
                    ? "border-[#28B04B] bg-gradient-to-r from-[#28B04B]/5 to-transparent"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <p className="text-sm text-gray-600 mb-2">Signature Preview:</p>
                <p
                  className={`text-2xl text-center ${
                    formData.legal.signature ===
                    `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`
                      ? "text-[#28B04B]"
                      : "text-gray-800"
                  }`}
                  style={signatureFont}
                >
                  {formData.legal.signature}
                </p>
              </div>

              {formData.legal.signature &&
                formData.legal.signature !==
                  `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}` && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    Signature must match your registered name exactly
                  </p>
                )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row justify-between gap-4"
      >
        <button
          onClick={onBack}
          className="px-6 py-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-medium"
        >
          Back
        </button>

        <button
          onClick={onSubmit}
          disabled={!isFormValid || isSubmitting}
          className="group relative px-8 py-4 rounded-xl font-semibold overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div
            className={`absolute inset-0 bg-gradient-to-r from-[#28B04B] to-[#28B04B]/90 transition-all duration-300 ${
              !isFormValid
                ? "opacity-50"
                : "group-hover:from-[#28B04B]/90 group-hover:to-[#28B04B]"
            }`}
          />

          <span className="relative text-white flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Complete Registration
              </>
            )}
          </span>
        </button>
      </motion.div>
    </motion.div>
  );
};

export default LegalAgreement;
