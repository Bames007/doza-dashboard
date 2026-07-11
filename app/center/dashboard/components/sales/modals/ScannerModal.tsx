import { FC, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Scan, X, Camera, Barcode, Search, Loader2 } from "lucide-react";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string, type: string) => void;
  centerId: string;
  userId: string;
}

const ScannerModal: FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  centerId,
  userId,
}) => {
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
    }
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setCameraError(null);
      setScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      setCameraError(
        error.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions."
          : "Failed to access camera. Please check your camera connection."
      );
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim(), "MANUAL");
      onClose();
    }
  };

  const captureFrame = () => {
    // This is a simplified barcode detection
    // In a real app, you would use a barcode scanning library
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        // Here you would process the image for barcode detection
        // For now, we'll simulate detection
        setTimeout(() => {
          onScan(`DEMO-${Date.now().toString().slice(-6)}`, "QR");
          onClose();
        }, 1000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scan className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Scan Barcode</h2>
                <p className="text-blue-100 text-sm">
                  Use camera or enter barcode manually
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Camera Preview */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover"
                  onLoadedMetadata={captureFrame}
                />
                <div className="absolute inset-0 border-2 border-blue-500 border-dashed m-8 pointer-events-none"></div>
              </>
            ) : cameraError ? (
              <div className="h-64 flex flex-col items-center justify-center p-4">
                <Camera className="w-12 h-12 text-red-400 mb-3" />
                <p className="text-red-300 text-center">{cameraError}</p>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center p-4">
                <Camera className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-400 text-center">
                  Click "Start Camera" to begin scanning
                </p>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="flex gap-3">
            <button
              onClick={scanning ? stopScanner : startScanner}
              className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                scanning
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {scanning ? (
                <>
                  <X className="w-5 h-5" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Start Camera
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Manual Input */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Barcode className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium text-gray-700">Manual Entry</h3>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                placeholder="Enter barcode, SKU, or product name"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleManualSubmit}
                disabled={!manualInput.trim() || loading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                Search
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Enter product barcode, SKU, or name to search
            </p>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Scanning Tips:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ensure good lighting when using camera</li>
              <li>• Hold steady about 15-30cm from barcode</li>
              <li>• Clean camera lens for better detection</li>
              <li>• Use manual entry if camera is unavailable</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ScannerModal;
