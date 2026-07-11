import React, { ChangeEvent } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  CheckCircle,
  X,
  Shield,
  FileCheck,
} from "lucide-react";
import { MedicRegistrationData } from "../type";
import { documentTypes } from "../data/constants";

interface CredentialsUploadProps {
  formData: MedicRegistrationData;
  updateFormData: (updates: Partial<MedicRegistrationData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const CredentialsUpload: React.FC<CredentialsUploadProps> = ({
  formData,
  updateFormData,
  onBack,
  onNext,
}) => {
  const handleFileUpload = (
    documentType: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    const maxSize =
      documentTypes.find((doc) => doc.id === documentType)?.maxSize || 5;
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Check file type
    const acceptedFormats =
      documentTypes.find((doc) => doc.id === documentType)?.acceptedFormats ||
      [];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension || "")) {
      alert(
        `Please upload a file in one of these formats: ${acceptedFormats.join(
          ", "
        )}`
      );
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    const existingDocIndex = formData.credentials.documents.findIndex(
      (doc) => doc.type === documentType
    );

    const updatedDocuments = [...formData.credentials.documents];

    if (existingDocIndex >= 0) {
      updatedDocuments[existingDocIndex] = {
        type: documentType,
        fileUrl,
        fileName: file.name,
        uploadDate: new Date().toISOString(),
      };
    } else {
      updatedDocuments.push({
        type: documentType,
        fileUrl,
        fileName: file.name,
        uploadDate: new Date().toISOString(),
      });
    }

    updateFormData({
      credentials: {
        ...formData.credentials,
        documents: updatedDocuments,
      },
    });
  };

  const removeDocument = (documentType: string) => {
    updateFormData({
      credentials: {
        ...formData.credentials,
        documents: formData.credentials.documents.filter(
          (doc) => doc.type !== documentType
        ),
      },
    });
  };

  const getDocument = (documentType: string) => {
    return formData.credentials.documents.find(
      (doc) => doc.type === documentType
    );
  };

  const isFormValid = documentTypes
    .filter((doc) => doc.required)
    .every((doc) => getDocument(doc.id));

  const uploadedCount = documentTypes.filter((doc) =>
    getDocument(doc.id)
  ).length;
  const totalRequired = documentTypes.filter((doc) => doc.required).length;

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
          <FileCheck className="text-[#28B04B]" size={32} />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Document Verification
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Upload required documents for credential verification
        </p>
      </div>

      {/* Progress Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Documents Uploaded
          </span>
          <span className="text-sm font-semibold text-[#28B04B]">
            {uploadedCount} / {documentTypes.length}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{
              width: `${(uploadedCount / documentTypes.length) * 100}%`,
            }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-[#28B04B] to-[#28B04B]/70"
          />
        </div>
      </motion.div>

      {/* Document Upload Areas */}
      <div className="space-y-4 mb-8">
        {documentTypes.map((docType, index) => {
          const uploadedDoc = getDocument(docType.id);

          return (
            <motion.div
              key={docType.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all ${
                uploadedDoc
                  ? "border-[#28B04B] bg-gradient-to-r from-[#28B04B]/5 to-transparent"
                  : "border-dashed border-gray-300 hover:border-[#28B04B]"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        uploadedDoc
                          ? "bg-[#28B04B] text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {docType.label}{" "}
                        {docType.required && (
                          <span className="text-[#28B04B]">*</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {docType.acceptedFormats.join(", ")} • Max{" "}
                        {docType.maxSize}MB
                      </p>
                    </div>
                  </div>
                </div>

                {uploadedDoc && (
                  <div className="flex items-center gap-2 text-[#28B04B]">
                    <CheckCircle size={20} />
                    <span className="text-sm font-medium">Uploaded</span>
                  </div>
                )}
              </div>

              {uploadedDoc ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#28B04B]/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#28B04B]/10 rounded-lg flex items-center justify-center">
                      <FileText size={16} className="text-[#28B04B]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-xs">
                        {uploadedDoc.fileName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Uploaded{" "}
                        {new Date(uploadedDoc.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDocument(docType.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </motion.div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#28B04B] hover:bg-gradient-to-r hover:from-[#28B04B]/5 hover:to-transparent transition-all group">
                    <Upload
                      size={40}
                      className="text-gray-400 mb-3 group-hover:text-[#28B04B] transition-colors"
                    />
                    <p className="text-gray-600 text-center">
                      Click to upload {docType.label.toLowerCase()}
                      <br />
                      <span className="text-sm text-gray-500">
                        Drag & drop or click to browse
                      </span>
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept={docType.acceptedFormats.join(",")}
                    onChange={(e) => handleFileUpload(docType.id, e)}
                  />
                </label>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-[#28B04B]/5 to-transparent rounded-2xl border border-[#28B04B]/20">
          <Shield className="text-[#28B04B] mt-1 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Secure Document Handling
            </h4>
            <p className="text-sm text-gray-700">
              All documents are encrypted end-to-end and stored securely. Your
              information is protected and will only be used for verification
              purposes.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row justify-between gap-4"
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
            Continue to Agreement
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

export default CredentialsUpload;
