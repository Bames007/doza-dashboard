import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  MapPin,
  Languages,
  Home,
  Video,
  User,
  Globe,
  AlertCircle,
  Check,
} from "lucide-react";
import { MedicRegistrationData } from "../type";
import NairaIcon from "./NairaIcon"; // Import the NairaIcon component

interface PracticeInfoProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onBack: () => void;
  onNext: () => void;
  getLocationFromMap: () => void;
}

const PracticeInfo: React.FC<PracticeInfoProps> = ({
  formData,
  updateFormData,
  onBack,
  onNext,
  getLocationFromMap,
}) => {
  const commonLanguages = [
    "English",
    "Yoruba",
    "Hausa",
    "Igbo",
    "Ibibio",
    "Arabic",
    "Hindi",
    "Portuguese",
  ];

  const toggleLanguage = (language: string) => {
    const currentLanguages = formData.practiceInfo.languages;
    const updatedLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter((l) => l !== language)
      : [...currentLanguages, language];

    updateFormData({
      practiceInfo: {
        ...formData.practiceInfo,
        languages: updatedLanguages,
      },
    });
  };

  const toggleConsultationType = (
    type: keyof typeof formData.practiceInfo.consultationTypes
  ) => {
    updateFormData({
      practiceInfo: {
        ...formData.practiceInfo,
        consultationTypes: {
          ...formData.practiceInfo.consultationTypes,
          [type]: !formData.practiceInfo.consultationTypes[type],
        },
      },
    });
  };

  const toggleDay = (day: string) => {
    const currentDays = formData.practiceInfo.availability.days;
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];

    updateFormData({
      practiceInfo: {
        ...formData.practiceInfo,
        availability: {
          ...formData.practiceInfo.availability,
          days: updatedDays,
        },
      },
    });
  };

  const isFormValid =
    formData.practiceInfo.hourlyRate > 0 &&
    formData.location.address.trim() !== "" &&
    formData.location.city.trim() !== "" &&
    formData.location.state.trim() !== "" &&
    formData.location.country.trim() !== "" &&
    Object.values(formData.practiceInfo.consultationTypes).some(
      (value) => value
    ) &&
    formData.practiceInfo.availability.days.length > 0;

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  // Nigerian states for dropdown
  const nigerianStates = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "FCT",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
  ];

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
          <Globe className="text-[#28B04B]" size={32} />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Practice Setup
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Configure your practice details and availability on Doza Network
        </p>
      </div>

      <div className="space-y-8">
        {/* Consultation Types */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <span className="text-[#28B04B]">*</span> Consultation Types
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { type: "inPerson", icon: User, label: "In-Person" },
              { type: "online", icon: Video, label: "Online" },
              { type: "homeVisit", icon: Home, label: "Home Visit" },
            ].map((item, index) => {
              const isSelected =
                formData.practiceInfo.consultationTypes[
                  item.type as keyof typeof formData.practiceInfo.consultationTypes
                ];

              return (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    toggleConsultationType(
                      item.type as keyof typeof formData.practiceInfo.consultationTypes
                    )
                  }
                  className={`relative flex flex-col items-center p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#28B04B] bg-gradient-to-b from-[#28B04B]/5 to-transparent"
                      : "border-gray-200 hover:border-[#28B04B]/50"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-all ${
                      isSelected
                        ? "bg-[#28B04B] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <item.icon size={24} />
                  </div>
                  <span className="font-medium text-gray-700">
                    {item.label}
                  </span>

                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-[#28B04B] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Selected Consultation Types Counter */}
          {Object.values(formData.practiceInfo.consultationTypes).filter(
            Boolean
          ).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-[#28B04B] rounded-full animate-pulse" />
              <span className="text-sm text-[#28B04B] font-medium">
                {
                  Object.values(formData.practiceInfo.consultationTypes).filter(
                    Boolean
                  ).length
                }{" "}
                type(s) selected
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Hourly Rate */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <span className="text-[#28B04B]">*</span> Consultation Rate (NGN)
          </h3>
          <div className="max-w-md">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <NairaIcon className="w-5 h-5" />
              </div>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.practiceInfo.hourlyRate}
                onChange={(e) =>
                  updateFormData({
                    practiceInfo: {
                      ...formData.practiceInfo,
                      hourlyRate: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-full pl-12 pr-24 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
                placeholder="Enter hourly rate"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                / hour
              </span>
            </div>

            {/* Rate Range Indicator */}
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-600">
                  Recommended rate range:
                </span>
                <span className="text-sm font-semibold text-[#28B04B]">
                  ₦5,000 - ₦15,000
                </span>
              </div>

              {/* Rate Bar */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#28B04B]/50 to-[#28B04B] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (formData.practiceInfo.hourlyRate / 15000) * 100
                    )}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>₦0</span>
                <span>₦15,000+</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Availability */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <span className="text-[#28B04B]">*</span> Availability
          </h3>

          {/* Days */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-3 font-medium">
              Available Days
            </label>
            <div className="flex flex-wrap gap-2">
              {days.map((day, index) => {
                const isSelected =
                  formData.practiceInfo.availability.days.includes(day);

                return (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleDay(day)}
                    className={`relative px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#28B04B] text-white border-[#28B04B] shadow-sm"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:border-[#28B04B]/50"
                    }`}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border border-[#28B04B] flex items-center justify-center">
                        <Check className="w-2 h-2 text-[#28B04B]" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Selected Days Counter */}
            {formData.practiceInfo.availability.days.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-[#28B04B] rounded-full animate-pulse" />
                <span className="text-sm text-[#28B04B] font-medium">
                  {formData.practiceInfo.availability.days.length} day(s)
                  selected
                </span>
              </motion.div>
            )}
          </div>

          {/* Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                Start Time
              </label>
              <div className="relative">
                <Clock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="time"
                  value={formData.practiceInfo.availability.hours.start}
                  onChange={(e) =>
                    updateFormData({
                      practiceInfo: {
                        ...formData.practiceInfo,
                        availability: {
                          ...formData.practiceInfo.availability,
                          hours: {
                            ...formData.practiceInfo.availability.hours,
                            start: e.target.value,
                          },
                        },
                      },
                    })
                  }
                  className="w-full pl-12 pr-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                End Time
              </label>
              <div className="relative">
                <Clock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="time"
                  value={formData.practiceInfo.availability.hours.end}
                  onChange={(e) =>
                    updateFormData({
                      practiceInfo: {
                        ...formData.practiceInfo,
                        availability: {
                          ...formData.practiceInfo.availability,
                          hours: {
                            ...formData.practiceInfo.availability.hours,
                            end: e.target.value,
                          },
                        },
                      },
                    })
                  }
                  className="w-full pl-12 pr-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Emergency Availability */}
          <div
            onClick={(e) =>
              updateFormData({
                practiceInfo: {
                  ...formData.practiceInfo,
                  availability: {
                    ...formData.practiceInfo.availability,
                    emergencyAvailable:
                      !formData.practiceInfo.availability.emergencyAvailable,
                  },
                },
              })
            }
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#28B04B]/50 transition-all cursor-pointer"
          >
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                formData.practiceInfo.availability.emergencyAvailable
                  ? "border-[#28B04B] bg-[#28B04B]"
                  : "border-gray-300"
              }`}
            >
              {formData.practiceInfo.availability.emergencyAvailable && (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>
            <div className="flex-1">
              <span className="font-medium text-gray-700">
                Available for emergency consultations
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Get priority listing for urgent cases
              </p>
            </div>
            {formData.practiceInfo.availability.emergencyAvailable && (
              <div className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded">
                Priority
              </div>
            )}
          </div>
        </motion.div>

        {/* Languages */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Languages Spoken
          </h3>
          <div className="flex flex-wrap gap-2">
            {commonLanguages.map((language, index) => {
              const isSelected =
                formData.practiceInfo.languages.includes(language);

              return (
                <motion.div
                  key={language}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleLanguage(language)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#28B04B] text-white border-[#28B04B]"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:border-[#28B04B]/50"
                  }`}
                >
                  <Languages size={16} />
                  {language}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border border-[#28B04B] flex items-center justify-center">
                      <Check className="w-2 h-2 text-[#28B04B]" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Selected Languages Counter */}
          {formData.practiceInfo.languages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-[#28B04B] rounded-full animate-pulse" />
              <span className="text-sm text-[#28B04B] font-medium">
                {formData.practiceInfo.languages.length} language(s) selected
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <span className="text-[#28B04B]">*</span> Practice Location
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                Street Address
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) =>
                    updateFormData({
                      location: {
                        ...formData.location,
                        address: e.target.value,
                      },
                    })
                  }
                  className="w-full pl-12 pr-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
                  placeholder="Enter your practice address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  City
                </label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) =>
                    updateFormData({
                      location: {
                        ...formData.location,
                        city: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  State
                </label>
                <select
                  value={formData.location.state}
                  onChange={(e) =>
                    updateFormData({
                      location: {
                        ...formData.location,
                        state: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all bg-white"
                >
                  <option value="">Select State</option>
                  {nigerianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Country
                </label>
                <select
                  value={formData.location.country}
                  onChange={(e) =>
                    updateFormData({
                      location: {
                        ...formData.location,
                        country: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-4 text-gray-600 rounded-xl border border-gray-300 focus:border-[#28B04B] focus:ring-2 focus:ring-[#28B04B]/20 outline-none transition-all bg-white"
                >
                  <option value="">Select Country</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Service Radius */}
            {formData.practiceInfo.consultationTypes.homeVisit && (
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-medium text-gray-700">
                    Home Visit Service Radius
                  </label>
                  <span className="text-lg font-semibold text-[#28B04B]">
                    {formData.location.serviceRadius} km
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={formData.location.serviceRadius}
                  onChange={(e) =>
                    updateFormData({
                      location: {
                        ...formData.location,
                        serviceRadius: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#28B04B]"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>5 km</span>
                  <span>100 km</span>
                </div>

                {/* Service Radius Info */}
                <div className="mt-3 p-3 bg-[#28B04B]/5 rounded-lg border border-[#28B04B]/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-[#28B04B] mt-0.5" />
                    <p className="text-sm text-gray-700">
                      Home visits available within{" "}
                      {formData.location.serviceRadius}km radius from your
                      practice address.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={getLocationFromMap}
              className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#28B04B] hover:bg-gradient-to-r hover:from-[#28B04B]/5 hover:to-transparent transition-all"
            >
              <MapPin size={20} className="text-[#28B04B]" />
              <span className="font-medium text-gray-700">
                Select location on map
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
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
            Continue to Documents
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

export default PracticeInfo;
