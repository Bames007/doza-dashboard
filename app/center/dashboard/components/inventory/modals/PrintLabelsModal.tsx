"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Printer,
  Download,
  QrCode,
  Barcode,
  DollarSign,
  Calendar,
  HashIcon,
  Tag,
  Package,
} from "lucide-react";
import { Product } from "../../../types/pharmacy";
import { Center } from "@/app/center/type";
import jsPDF from "jspdf";
import BarcodeComponent from "react-barcode";
import { QRCodeCanvas } from "qrcode.react";
import QRCode from "qrcode";
import { ModalWrapper } from "../ModalWrapper";

interface PrintLabelsModalProps {
  products: Product[];
  center: Center;
  onClose: () => void;
  onPrint: (
    selectedProducts: Product[],
    labelSize: string,
    copies: number,
    includeQR: boolean,
    includeBarcode: boolean,
    includeExpiry: boolean,
    includePrice: boolean
  ) => void;
}

export const PrintLabelsModal = ({
  products,
  center,
  onClose,
  onPrint,
}: PrintLabelsModalProps) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [labelSize, setLabelSize] = useState<
    "small" | "medium" | "large" | "xlarge"
  >("medium");
  const [copies, setCopies] = useState(1);
  const [includeQR, setIncludeQR] = useState(true);
  const [includeBarcode, setIncludeBarcode] = useState(true);
  const [includeExpiry, setIncludeExpiry] = useState(true);
  const [includePrice, setIncludePrice] = useState(true);
  const [includeBrand, setIncludeBrand] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(false);
  const [includeBatch, setIncludeBatch] = useState(false);
  const [includeManufacturer, setIncludeManufacturer] = useState(false);
  const [selectedProductForPreview, setSelectedProductForPreview] =
    useState<Product | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [paperSize, setPaperSize] = useState<"A4" | "Letter" | "A5">("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const [labelSpacing, setLabelSpacing] = useState(2);
  const [labelMargins, setLabelMargins] = useState(1);

  const previewRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Initialize with first product selected
  useEffect(() => {
    if (products.length > 0 && !selectedProductForPreview) {
      const firstProduct = products[0];
      setSelectedProductForPreview(firstProduct);
      setSelectedProducts([firstProduct.id]);
    }
  }, [products]);

  // Update preview when selected products change
  useEffect(() => {
    if (
      selectedProducts.length > 0 &&
      !selectedProducts.includes(selectedProductForPreview?.id || "")
    ) {
      const product = products.find((p) => p.id === selectedProducts[0]);
      if (product) {
        setSelectedProductForPreview(product);
      }
    }
  }, [selectedProducts]);

  useEffect(() => {
    if (labelSize === "xlarge") {
      setOrientation("portrait");
    } else {
      setOrientation("landscape");
    }
  }, [labelSize]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );

    if (!selectedProducts.includes(productId)) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setSelectedProductForPreview(product);
      }
    }
  };

  const toggleAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const handlePrint = () => {
    const selected = products.filter((p) => selectedProducts.includes(p.id));
    onPrint(
      selected,
      labelSize,
      copies,
      includeQR,
      includeBarcode,
      includeExpiry,
      includePrice
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const truncateText = (
    text: string,
    maxLength: number,
    type: "name" | "sku" | "general" = "general"
  ) => {
    if (!text) return "";

    if (text.length <= maxLength) return text;

    switch (type) {
      case "name":
        return text.substring(0, maxLength - 1) + "…";
      case "sku":
        return text.substring(0, maxLength - 3) + "…";
      default:
        return text.substring(0, maxLength - 2) + "…";
    }
  };

  // Get optimal font size based on text length
  const getFontSizeClass = (
    text: string,
    baseClass: string,
    isTitle = false
  ) => {
    if (!text) return baseClass;

    const length = text.length;
    const sizeMap = {
      small: {
        title: {
          short: "text-[8px]",
          medium: "text-[7px]",
          long: "text-[6px]",
        },
        normal: {
          short: "text-[7px]",
          medium: "text-[6px]",
          long: "text-[5px]",
        },
      },
      medium: {
        title: {
          short: "text-[10px]",
          medium: "text-[9px]",
          long: "text-[8px]",
        },
        normal: {
          short: "text-[9px]",
          medium: "text-[8px]",
          long: "text-[7px]",
        },
      },
      large: {
        title: {
          short: "text-[12px]",
          medium: "text-[11px]",
          long: "text-[10px]",
        },
        normal: {
          short: "text-[11px]",
          medium: "text-[10px]",
          long: "text-[9px]",
        },
      },
      xlarge: {
        title: {
          short: "text-[14px]",
          medium: "text-[13px]",
          long: "text-[12px]",
        },
        normal: {
          short: "text-[13px]",
          medium: "text-[12px]",
          long: "text-[11px]",
        },
      },
    };

    const sizeKey = labelSize;
    const category = isTitle ? "title" : "normal";
    const lengthKey = length > 30 ? "long" : length > 20 ? "medium" : "short";

    return sizeMap[sizeKey][category][lengthKey];
  };

  // Label sizes configuration
  const labelSizes = {
    small: {
      name: "Small (38×21mm)",
      width: "w-38",
      height: "h-21",
      fontSize: "text-[6px]",
      titleSize: "text-[8px]",
      margin: "p-1",
      qrSize: 20,
      barcodeHeight: 12,
      previewCols: 6,
      rowsPerPage: 10,
      colsPerPage: 4,
    },
    medium: {
      name: "Medium (50×30mm)",
      width: "w-50",
      height: "h-30",
      fontSize: "text-[8px]",
      titleSize: "text-[10px]",
      margin: "p-1.5",
      qrSize: 25,
      barcodeHeight: 16,
      previewCols: 4,
      rowsPerPage: 7,
      colsPerPage: 3,
    },
    large: {
      name: "Large (70×40mm)",
      width: "w-70",
      height: "h-40",
      fontSize: "text-[10px]",
      titleSize: "text-[12px]",
      margin: "p-2",
      qrSize: 30,
      barcodeHeight: 20,
      previewCols: 3,
      rowsPerPage: 5,
      colsPerPage: 2,
    },
    xlarge: {
      name: "X-Large (90×60mm)",
      width: "w-90",
      height: "h-60",
      fontSize: "text-[12px]",
      titleSize: "text-[14px]",
      margin: "p-2.5",
      qrSize: 35,
      barcodeHeight: 24,
      previewCols: 2,
      rowsPerPage: 3,
      colsPerPage: 2,
    },
  };

  const sizeConfig = labelSizes[labelSize];

  // Professional Label Component
  const ProfessionalLabel = ({
    product,
    isMain = false,
  }: {
    product: Product;
    isMain?: boolean;
  }) => {
    const qrData = `${product.id}|${product.sku}|${center.id}`;
    const barcodeData = product.barcode || product.sku || product.id;

    return (
      <div
        className={`${sizeConfig.width} ${
          sizeConfig.height
        } bg-white border border-gray-300 rounded shadow-sm relative overflow-hidden ${
          isMain ? "ring-2 ring-blue-500 ring-offset-1" : ""
        }`}
        ref={isMain ? previewRef : null}
      >
        <div className={`h-full flex flex-col ${sizeConfig.margin}`}>
          {/* Compact Header */}
          <div className="text-center mb-1 pb-0.5 border-b border-gray-200">
            <h3
              className={`${getFontSizeClass(
                center.centerName,
                sizeConfig.titleSize,
                true
              )} font-bold text-gray-900 leading-tight truncate`}
            >
              {truncateText(center.centerName, 25, "general")}
            </h3>
            <p className={`${sizeConfig.fontSize} text-gray-600 leading-tight`}>
              Medical Center
            </p>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {/* Product Name */}
            <div className="mb-1">
              <h4
                className={`${getFontSizeClass(
                  product.name,
                  sizeConfig.titleSize,
                  true
                )} font-bold text-gray-900 leading-tight line-clamp-2`}
              >
                {product.name}
              </h4>
            </div>

            {/* Details Row */}
            <div className="flex justify-between items-center mb-1">
              <span
                className={`${sizeConfig.fontSize} font-semibold text-gray-700 truncate`}
              >
                SKU: {product.sku}
              </span>
              {includeBatch && product.batchNumber && (
                <span
                  className={`${sizeConfig.fontSize} text-gray-600 truncate ml-1`}
                >
                  {truncateText(`B:${product.batchNumber}`, 8, "sku")}
                </span>
              )}
            </div>

            {/* Optional Fields */}
            {includeManufacturer && product.manufacturer && (
              <p
                className={`${sizeConfig.fontSize} text-gray-600 truncate mb-1`}
              >
                {truncateText(product.manufacturer, 20, "general")}
              </p>
            )}

            {includeBrand && product.brand && (
              <p
                className={`${sizeConfig.fontSize} text-gray-700 truncate mb-0.5`}
              >
                {truncateText(product.brand, 15, "general")}
              </p>
            )}

            {includeLocation && product.location && (
              <p
                className={`${sizeConfig.fontSize} text-gray-600 truncate mb-0.5 flex items-center gap-0.5`}
              >
                <span className="text-[6px]">📍</span>{" "}
                {truncateText(product.location, 15, "general")}
              </p>
            )}
          </div>

          {/* Barcode & QR Code Area */}
          <div className="mt-1">
            {includeBarcode && barcodeData && (
              <div className="mb-1">
                <div className="flex justify-center bg-white">
                  <div className="scale-75 origin-center">
                    <BarcodeComponent
                      value={barcodeData}
                      format="CODE128"
                      width={1.2}
                      height={sizeConfig.barcodeHeight}
                      fontSize={8}
                      background="transparent"
                      margin={0}
                    />
                  </div>
                </div>
                <p
                  className={`${sizeConfig.fontSize} text-center text-gray-700 font-mono truncate`}
                >
                  {truncateText(barcodeData, 20, "sku")}
                </p>
              </div>
            )}

            {includeQR && (
              <div className="absolute bottom-1 right-1">
                <QRCodeCanvas
                  value={qrData}
                  size={sizeConfig.qrSize}
                  level="M"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
            )}
          </div>

          {/* Bottom Section - Price & Expiry */}
          <div className="mt-auto pt-1 border-t border-gray-200">
            <div className="flex justify-between items-center">
              {includePrice && (
                <div className="flex-1 text-center">
                  <p
                    className={`${sizeConfig.titleSize} font-bold text-green-700 leading-tight`}
                  >
                    {formatCurrency(product.sellingPrice)}
                  </p>
                  <p
                    className={`${sizeConfig.fontSize} text-gray-600 leading-tight`}
                  >
                    per {product.unit}
                  </p>
                </div>
              )}

              {includeExpiry && (
                <div className="flex-1 text-center">
                  <p
                    className={`${sizeConfig.titleSize} font-bold text-red-600 leading-tight`}
                  >
                    {formatDate(product.expiryDate)}
                  </p>
                  <p
                    className={`${sizeConfig.fontSize} text-gray-600 leading-tight`}
                  >
                    Exp
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <p
              className={`text-[5px] text-center text-gray-400 leading-tight mt-0.5`}
            >
              Doza Project • EBCom Tech
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced PDF Generation
  const handleDownloadPDF = async () => {
    if (selectedProducts.length === 0) {
      alert("Please select at least one product to generate PDF");
      return;
    }

    setIsGeneratingPDF(true);
    setPdfProgress(0);

    try {
      const selected = products.filter((p) => selectedProducts.includes(p.id));
      const pdf = new jsPDF({
        orientation: orientation,
        unit: "mm",
        format: paperSize.toLowerCase() as any,
      });

      // Page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Label dimensions (in mm)
      const labelDimensions = {
        small: { width: 38, height: 21, fontSize: 5, titleSize: 6, margin: 1 },
        medium: {
          width: 50,
          height: 30,
          fontSize: 6,
          titleSize: 8,
          margin: 1.5,
        },
        large: { width: 70, height: 40, fontSize: 8, titleSize: 10, margin: 2 },
        xlarge: {
          width: 90,
          height: 60,
          fontSize: 10,
          titleSize: 12,
          margin: 2.5,
        },
      };

      const dim = labelDimensions[labelSize];

      // Calculate grid
      const cols = Math.floor((pageWidth - 20) / (dim.width + labelSpacing));
      const rows = Math.floor((pageHeight - 20) / (dim.height + labelSpacing));

      let labelCount = 0;
      const totalLabels = selected.length * copies;

      for (const product of selected) {
        for (let copy = 0; copy < copies; copy++) {
          // Calculate position
          const row = Math.floor(labelCount / cols) % rows;
          const col = labelCount % cols;
          const x = 10 + col * (dim.width + labelSpacing);
          const y = 10 + row * (dim.height + labelSpacing);

          // Add new page if needed
          if (labelCount > 0 && labelCount % (cols * rows) === 0) {
            pdf.addPage(paperSize.toLowerCase() as any);
          }

          // Draw label border
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.1);
          pdf.rect(x, y, dim.width, dim.height);

          let currentY = y + dim.margin;

          // Center name
          const centerName = truncateText(center.centerName, 25);
          pdf.setFontSize(dim.titleSize);
          pdf.setFont("helvetica", "bold");
          pdf.text(centerName, x + dim.width / 2, currentY, {
            align: "center",
            maxWidth: dim.width - 2,
          });
          currentY += 3;

          pdf.setFontSize(dim.fontSize - 1);
          pdf.setFont("helvetica", "normal");
          pdf.text("Medical Center", x + dim.width / 2, currentY, {
            align: "center",
          });
          currentY += 3;

          // Product name (with line splitting)
          pdf.setFontSize(dim.titleSize);
          pdf.setFont("helvetica", "bold");
          const productLines = pdf.splitTextToSize(product.name, dim.width - 4);
          const maxLines = Math.min(2, productLines.length);
          for (let i = 0; i < maxLines; i++) {
            pdf.text(productLines[i], x + dim.width / 2, currentY, {
              align: "center",
            });
            currentY += 3;
          }

          // SKU
          pdf.setFontSize(dim.fontSize - 1);
          pdf.setFont("helvetica", "normal");
          pdf.text(`SKU: ${product.sku}`, x + dim.margin, currentY);
          currentY += 3;

          // Barcode
          if (includeBarcode && product.barcode) {
            const barcodeY = currentY;
            const barcodeHeight = 8;
            const barcodeWidth = dim.width - 6;
            const barcodeX = x + 3;

            // Create barcode canvas
            const barcodeCanvas = document.createElement("canvas");
            const ctx = barcodeCanvas.getContext("2d");
            barcodeCanvas.width = barcodeWidth * 3;
            barcodeCanvas.height = barcodeHeight * 3;

            if (ctx) {
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, barcodeCanvas.width, barcodeCanvas.height);

              // Simple barcode simulation
              const code = product.barcode;
              const barWidth = barcodeCanvas.width / (code.length * 2);
              for (let i = 0; i < code.length; i++) {
                const digit = parseInt(code[i]) || 1;
                const barHeight =
                  (barcodeCanvas.height - 10) * (0.3 + digit * 0.07);
                const barX = i * barWidth * 2;
                ctx.fillStyle = "#000000";
                ctx.fillRect(barX, 10, barWidth * 1.2, barHeight);
              }

              // Add barcode text
              ctx.fillStyle = "#000000";
              ctx.font = "12px monospace";
              ctx.textAlign = "center";
              ctx.fillText(
                code,
                barcodeCanvas.width / 2,
                barcodeCanvas.height - 2
              );
            }

            pdf.addImage(
              barcodeCanvas,
              "PNG",
              barcodeX,
              barcodeY,
              barcodeWidth,
              barcodeHeight
            );
            currentY += barcodeHeight + 2;
          }

          // QR Code
          if (includeQR) {
            const qrSize = 12;
            const qrX = x + dim.width - qrSize - dim.margin;
            const qrY =
              y + dim.height - qrSize - dim.margin - (includePrice ? 8 : 0);

            try {
              const qrData = `${product.id}|${product.sku}|${center.id}`;
              const qrCanvas = document.createElement("canvas");
              await QRCode.toCanvas(qrCanvas, qrData, {
                width: qrSize * 3,
                margin: 0,
                color: { dark: "#000000", light: "#FFFFFF" },
              });
              pdf.addImage(qrCanvas, "PNG", qrX, qrY, qrSize, qrSize);
            } catch (error) {
              console.warn("QR code generation failed, skipping...");
            }
          }

          // Price
          if (includePrice) {
            const priceY = y + dim.height - 6;
            pdf.setFontSize(dim.fontSize);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(0, 100, 0);
            pdf.text(
              formatCurrency(product.sellingPrice),
              x + dim.width / 2,
              priceY,
              { align: "center" }
            );
            pdf.setTextColor(0, 0, 0);
          }

          // Expiry
          if (includeExpiry) {
            const expiryY = y + dim.height - 3;
            const expiryDate = formatDate(product.expiryDate);
            pdf.setFontSize(dim.fontSize - 1);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(200, 0, 0);
            pdf.text(`Exp: ${expiryDate}`, x + dim.width / 2, expiryY, {
              align: "center",
            });
            pdf.setTextColor(0, 0, 0);
          }

          // Footer
          pdf.setFontSize(4);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          pdf.text(
            "Doza Project • EBCom Technologies",
            x + dim.width / 2,
            y + dim.height - 1,
            { align: "center" }
          );

          labelCount++;
          setPdfProgress(Math.round((labelCount / totalLabels) * 100));
        }
      }

      // Save PDF
      pdf.save(`labels-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
      setPdfProgress(0);
    }
  };

  // Get selected count and calculations
  const selectedCount = selectedProducts.length;
  const totalLabels = selectedCount * copies;
  const labelsPerPage = sizeConfig.rowsPerPage * sizeConfig.colsPerPage;
  const totalPages = Math.ceil(totalLabels / labelsPerPage);

  // Content Options
  const ContentOptions = () => (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-3">Label Content</h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: "includeQR", label: "QR Code", Icon: QrCode },
          { key: "includeBarcode", label: "Barcode", Icon: Barcode },
          { key: "includePrice", label: "Price", Icon: DollarSign },
          { key: "includeExpiry", label: "Expiry", Icon: Calendar },
          { key: "includeBatch", label: "Batch", Icon: HashIcon },
          { key: "includeBrand", label: "Brand", Icon: Tag },
          { key: "includeLocation", label: "Location", emoji: "📍" },
          { key: "includeManufacturer", label: "Manufacturer", Icon: Package },
        ].map(({ key, label, Icon, emoji }) => (
          <label
            key={key}
            className="flex items-center p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={eval(key)}
              onChange={(e) => {
                const setter = eval(
                  `set${key.charAt(0).toUpperCase() + key.slice(1)}`
                );
                setter(e.target.checked);
              }}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 flex items-center gap-1.5">
              {emoji ? emoji : Icon ? <Icon className="w-3.5 h-3.5" /> : null}
              {label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <ModalWrapper onClose={onClose} fullScreen>
      <div className="bg-white rounded-xl md:rounded-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900 to-green-800 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Print Product Labels
              </h2>
              <p className="text-gray-300 mt-1">
                {selectedCount} products selected • {totalLabels} labels •{" "}
                {totalPages} pages
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Settings */}
            <div className="lg:col-span-1 space-y-6">
              {/* Print Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Print Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Paper Size
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["A4", "Letter", "A5"] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setPaperSize(size)}
                          className={`px-3 py-2 text-sm rounded border ${
                            paperSize === size
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Label Size
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(labelSizes).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => setLabelSize(key as any)}
                          className={`px-2 py-1.5 text-xs rounded border ${
                            labelSize === key
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          {config.name.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-700">
                        Copies: {copies}
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCopies(Math.max(1, copies - 1))}
                        className="w-8 h-8 rounded-full border text-gray-700 border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={copies}
                        onChange={(e) => setCopies(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <button
                        onClick={() => setCopies(Math.min(10, copies + 1))}
                        className="w-8 h-8 rounded-full border text-gray-700 border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <ContentOptions />

              {/* Product List */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">
                    Products ({selectedCount})
                  </h3>
                  <button
                    onClick={toggleAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectedProducts.length === products.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {products.slice(0, 8).map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center p-2 rounded border cursor-pointer transition-colors ${
                        selectedProducts.includes(product.id)
                          ? "bg-blue-50 border-blue-300"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => toggleProduct(product.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        readOnly
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>SKU: {product.sku}</span>
                          <span>
                            {product.quantity} {product.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {products.length > 8 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      + {products.length - 8} more products
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="lg:col-span-2">
              {/* Main Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Label Preview</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Size: {sizeConfig.name}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
                    {selectedProductForPreview && (
                      <ProfessionalLabel
                        product={selectedProductForPreview}
                        isMain={true}
                      />
                    )}
                  </div>

                  {selectedProductForPreview && (
                    <div className="text-center">
                      <p className="font-medium text-gray-900 mb-1">
                        {truncateText(
                          selectedProductForPreview.name,
                          40,
                          "name"
                        )}
                      </p>
                      <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                        <span>SKU: {selectedProductForPreview.sku}</span>
                        <span>
                          Price:{" "}
                          {formatCurrency(
                            selectedProductForPreview.sellingPrice
                          )}
                        </span>
                        <span>
                          Exp:{" "}
                          {formatDate(selectedProductForPreview.expiryDate)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Labels</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalLabels}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Pages Needed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalPages}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Labels/Page</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {labelsPerPage}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Paper</p>
                  <p className="text-lg font-bold text-gray-900">{paperSize}</p>
                </div>
              </div>

              {/* PDF Progress */}
              {isGeneratingPDF && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <div>
                        <p className="font-medium text-blue-900">
                          Generating PDF
                        </p>
                        <p className="text-sm text-blue-700">
                          {pdfProgress}% complete
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-blue-900">
                      {pdfProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pdfProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={selectedProducts.length === 0 || isGeneratingPDF}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download PDF
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrint}
                  disabled={selectedProducts.length === 0 || isGeneratingPDF}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Print {totalLabels} Labels
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  💡 <strong>Printing Tip:</strong> For best results, use
                  adhesive label paper and set your printer to "High Quality"
                  mode.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
