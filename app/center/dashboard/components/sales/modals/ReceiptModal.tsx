// app/center/components/sales/modals/ReceiptModal.tsx
"use client";

import { FC, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Printer,
  X,
  MapPin,
  Phone,
  Download,
  Share2,
  CheckCircle,
  Receipt,
  Building,
} from "lucide-react";
import { Center, User as UserType } from "@/app/center/type";
import { Sale, Customer } from "../../../types/pharmacy";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  center: Center;
  user: UserType;
  customer: Customer | null;
  dozaUser: any;
}

const ReceiptModal: FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  center,
  user,
  customer,
  dozaUser,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "details">("preview");
  const [isMobile, setIsMobile] = useState(false);
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>("");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (sale.saleNumber && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, sale.saleNumber, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          fontOptions: "bold",
          fontSize: 12,
          textMargin: 5,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000",
        });

        // Convert canvas to data URL for use in printed receipt
        const dataUrl = barcodeRef.current.toDataURL("image/png");
        setBarcodeDataUrl(dataUrl);
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
  }, [sale.saleNumber]);

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount))
      return "₦0.00";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Time";
      return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Invalid Time";
    }
  };

  // Get center contact info - safe extraction
  const getCenterAddress = () => {
    if (center.location?.address) {
      return center.location.address;
    }
    if (typeof center.location === "string") {
      return center.location;
    }
    return "Address not available";
  };

  const getCenterPhone = () => {
    if (center.contact?.phone) {
      return center.contact.phone;
    }
    if (typeof center.contact === "string") {
      return center.contact;
    }
    return "Phone not available";
  };

  const generateReceiptHTML = () => {
    const itemsHTML = (sale.items || [])
      .map(
        (item) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px dashed #ccc;">
          <div>
            <div style="font-weight: 700;">${item.name}</div>
            <div style="font-size: 10px; color: #555;">
              Qty: ${item.quantity} × ${formatCurrency(item.unitPrice)}
              ${
                item.discountAmount > 0
                  ? ` | Disc: -${formatCurrency(item.discountAmount)}`
                  : ""
              }
            </div>
          </div>
          <div style="font-weight: 700;">${formatCurrency(item.subtotal)}</div>
        </div>
      `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt ${sale.saleNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Courier+New:wght@400;700&display=swap');
          
          /* Thermal printer friendly styles */
          @media print {
            @page { 
              margin: 0; 
              size: 80mm auto;
              padding: 0;
            }
            body { 
              margin: 0; 
              padding: 5px;
              width: 78mm !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          
          body {
            font-family: 'Courier New', monospace;
            margin: 0 auto;
            padding: 10px;
            width: 78mm; /* Standard thermal printer width */
            background: white;
            color: black;
            font-size: 12px;
            line-height: 1.3;
            max-width: 78mm;
          }
          
          .receipt-container {
            width: 100%;
            border: 2px solid #000;
            padding: 15px;
            background: white;
            box-sizing: border-box;
          }
          
          .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }
          
          .header h1 {
            font-size: 16px;
            font-weight: 700;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .header .info {
            font-size: 11px;
            margin: 3px 0;
          }
          
          .sale-info {
            text-align: center;
            margin: 15px 0;
            padding: 10px 0;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 5px;
            margin-top: 8px;
          }
          
          .info-cell {
            text-align: center;
          }
          
          .info-label {
            font-weight: 700;
            font-size: 10px;
            margin-bottom: 2px;
          }
          
          .info-value {
            font-size: 11px;
          }
          
          .section-title {
            font-weight: 700;
            font-size: 13px;
            margin: 10px 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .items-container {
            margin: 10px 0;
          }
          
          .item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px dashed #ccc;
          }
          
          .item-name {
            font-weight: 700;
            flex: 1;
          }
          
          .item-amount {
            font-weight: 700;
            text-align: right;
            min-width: 70px;
          }
          
          .item-details {
            font-size: 10px;
            color: #555;
            margin-top: 2px;
            grid-column: 1 / -1;
          }
          
          .totals {
            margin: 15px 0;
            padding-top: 10px;
            border-top: 2px solid #000;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          
          .grand-total {
            font-weight: 700;
            font-size: 14px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #000;
          }
          
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px solid #000;
            font-size: 11px;
          }
          
          .payment-details {
            margin: 10px 0;
            padding: 10px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
          }
          
          .customer-info {
            background: #f0f8ff;
            padding: 8px;
            margin: 10px 0;
            border: 1px solid #4ade80;
            border-radius: 4px;
          }
          
          .text-center { text-align: center; }
          .font-bold { font-weight: 700; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-3 { margin-bottom: 12px; }
          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
          .mt-3 { margin-top: 12px; }
          .text-sm { font-size: 11px; }
          .text-xs { font-size: 10px; }
          .text-gray-600 { color: #555; }
          .w-full { width: 100%; }
          
          /* Thermal printer specific */
          .thermal-line {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          
          .barcode-area {
            margin: 10px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          .barcode-image {
            width: 100%;
            height: 50px;
            object-fit: contain;
          }
          
          .barcode-text {
            font-size: 9px;
            margin-top: 2px;
            color: #333;
            letter-spacing: 1px;
            font-family: 'Courier New', monospace;
          }
          
          .doza-footer {
            font-size: 10px;
            color: #666;
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px dotted #ccc;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Header -->
          <div class="header">
            <h1>${center.centerName || "Pharmacy"}</h1>
            <div class="info">${getCenterAddress()}</div>
            <div class="info">${getCenterPhone()}</div>
            <div class="thermal-line"></div>
          </div>
          
          <!-- Sale Info -->
          <div class="sale-info">
            <div class="section-title">PHARMACY RECEIPT</div>
            <div class="info-grid">
              <div class="info-cell">
                <div class="info-label">SALE #</div>
                <div class="info-value">${sale.saleNumber}</div>
              </div>
              <div class="info-cell">
                <div class="info-label">DATE</div>
                <div class="info-value">${formatDate(sale.createdAt)}</div>
              </div>
              <div class="info-cell">
                <div class="info-label">TIME</div>
                <div class="info-value">${formatTime(sale.createdAt)}</div>
              </div>
            </div>
          </div>
          
          <!-- Customer Info -->
          ${
            dozaUser
              ? `
            <div class="customer-info">
              <div class="font-bold text-sm">DOZA USER</div>
              <div>${dozaUser.fullName}</div>
              <div class="text-xs">Code: ${dozaUser.dozaCode}</div>
              <div class="text-xs">Phone: ${dozaUser.phone}</div>
            </div>
          `
              : customer
              ? `
            <div class="mb-2">
              <div class="font-bold text-sm">CUSTOMER</div>
              <div>${customer.fullName}</div>
              <div class="text-xs">${customer.phone}</div>
            </div>
          `
              : `
            <div class="text-center text-sm mb-2">Walk-in Customer</div>
          `
          }
          
          <!-- Items -->
          <div class="section-title">ITEMS</div>
          <div class="items-container">
            ${itemsHTML}
          </div>
          
          <!-- Totals -->
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(sale.subTotal)}</span>
            </div>
            ${
              sale.discountAmount > 0
                ? `
              <div class="total-row">
                <span>Discount:</span>
                <span>-${formatCurrency(sale.discountAmount)}</span>
              </div>
            `
                : ""
            }
            ${
              sale.taxAmount > 0
                ? `
              <div class="total-row">
                <span>Tax (${sale.taxAmount || 7.5}%):</span>
                <span>${formatCurrency(sale.taxAmount)}</span>
              </div>
            `
                : ""
            }
            <div class="grand-total total-row">
              <span>TOTAL:</span>
              <span>${formatCurrency(sale.totalAmount)}</span>
            </div>
          </div>
          
          <!-- Payment Details -->
          <div class="payment-details">
            <div class="section-title text-sm">PAYMENT DETAILS</div>
            <div class="total-row">
              <span>Method:</span>
              <span class="font-bold">${sale.paymentMethod || "CASH"}</span>
            </div>
            ${
              sale.paymentMethod !== "DOZA_TAB"
                ? `
              <div class="total-row">
                <span>Amount Paid:</span>
                <span>${formatCurrency(sale.amountPaid)}</span>
              </div>
              ${
                sale.changeAmount > 0
                  ? `
                <div class="total-row">
                  <span>Change:</span>
                  <span>${formatCurrency(sale.changeAmount)}</span>
                </div>
              `
                  : ""
              }
            `
                : ""
            }
          </div>
          
          <!-- Barcode area -->
          <div class="barcode-area">
            ${
              barcodeDataUrl
                ? `<img src="${barcodeDataUrl}" alt="Barcode ${sale.saleNumber}" class="barcode-image" />`
                : `<div style="font-size: 10px; color: #666;">Barcode for: ${sale.saleNumber}</div>`
            }
            <div class="barcode-text">ID: ${sale.saleNumber}</div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div class="font-bold mb-1">Thank you for your patronage!</div>
            <div class="text-gray-600 mb-2">Keep this receipt for warranty/return purposes</div>
            <div>
              <div>Served by: ${
                sale.soldByName || user.fullName || "Staff"
              }</div>
              <div>${
                center.centerName || "Pharmacy"
              } • ${new Date().getFullYear()}</div>
              <div class="doza-footer">
                Doza • EBCom Technologies<br>
                www.dozamedic.com
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintReceipt = () => {
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        // Fallback to browser print
        window.print();
        return;
      }

      printWindow.document.open();
      printWindow.document.write(generateReceiptHTML());
      printWindow.document.close();

      // Print after content loads
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        // Close after print dialog (except on mobile)
        if (!isMobile) {
          setTimeout(() => printWindow.close(), 1000);
        }
      }, 250);
    } catch (error) {
      console.error("Print error:", error);
      // Fallback to browser print
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Create a temporary iframe for better PDF generation
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      iframe.style.top = "-9999px";
      iframe.style.width = "80mm";
      iframe.style.height = "500px";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        document.body.removeChild(iframe);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(generateReceiptHTML());
      iframeDoc.close();

      // Wait for content to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(iframeDoc.body, {
        scale: 3, // Higher scale for better quality
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: 300, // 80mm at 96 DPI
        height: iframeDoc.body.scrollHeight,
        windowWidth: 300,
      });

      document.body.removeChild(iframe);

      // Create PDF with thermal printer dimensions
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, (canvas.height * 80) / canvas.width],
      });

      const imgWidth = 76; // 80mm minus 2mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        2,
        2,
        imgWidth,
        imgHeight
      );
      pdf.save(`receipt-${sale.saleNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      // Fallback to print
      handlePrintReceipt();
    }
  };

  const handleShareReceipt = async () => {
    try {
      if (!receiptRef.current) return;

      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      if (navigator.share) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `receipt-${sale.saleNumber}.png`, {
              type: "image/png",
            });
            await navigator.share({
              files: [file],
              title: `Receipt ${sale.saleNumber}`,
              text: `Receipt from ${center.centerName}`,
            });
          }
        });
      } else {
        const link = document.createElement("a");
        link.download = `receipt-${sale.saleNumber}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 backdrop-blur-sm">
      <div className="min-h-screen flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl mx-auto overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Modal Header - Green */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-green-600 to-green-800 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Transaction Receipt
                  </h2>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 text-green-100 text-xs sm:text-sm">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </span>
                    <span>•</span>
                    <span>#{sale.saleNumber}</span>
                    <span>•</span>
                    <span>{formatDate(sale.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Mobile Tabs - Green */}
          {isMobile && (
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === "preview"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-500"
                }`}
              >
                Receipt
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === "details"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-500"
                }`}
              >
                Details
              </button>
            </div>
          )}

          {/* Action Bar */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-medium text-sm">
                {formatCurrency(sale.totalAmount || 0)}
              </div>
              <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-medium text-sm">
                {sale.paymentMethod || "CASH"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareReceipt}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border border-gray-300 text-sm transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
                <span className="sm:hidden">Print</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 sm:p-6">
              {/* Hidden canvas for barcode generation */}
              <canvas ref={barcodeRef} className="hidden" />

              {(!isMobile || activeTab === "preview") && (
                <div className={`${isMobile ? "" : "lg:col-span-2"}`}>
                  <div className="bg-white rounded-lg border-2 border-gray-800 overflow-hidden">
                    <div
                      ref={receiptRef}
                      className="p-4 sm:p-6 bg-white"
                      style={{
                        fontFamily: "'Courier New', monospace",
                        background: "#fff",
                        color: "#000",
                        fontSize: isMobile ? "11px" : "12px",
                        maxWidth: "80mm",
                        margin: "0 auto",
                      }}
                    >
                      {/* Receipt Header */}
                      <div className="text-center mb-4">
                        <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider mb-2 text-gray-900">
                          {center.centerName || "Pharmacy"}
                        </h1>
                        <div className="text-xs sm:text-sm text-gray-700 mb-1">
                          {getCenterAddress()}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-700">
                          {getCenterPhone()}
                        </div>
                        <div className="border-t border-gray-800 my-3"></div>
                      </div>

                      {/* Sale Info */}
                      <div className="text-center mb-4">
                        <div className="text-sm font-bold uppercase mb-1">
                          PHARMACY RECEIPT
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                          <div>
                            <div className="font-medium">SALE #</div>
                            <div>{sale.saleNumber}</div>
                          </div>
                          <div>
                            <div className="font-medium">DATE</div>
                            <div>{formatDate(sale.createdAt)}</div>
                          </div>
                          <div>
                            <div className="font-medium">TIME</div>
                            <div>{formatTime(sale.createdAt)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="mb-4">
                        {dozaUser ? (
                          <div className="p-2 bg-green-50 border border-green-200 rounded mb-3">
                            <div className="text-xs font-bold text-green-700 mb-1">
                              DOZA USER
                            </div>
                            <div className="text-sm">{dozaUser.fullName}</div>
                            <div className="text-xs">
                              Code: {dozaUser.dozaCode}
                            </div>
                            <div className="text-xs">
                              Phone: {dozaUser.phone}
                            </div>
                          </div>
                        ) : customer ? (
                          <div className="mb-3">
                            <div className="text-xs font-bold">CUSTOMER</div>
                            <div className="text-sm">{customer.fullName}</div>
                            <div className="text-xs">{customer.phone}</div>
                          </div>
                        ) : (
                          <div className="text-xs italic mb-3">
                            Walk-in Customer
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div className="mb-4">
                        <div className="border-b-2 border-gray-800 mb-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span>ITEM</span>
                            <span>AMOUNT</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {(sale.items || []).map((item, index) => (
                            <div key={index} className="text-xs">
                              <div className="flex justify-between">
                                <span className="font-medium">{item.name}</span>
                                <span>{formatCurrency(item.subtotal)}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>
                                  Qty: {item.quantity} ×{" "}
                                  {formatCurrency(item.unitPrice)}
                                </span>
                                {item.discountAmount > 0 && (
                                  <span>
                                    Disc: -{formatCurrency(item.discountAmount)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totals */}
                      <div className="mb-4 border-t-2 border-gray-800 pt-3">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(sale.subTotal)}</span>
                          </div>
                          {sale.discountAmount > 0 && (
                            <div className="flex justify-between">
                              <span>Discount:</span>
                              <span>
                                -{formatCurrency(sale.discountAmount)}
                              </span>
                            </div>
                          )}
                          {sale.taxAmount > 0 && (
                            <div className="flex justify-between">
                              <span>Tax ({sale.taxAmount || 7.5}%):</span>
                              <span>{formatCurrency(sale.taxAmount)}</span>
                            </div>
                          )}
                        </div>
                        <div className="border-t-2 border-gray-800 mt-3 pt-3">
                          <div className="flex justify-between font-bold">
                            <span>TOTAL</span>
                            <span>{formatCurrency(sale.totalAmount)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="mb-4 border-t border-dashed border-gray-600 pt-3">
                        <div className="text-xs font-bold mb-2">
                          PAYMENT DETAILS
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Method:</span>
                            <span className="font-bold">
                              {sale.paymentMethod}
                            </span>
                          </div>
                          {sale.paymentMethod !== "DOZA_TAB" && (
                            <>
                              <div className="flex justify-between">
                                <span>Amount Paid:</span>
                                <span>{formatCurrency(sale.amountPaid)}</span>
                              </div>
                              {sale.changeAmount > 0 && (
                                <div className="flex justify-between">
                                  <span>Change:</span>
                                  <span>
                                    {formatCurrency(sale.changeAmount)}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Barcode area - Now showing actual barcode */}
                      <div className="mb-4 pt-3 text-center">
                        <div className="border-t border-b border-gray-300 py-3">
                          {barcodeDataUrl ? (
                            <div className="flex flex-col items-center">
                              <img
                                src={barcodeDataUrl}
                                alt={`Barcode ${sale.saleNumber}`}
                                className="w-full max-w-[250px] h-12 object-contain"
                              />
                              <div className="text-xs mt-1 font-mono tracking-wider">
                                ID: {sale.saleNumber}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-600 py-2">
                              [Generating barcode for: {sale.saleNumber}]
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer with new information */}
                      <div className="text-center border-t-2 border-gray-800 pt-4">
                        <div className="text-xs font-bold mb-2">
                          Thank you for your patronage!
                        </div>
                        <div className="text-xs text-gray-600 mb-3">
                          Keep this receipt for warranty/return purposes
                        </div>
                        <div className="text-xs space-y-1">
                          <div>
                            Served by:{" "}
                            {sale.soldByName || user.fullName || "Staff"}
                          </div>
                          <div>
                            {center.centerName || "Pharmacy"} •{" "}
                            {new Date().getFullYear()}
                          </div>
                          <div className="mt-2 pt-2 border-t border-dotted border-gray-400 text-gray-600">
                            Doza • EBCom Technologies
                            <br />
                            www.dozamedic.com
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(!isMobile || activeTab === "details") && (
                <div className="mt-4 sm:mt-6">
                  {/* Store Info Card - Changed icon to green */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Building className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-gray-900">
                        {center.centerName || "Pharmacy"}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Address
                          </p>
                          <p className="text-sm text-gray-600">
                            {getCenterAddress()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Contact
                          </p>
                          <p className="text-sm text-gray-600">
                            {getCenterPhone()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <div className="text-xs text-emerald-700 mb-1">Items</div>
                      <div className="text-lg font-bold text-emerald-800">
                        {(sale.items || []).reduce(
                          (sum, item) => sum + (item.quantity || 0),
                          0
                        )}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-xs text-green-700 mb-1">Status</div>
                      <div className="text-lg font-bold text-green-800">
                        {sale.status === "COMPLETED" ? "PAID" : "PENDING"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-600">
                Transaction ID: {sale.saleNumber}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
                >
                  Close
                </button>
                {/* Changed to green */}
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReceiptModal;
