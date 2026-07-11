import React, { ChangeEvent } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Calendar, Upload, Edit2 } from "lucide-react";
import { MedicRegistrationData } from "../type";

interface PersonalInfoProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const PersonalInfo: React.FC<PersonalInfoProps> = ({
  formData,
  updateFormData,
  onBack,
  onNext,
}) => {
  const handleInputChange = (
    field: keyof typeof formData.personalInfo,
    value: string
  ) => {
    updateFormData({
      personalInfo: {
        ...formData.personalInfo,
        [field]: value,
      },
    });
  };

  // In PersonalInfo.tsx, update handleFileUpload:
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Profile photo must be less than 2MB");
        return;
      }

      // Create a compressed version
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;

        // Create a compressed image
        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Set max dimensions
          const maxWidth = 400;
          const maxHeight = 400;

          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);

            // Get compressed data URL (quality 0.8 = 80% quality)
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);

            updateFormData({
              personalInfo: {
                ...formData.personalInfo,
                profilePhoto: compressedDataUrl,
              },
            });
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };
  const isFormValid =
    formData.personalInfo.firstName.trim() !== "" &&
    formData.personalInfo.lastName.trim() !== "" &&
    formData.personalInfo.email.trim() !== "" &&
    formData.personalInfo.phone.trim() !== "" &&
    formData.personalInfo.dateOfBirth.trim() !== "" &&
    formData.personalInfo.gender.trim() !== "";

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
          <User className="text-[#28B04B]" size={32} />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Personal Information
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Let's get to know you better
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Photo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <label className="block text-gray-700 mb-4 font-medium">
            Profile Photo
            <span className="text-sm text-gray-500 block font-normal mt-1">
              Add a professional photo for your profile
            </span>
          </label>

          <div className="flex flex-col items-center">
            <div className="relative group">
              {formData.personalInfo.profilePhoto ? (
                <>
                  <img
                    src={formData.personalInfo.profilePhoto}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleInputChange("profilePhoto", "")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </motion.button>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#28B04B]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center mb-4 group hover:border-[#28B04B] hover:bg-gradient-to-br hover:from-[#28B04B]/5 hover:to-transparent transition-all">
                  <User
                    size={48}
                    className="text-gray-400 group-hover:text-[#28B04B] transition-colors"
                  />
                </div>
              )}
            </div>

            <label className="cursor-pointer mt-4">
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#28B04B] to-[#28B04B]/90 text-white px-5 py-3 rounded-xl hover:from-[#28B04B]/90 hover:to-[#28B04B] transition-all shadow-sm">
                <Upload size={18} />
                <span className="font-medium">Upload Photo</span>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </motion.div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-gray-700 mb-2 font-medium">
              <span className="text-[#28B04B]">*</span> First Name
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={formData.personalInfo.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
                placeholder="Enter your first name"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-gray-700 mb-2 font-medium">
              <span className="text-[#28B04B]">*</span> Last Name
            </label>
            <input
              type="text"
              value={formData.personalInfo.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className="w-full px-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
              placeholder="Enter your last name"
            />
          </motion.div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-gray-700 mb-2 font-medium">
              <span className="text-[#28B04B]">*</span> Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="email"
                value={formData.personalInfo.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
                placeholder="your.email@example.com"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-gray-700 mb-2 font-medium">
              <span className="text-[#28B04B]">*</span> Phone Number
            </label>
            <div className="relative">
              <Phone
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="tel"
                value={formData.personalInfo.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
                placeholder="+234 812 772 8084"
              />
            </div>
          </motion.div>
        </div>

        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-gray-700 mb-2 font-medium">
              <span className="text-[#28B04B]">*</span> Date of Birth
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="date"
                value={formData.personalInfo.dateOfBirth}
                onChange={(e) =>
                  handleInputChange("dateOfBirth", e.target.value)
                }
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all text-gray-700"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-gray-700 mb-2 font-medium">
              <span className="text-[#28B04B]">*</span> Gender
            </label>
            <select
              value={formData.personalInfo.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all text-gray-700 bg-white"
            >
              <option value="" className="text-gray-400">
                Select Gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
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

export default PersonalInfo;
