"use client";

import { useState, useEffect } from "react";

export default function BarcodeTestPage() {
  const [scannedBarcodes, setScannedBarcodes] = useState<
    Array<{ barcode: string; timestamp: string }>
  >([]);

  useEffect(() => {
    const handleBarcodeScanned = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { barcode, timestamp } = customEvent.detail;

      setScannedBarcodes((prev) => [
        { barcode, timestamp },
        ...prev.slice(0, 9), // Keep last 10 scans
      ]);
    };

    window.addEventListener("barcodeScanned", handleBarcodeScanned);

    return () => {
      window.removeEventListener("barcodeScanned", handleBarcodeScanned);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Barcode Scanner Test
        </h1>
        <p className="text-gray-600 mb-8">
          Connect a USB barcode scanner and scan any barcode. The scanner will
          be detected automatically.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Test Instructions
            </h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                  1
                </span>
                Connect USB barcode scanner
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                  2
                </span>
                Click anywhere on this page (not in input fields)
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                  3
                </span>
                Scan a barcode (test with: 5901234123457)
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                  4
                </span>
                Watch the toast notification appear
              </li>
            </ul>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">
                Keyboard Shortcuts
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  •{" "}
                  <kbd className="px-2 py-1 bg-white/50 rounded text-xs">
                    F2
                  </kbd>{" "}
                  - Show scanner help
                </li>
                <li>
                  •{" "}
                  <kbd className="px-2 py-1 bg-white/50 rounded text-xs">
                    Alt + S
                  </kbd>{" "}
                  - Alternative help shortcut
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Scans
            </h2>

            {scannedBarcodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <p>No barcodes scanned yet</p>
                <p className="text-sm mt-2">Scan a barcode to see it here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scannedBarcodes.map((scan, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-mono font-semibold text-gray-900">
                        {scan.barcode}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(scan.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // Test API with this barcode
                        fetch(
                          `/api/barcode/scan?barcode=${scan.barcode}&centerId=DOZA-ARC-migguyst-w8suux`
                        )
                          .then((res) => res.json())
                          .then((data) => {
                            if (data.success && data.data.product) {
                              alert(
                                `Product found: ${data.data.product.name}\nQuantity: ${data.data.product.quantity}`
                              );
                            } else {
                              alert("No product found with this barcode");
                            }
                          })
                          .catch((err) => {
                            console.error("API error:", err);
                            alert("Error testing barcode API");
                          });
                      }}
                      className="px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    >
                      Test API
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-2">Test Barcodes</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "5901234123457",
                  "9780545010221",
                  "6922266446188",
                  "DZ528233",
                ].map((barcode) => (
                  <button
                    key={barcode}
                    onClick={() => {
                      // Simulate scanning this barcode
                      const event = new CustomEvent("barcodeScanned", {
                        detail: {
                          barcode,
                          timestamp: new Date().toISOString(),
                        },
                      });
                      window.dispatchEvent(event);
                    }}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-center truncate"
                  >
                    {barcode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
