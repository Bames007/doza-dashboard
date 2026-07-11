import React from "react";
import { motion } from "framer-motion";
import { MedicRegistrationData, MedicRole } from "../type";
import { medicRoles } from "../data/constants";

interface RoleSelectionProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onNext: () => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({
  formData,
  updateFormData,
  onNext,
}) => {
  const handleRoleSelect = (role: MedicRole) => {
    updateFormData({
      professionalInfo: {
        ...formData.professionalInfo,
        role: role.id,
        specialties: [],
      },
    });
  };

  const isFormValid = formData.professionalInfo.role !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#28B04B]/10 to-[#28B04B]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#28B04B] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
        </motion.div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Welcome to <span className="text-[#28B04B]">Doza Network</span>
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
          Join Africa's fastest growing healthcare network. Select your
          professional role to get started.
        </p>
      </div>

      {/* Role Selection Grid */}
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Select Your Professional Role
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {medicRoles.map((role, index) => {
            const IconComponent = role.icon;
            const isSelected = formData.professionalInfo.role === role.id;

            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 10px 30px rgba(40, 176, 75, 0.15)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect(role)}
                className={`relative p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden group ${
                  isSelected
                    ? "border-[#28B04B] bg-gradient-to-br from-[#28B04B]/5 to-transparent"
                    : "border-gray-200 hover:border-[#28B04B]/50"
                }`}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-[#28B04B] rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                {/* Icon Container */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                    isSelected
                      ? "bg-[#28B04B] text-white"
                      : "bg-gray-100 text-gray-600 group-hover:bg-[#28B04B] group-hover:text-white"
                  }`}
                >
                  <IconComponent className="w-6 h-6" />
                </div>

                {/* Role Title */}
                <h3
                  className={`font-semibold text-gray-900 mb-2 transition-colors duration-300 ${
                    isSelected && "text-[#28B04B]"
                  }`}
                >
                  {role.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {role.description}
                </p>

                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#28B04B]/0 to-[#28B04B]/0 group-hover:from-[#28B04B]/5 group-hover:to-transparent transition-all duration-300 -z-10" />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Custom Role Input */}
      {formData.professionalInfo.role === "other" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-[#28B04B]/5 to-transparent rounded-2xl p-5 border border-[#28B04B]/20">
            <label className="block text-gray-700 font-medium mb-3">
              Specify Your Professional Role
            </label>
            <input
              type="text"
              value={formData.professionalInfo.customRole}
              onChange={(e) =>
                updateFormData({
                  professionalInfo: {
                    ...formData.professionalInfo,
                    customRole: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
              placeholder="e.g., Physical Therapist, Nutritionist..."
            />
          </div>
        </motion.div>
      )}

      {/* Continue Button */}
      {formData.professionalInfo.role !== "" &&
        formData.professionalInfo.role !== "other" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-end pt-6 border-t border-gray-100"
          >
            <button
              onClick={onNext}
              disabled={!isFormValid}
              className="group relative px-8 py-4 rounded-xl font-semibold overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Button Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-r from-[#28B04B] to-[#28B04B]/90 transition-all duration-300 ${
                  !isFormValid
                    ? "opacity-50"
                    : "group-hover:from-[#28B04B]/90 group-hover:to-[#28B04B]"
                }`}
              />

              {/* Button Text */}
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

              {/* Button Shine Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </button>
          </motion.div>
        )}

      {/* Bottom Indicator */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <div className="w-8 h-2 bg-[#28B04B] rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
      </div>
    </motion.div>
  );
};

export default RoleSelection;
