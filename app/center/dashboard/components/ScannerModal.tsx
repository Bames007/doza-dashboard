"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Barcode, QrCode, Camera, Key } from "lucide-react";

interface ScannerModalProps {
  onClose: () => void;
  onScan: (barcode: string, type: string) => void;
  onManualEntry: (barcode: string) => void;
}

export const ScannerModal = ({
  onClose,
  onScan,
  onManualEntry,
}: ScannerModalProps) => {
  const [scanMode, setScanMode] = useState<"barcode" | "qr" | "manual">(
    "barcode"
  );
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannerInput, setScannerInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("Ready to scan...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const scannerInputRef = useRef("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Improved barcode scanner input handler
  const handleBarcodeInput = useCallback(
    (input: string) => {
      console.log("Barcode input detected:", input);

      // Validate barcode length (EAN-13 is 13 digits, UPC is 12, etc.)
      if (input.length >= 8 && input.length <= 13) {
        setScannerStatus(`Scanned: ${input}`);
        setScannerInput(input);

        // Process the barcode after a short delay
        setTimeout(() => {
          onScan(input, scanMode === "barcode" ? "EAN13" : "QR");
          onClose();
        }, 500);
      } else if (input.length > 0) {
        setScannerStatus(`Invalid barcode length: ${input.length} digits`);
      }
    },
    [onScan, onClose, scanMode]
  );

  // Keyboard event handler for barcode scanners
  useEffect(() => {
    let input = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent handling if we're in manual mode and input is focused
      if (
        scanMode === "manual" &&
        document.activeElement === manualInputRef.current
      ) {
        return;
      }

      // Barcode scanners typically send characters quickly without modifier keys
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const currentTime = Date.now();

        // If more than 100ms since last key, reset input (scanner sends quickly)
        if (currentTime - lastKeyTime > 100) {
          input = "";
        }

        input += e.key;
        lastKeyTime = currentTime;
        setScannerInput(input);
        setScannerStatus(`Scanning... ${input}`);

        // Clear previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set timeout to detect end of barcode input
        timeoutRef.current = setTimeout(() => {
          if (input.length >= 8) {
            handleBarcodeInput(input);
          }
        }, 150);
      }

      // Many barcode scanners send Enter or Tab after barcode
      else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (input.length >= 8) {
          handleBarcodeInput(input);
        }
        input = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [scanMode, handleBarcodeInput]);

  // Camera-based scanning
  const startCameraScan = async () => {
    if (!videoRef.current) return;

    try {
      setScannerStatus("Starting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      videoRef.current.srcObject = stream;
      setIsScanning(true);
      setScannerStatus("Camera ready. Point at barcode/QR code.");
    } catch (error) {
      console.error("Error accessing camera:", error);
      setScannerStatus(
        "Camera access denied. Please use manual entry or keyboard scanner."
      );
    }
  };

  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleManualSubmit = () => {
    if (manualBarcode.trim() && manualBarcode.length >= 8) {
      onScan(manualBarcode, "CUSTOM");
      onClose();
    } else {
      setScannerStatus("Please enter a valid barcode (min 8 characters)");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManualSubmit();
    }
  };

  const handleTestScan = (barcode: string) => {
    setScannerInput(barcode);
    handleBarcodeInput(barcode);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-md"
      >
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Scan Product</h2>
              <p className="text-sm text-gray-600 mt-1">
                Use barcode scanner or camera
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Scanner Status */}
          <div className="mb-6">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">
                {scannerStatus}
              </p>
              {scannerInput && (
                <p className="text-xs text-blue-600 mt-1">
                  Scanner input:{" "}
                  <span className="font-mono">{scannerInput}</span>
                </p>
              )}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setScanMode("barcode")}
              className={`flex-1 py-3 rounded-lg border flex flex-col items-center ${
                scanMode === "barcode"
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              <Barcode className="w-5 h-5 mb-1" />
              <span className="text-sm">Barcode</span>
            </button>
            <button
              onClick={() => {
                setScanMode("qr");
                startCameraScan();
              }}
              className={`flex-1 py-3 rounded-lg border flex flex-col items-center ${
                scanMode === "qr"
                  ? "bg-purple-50 border-purple-300 text-purple-700"
                  : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              <QrCode className="w-5 h-5 mb-1" />
              <span className="text-sm">QR Code</span>
            </button>
            <button
              onClick={() => setScanMode("manual")}
              className={`flex-1 py-3 rounded-lg border flex flex-col items-center ${
                scanMode === "manual"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              <Key className="w-5 h-5 mb-1" />
              <span className="text-sm">Manual</span>
            </button>
          </div>

          {/* Scanner Area */}
          {scanMode === "manual" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Barcode
                </label>
                <input
                  ref={manualInputRef}
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => {
                    setManualBarcode(e.target.value);
                    setScannerStatus("Type or scan barcode here");
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Type barcode or scan with hardware scanner"
                  className="w-full px-4 py-3 border text-gray-700 border-gray-300 rounded-lg text-lg"
                  autoFocus
                />
              </div>
              <button
                onClick={handleManualSubmit}
                disabled={!manualBarcode.trim() || manualBarcode.length < 8}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Submit Barcode
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Camera View */}
              {scanMode === "qr" && (
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white/50 rounded-lg w-64 h-32"></div>
                  </div>
                </div>
              )}

              {/* Test Buttons */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Test with sample barcodes:
                </p>
                <div className="grid grid-cols-2 gap-2 text-gray-700">
                  {[
                    "5901234123457",
                    "9780545010221",
                    "6922266446188",
                    "123456789012",
                  ].map((barcode) => (
                    <button
                      key={barcode}
                      onClick={() => handleTestScan(barcode)}
                      className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 truncate"
                    >
                      {barcode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scanner Instructions */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Scanner Instructions:
                </h3>
                <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                  <li>USB barcode scanners will work automatically</li>
                  <li>For manual mode, type or scan into the input field</li>
                  <li>Minimum barcode length: 8 characters</li>
                  <li>Press Enter or wait 150ms after scanning</li>
                  <li>Test with sample barcodes above</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
