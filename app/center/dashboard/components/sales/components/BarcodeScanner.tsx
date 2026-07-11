import { FC, useState, useRef, useEffect } from "react";
import { Barcode, X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && barcodeInput.trim()) {
      onScan(barcodeInput);
      setBarcodeInput("");
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-3 sm:p-4 text-white">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <Barcode className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base font-medium">Scan Barcode</span>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={barcodeInput}
        onChange={(e) => setBarcodeInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-white-600 rounded-lg text-base sm:text-lg font-mono tracking-wider"
        placeholder="Scan barcode or enter manually..."
        autoFocus
      />
      <p className="text-xs sm:text-sm mt-2 text-green-100">
        Press Enter after scanning or type SKU/name
      </p>
    </div>
  );
};

export default BarcodeScanner;
