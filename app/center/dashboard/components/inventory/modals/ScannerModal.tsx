"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Barcode, QrCode, Camera } from "lucide-react";
import { ModalWrapper } from "../ModalWrapper";

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
  const [scannerTimeout, setScannerTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Handle barcode scanner input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        scanMode === "manual" &&
        document.activeElement === manualInputRef.current
      ) {
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setScannerInput((prev) => prev + e.key);
        setIsScanning(true);

        if (scannerTimeout) {
          clearTimeout(scannerTimeout);
        }

        const timeout = setTimeout(() => {
          if (scannerInput.length >= 4) {
            onScan(scannerInput, scanMode === "barcode" ? "EAN13" : "QR");
            onClose();
          }
          setScannerInput("");
          setIsScanning(false);
        }, 100);
        setScannerTimeout(timeout);
      } else if (e.key === "Enter") {
        if (scannerInput.length >= 4) {
          e.preventDefault();
          onScan(scannerInput, scanMode === "barcode" ? "EAN13" : "QR");
          onClose();
        }
        setScannerInput("");
        setIsScanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (scannerTimeout) {
        clearTimeout(scannerTimeout);
      }
    };
  }, [scanMode, scannerInput, scannerTimeout, onScan, onClose]);

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onScan(manualBarcode, "CUSTOM");
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManualSubmit();
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div className="bg-white rounded-xl md:rounded-2xl w-full max-w-md mx-auto shadow-2xl">
        <div className="border-b border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base md:text-xl font-bold text-gray-900">
                Scan Product
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                Scan barcode or QR code
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {/* Scan Mode Selection */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setScanMode("barcode")}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                scanMode === "barcode"
                  ? "bg-blue-50 border-blue-400 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:border-blue-300"
              }`}
            >
              <Barcode className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">Barcode</span>
            </button>
            <button
              onClick={() => setScanMode("qr")}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                scanMode === "qr"
                  ? "bg-purple-50 border-purple-400 text-purple-700"
                  : "bg-white border-gray-300 text-gray-700 hover:border-purple-300"
              }`}
            >
              <QrCode className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">QR Code</span>
            </button>
            <button
              onClick={() => setScanMode("manual")}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                scanMode === "manual"
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                  : "bg-white border-gray-300 text-gray-700 hover:border-emerald-300"
              }`}
            >
              <Camera className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">Manual</span>
            </button>
          </div>

          {/* Scanner Status */}
          <div
            className={`mb-4 p-3 rounded-lg ${
              isScanning
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {scanMode === "manual"
                    ? "Type barcode or scan with connected scanner"
                    : isScanning
                    ? "Scanning..."
                    : "Ready to scan - use your barcode scanner"}
                </p>
                {scanMode !== "manual" && (
                  <p className="text-xs text-gray-600 mt-1">
                    Scanner input:{" "}
                    <span className="font-mono font-bold">
                      {scannerInput || "Waiting..."}
                    </span>
                  </p>
                )}
              </div>
              {isScanning && (
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Scanner Area */}
          {scanMode === "manual" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Barcode/QR Code
                </label>
                <input
                  ref={manualInputRef}
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter barcode manually or scan here"
                  className="w-full px-4 py-3 text-lg text-gray-900 font-mono bg-white border-2 border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
              </div>
              <button
                onClick={handleManualSubmit}
                disabled={!manualBarcode.trim()}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3.5 rounded-lg hover:from-emerald-700 hover:to-green-700 font-medium shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Barcode
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Test barcodes for simulation */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Test with sample barcodes:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: "123456789012", type: "EAN13" },
                    { code: "9780545010221", type: "ISBN" },
                    { code: "6922266446188", type: "EAN13" },
                    { code: "5901234123457", type: "UPC" },
                  ].map((barcode) => (
                    <button
                      key={barcode.code}
                      onClick={() => {
                        onScan(
                          barcode.code,
                          scanMode === "barcode" ? "EAN13" : "QR"
                        );
                        onClose();
                      }}
                      className="px-4 py-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors"
                    >
                      <div className="font-mono font-bold">{barcode.code}</div>
                      <div className="text-xs text-gray-600">
                        {barcode.type}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setScanMode("manual");
                    manualInputRef.current?.focus();
                  }}
                  className="flex-1 py-2.5 border-2 border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 font-medium transition-colors"
                >
                  Switch to Manual
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-2 text-gray-700">Scanner Tips:</p>
            <ul className="space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>USB/Bluetooth barcode scanners work automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>For manual mode, type or scan into the input field</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Test with sample barcodes above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Press Enter to submit in manual mode</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
