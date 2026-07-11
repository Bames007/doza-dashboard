"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";

interface BarcodeScannerContextType {
  lastScanned: string | null;
  resetScanner: () => void;
}

const BarcodeScannerContext = createContext<BarcodeScannerContextType | null>(
  null
);

export const useBarcodeScanner = () => {
  const context = useContext(BarcodeScannerContext);
  if (!context) {
    throw new Error(
      "useBarcodeScanner must be used within BarcodeScannerProvider"
    );
  }
  return context;
};

interface BarcodeScannerProviderProps {
  children: ReactNode;
}

export const BarcodeScannerProvider = ({
  children,
}: BarcodeScannerProviderProps) => {
  useEffect(() => {
    let barcode = "";
    let timeout: NodeJS.Timeout;
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.hasAttribute("contenteditable")
      ) {
        return;
      }

      // Check if it's a barcode scanner input (quick succession)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const currentTime = Date.now();

        // Reset if more than 200ms since last key (scanners send quickly)
        if (currentTime - lastKeyTime > 200) {
          barcode = "";
        }

        barcode += e.key;
        lastKeyTime = currentTime;

        // Clear previous timeout
        if (timeout) {
          clearTimeout(timeout);
        }

        // Set timeout to detect end of barcode
        timeout = setTimeout(() => {
          if (barcode.length >= 6) {
            // Minimum barcode length
            console.log("📦 Barcode scanned:", barcode);

            // Dispatch custom event
            const event = new CustomEvent("barcodeScanned", {
              detail: { barcode, timestamp: new Date().toISOString() },
            });
            window.dispatchEvent(event);

            // Dispatch to all windows (for multi-tab support)
            localStorage.setItem(
              "lastBarcodeScan",
              JSON.stringify({
                barcode,
                timestamp: new Date().toISOString(),
              })
            );

            // Trigger storage event for other tabs
            window.dispatchEvent(
              new StorageEvent("storage", {
                key: "lastBarcodeScan",
                newValue: JSON.stringify({
                  barcode,
                  timestamp: new Date().toISOString(),
                }),
              })
            );

            barcode = "";
          }
        }, 150); // Adjust based on scanner speed
      }

      // Some scanners send Enter after barcode
      else if (e.key === "Enter" && barcode.length >= 6) {
        e.preventDefault();

        console.log("📦 Barcode scanned (Enter):", barcode);

        const event = new CustomEvent("barcodeScanned", {
          detail: { barcode, timestamp: new Date().toISOString() },
        });
        window.dispatchEvent(event);

        barcode = "";
      }
    };

    // Listen for barcode scans from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "lastBarcodeScan" && e.newValue) {
        try {
          const scanData = JSON.parse(e.newValue);
          const event = new CustomEvent("barcodeScanned", {
            detail: scanData,
          });
          window.dispatchEvent(event);
        } catch (error) {
          console.error("Failed to parse barcode scan data:", error);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("storage", handleStorageChange);
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  });

  const resetScanner = () => {
    localStorage.removeItem("lastBarcodeScan");
  };

  return (
    <BarcodeScannerContext.Provider value={{ lastScanned: null, resetScanner }}>
      {children}
      <BarcodeScannerIndicator />
    </BarcodeScannerContext.Provider>
  );
};

const BarcodeScannerIndicator = () => {
  useEffect(() => {
    const handleBarcodeScanned = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { barcode } = customEvent.detail;

      // Show a toast notification
      showBarcodeToast(barcode);
    };

    window.addEventListener("barcodeScanned", handleBarcodeScanned);

    return () => {
      window.removeEventListener("barcodeScanned", handleBarcodeScanned);
    };
  }, []);

  return null;
};

const showBarcodeToast = (barcode: string) => {
  // Remove existing toast
  const existingToast = document.getElementById("barcode-toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.id = "barcode-toast";
  toast.className =
    "fixed top-4 right-4 z-[9999] animate-in slide-in-from-right-2 duration-300";
  toast.innerHTML = `
    <div class="bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
      <div class="flex-shrink-0">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p class="font-semibold">Barcode Scanned</p>
        <p class="text-sm opacity-90 font-mono">${barcode}</p>
        <p class="text-xs opacity-75 mt-1">Press F2 for scanner options</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-white/70 hover:text-white">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
};

// Add keyboard shortcut for scanner options
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    // F2 key for scanner help
    if (e.key === "F2" || (e.altKey && e.key === "s")) {
      e.preventDefault();
      alert(`Barcode Scanner Help:
      
📦 How to use:
1. Connect USB barcode scanner to your computer
2. Click anywhere on the page (not in input fields)
3. Scan any barcode
4. The scanner will automatically detect products

🛠 Scanner Tips:
- USB scanners work automatically
- Minimum barcode length: 6 characters
- Press F2 to show this help
- Scan duration: 150ms timeout
- Supports multi-tab scanning

🔍 Test barcodes:
- 5901234123457 (EAN-13)
- 9780545010221 (ISBN)
- 6922266446188 (Chinese EAN-13)
- DZ528233 (Custom)
- 123456789012 (UPC)
`);
    }
  });
}
