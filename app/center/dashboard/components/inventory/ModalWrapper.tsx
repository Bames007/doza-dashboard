import React from "react";
import { motion } from "framer-motion";

interface ModalWrapperProps {
  children: React.ReactNode;
  onClose: () => void;
  fullScreen?: boolean;
}

export const ModalWrapper = ({
  children,
  onClose,
  fullScreen = false,
}: ModalWrapperProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 ${
      fullScreen ? "" : ""
    }`}
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      onClick={(e) => e.stopPropagation()}
      className={`w-full ${fullScreen ? "h-full" : "max-h-[95vh]"}`}
      style={{
        maxWidth: fullScreen ? "100%" : "min(96vw, 1400px)",
      }}
    >
      {children}
    </motion.div>
  </motion.div>
);
