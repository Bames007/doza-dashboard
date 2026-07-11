import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  GraduationCap,
  FileText,
  Plus,
  X,
  BookOpen,
  Check,
} from "lucide-react";
import { MedicRegistrationData } from "../type";
import { medicRoles } from "../data/constants";

interface ProfessionalInfoProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const ProfessionalInfo: React.FC<ProfessionalInfoProps> = ({
  formData,
  updateFormData,
  onBack,
  onNext,
}) => {
  const [newQualification, setNewQualification] = useState("");

  const selectedRole = medicRoles.find(
    (role) => role.id === formData.professionalInfo.role
  );

  const handleSpecialtyToggle = (specialty: string) => {
    const currentSpecialties = formData.professionalInfo.specialties;
    const updatedSpecialties = currentSpecialties.includes(specialty)
      ? currentSpecialties.filter((s) => s !== specialty)
      : [...currentSpecialties, specialty];

    updateFormData({
      professionalInfo: {
        ...formData.professionalInfo,
        specialties: updatedSpecialties,
      },
    });
  };

  const addQualification = () => {
    if (
      newQualification.trim() &&
      !formData.professionalInfo.qualifications.includes(
        newQualification.trim()
      )
    ) {
      updateFormData({
        professionalInfo: {
          ...formData.professionalInfo,
          qualifications: [
            ...formData.professionalInfo.qualifications,
            newQualification.trim(),
          ],
        },
      });
      setNewQualification("");
    }
  };

  const removeQualification = (qualification: string) => {
    updateFormData({
      professionalInfo: {
        ...formData.professionalInfo,
        qualifications: formData.professionalInfo.qualifications.filter(
          (q) => q !== qualification
        ),
      },
    });
  };

  const isFormValid =
    formData.professionalInfo.licenseNumber.trim() !== "" &&
    formData.professionalInfo.yearsOfExperience > 0 &&
    formData.professionalInfo.specialties.length > 0 &&
    formData.professionalInfo.qualifications.length > 0;

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
          <Award className="text-[#28B04B]" size={32} />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Professional Credentials
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Verify your expertise to join the Doza Network
        </p>
      </div>

      <div className="space-y-6">
        {/* License Number */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-gray-700 font-medium mb-3">
            <span className="text-[#28B04B]">*</span> Professional License
            Number
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <FileText size={20} />
            </div>
            <input
              type="text"
              value={formData.professionalInfo.licenseNumber}
              onChange={(e) =>
                updateFormData({
                  professionalInfo: {
                    ...formData.professionalInfo,
                    licenseNumber: e.target.value,
                  },
                })
              }
              className="w-full pl-12 pr-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
              placeholder="Enter your license number"
            />
          </div>
        </motion.div>

        {/* Experience */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="block text-gray-700 font-medium mb-3">
            <span className="text-[#28B04B]">*</span> Years of Experience
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <BookOpen size={20} />
            </div>
            <input
              type="number"
              min="0"
              max="50"
              value={formData.professionalInfo.yearsOfExperience}
              onChange={(e) =>
                updateFormData({
                  professionalInfo: {
                    ...formData.professionalInfo,
                    yearsOfExperience: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full pl-12 pr-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
              placeholder="Number of years in practice"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              years
            </span>
          </div>
        </motion.div>

        {/* Specialties - FIXED VERSION */}
        {selectedRole && selectedRole.specialties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-gray-700 font-medium mb-4">
              <span className="text-[#28B04B]">*</span> Specialties (Select all
              that apply)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedRole.specialties.map((specialty, index) => {
                const isSelected =
                  formData.professionalInfo.specialties.includes(specialty);

                return (
                  <motion.div
                    key={specialty}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSpecialtyToggle(specialty)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all group ${
                      isSelected
                        ? "border-[#28B04B] bg-gradient-to-r from-[#28B04B]/5 to-transparent"
                        : "border-gray-200 hover:border-[#28B04B]/50"
                    }`}
                  >
                    {/* Checkbox container */}
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mr-3 transition-all flex-shrink-0 ${
                          isSelected
                            ? "border-[#28B04B] bg-[#28B04B]"
                            : "border-gray-300 bg-white group-hover:border-[#28B04B]/50"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-gray-700">{specialty}</span>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-[#28B04B] rounded-full" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Selected specialties counter */}
            {formData.professionalInfo.specialties.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 text-sm"
              >
                <div className="w-2 h-2 bg-[#28B04B] rounded-full animate-pulse" />
                <span className="text-[#28B04B] font-medium">
                  {formData.professionalInfo.specialties.length} specialty
                  selected
                  {formData.professionalInfo.specialties.length > 1 ? "s" : ""}
                </span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Custom Specialty - Show only when no specialties available or none selected */}
        {(!selectedRole || selectedRole.specialties.length === 0) && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className="block text-gray-700 font-medium mb-3">
              <span className="text-[#28B04B]">*</span> Please specify your
              specialty
            </label>
            <input
              type="text"
              value={formData.professionalInfo.customSpecialty}
              onChange={(e) =>
                updateFormData({
                  professionalInfo: {
                    ...formData.professionalInfo,
                    customSpecialty: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
              placeholder="Enter your primary specialty"
            />
          </motion.div>
        )}

        {/* Qualifications */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-gray-700 font-medium mb-4">
            <span className="text-[#28B04B]">*</span> Qualifications &
            Certifications
          </label>
          <div className="space-y-3">
            {formData.professionalInfo.qualifications.map(
              (qualification, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#28B04B]/10 rounded-lg flex items-center justify-center">
                      <GraduationCap size={16} className="text-[#28B04B]" />
                    </div>
                    <span className="text-gray-700">{qualification}</span>
                  </div>
                  <button
                    onClick={() => removeQualification(qualification)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <X size={18} />
                  </button>
                </motion.div>
              )
            )}

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addQualification()}
                  className="w-full pl-4 pr-12 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
                  placeholder="Add a qualification or certification"
                />
                <button
                  onClick={addQualification}
                  disabled={!newQualification.trim()}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                    newQualification.trim()
                      ? "bg-[#28B04B] text-white hover:bg-[#28B04B]/90"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Professional Bio */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          <label className="block text-gray-700 font-medium mb-3">
            Professional Bio
            <span className="text-sm text-gray-500 block font-normal mt-1">
              Briefly describe your professional background and approach
            </span>
          </label>
          <textarea
            value={formData.professionalInfo.bio}
            onChange={(e) =>
              updateFormData({
                professionalInfo: {
                  ...formData.professionalInfo,
                  bio: e.target.value,
                },
              })
            }
            rows={4}
            className="w-full px-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all resize-none"
            placeholder="Describe your professional experience, approach to care, and any special expertise..."
          />
        </motion.div>
      </div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row justify-between gap-4 mt-10 pt-6 border-t border-gray-100"
      >
        <button
          onClick={onBack}
          className="px-6 py-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-medium"
        >
          Back
        </button>

        <button
          onClick={onNext}
          disabled={!isFormValid}
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
            Continue
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </span>
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ProfessionalInfo;
