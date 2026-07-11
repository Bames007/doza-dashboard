// utils/downloadTemplate.ts
export const downloadCSVTemplate = () => {
  const headers = [
    "SKU",
    "Name",
    "Category",
    "Quantity",
    "UnitPrice",
    "SellingPrice",
    "Barcode",
    "IsMedicalEquipment",
    "ExpiryDate",
    "LotNumber",
    "Supplier",
    "Description",
    "MinStockLevel",
    "MaxStockLevel",
    "Location",
  ];

  const exampleData = [
    {
      SKU: "MED-001",
      Name: "Paracetamol 500mg",
      Category: "medication",
      Quantity: "100",
      UnitPrice: "0.50",
      SellingPrice: "0.60",
      Barcode: "",
      IsMedicalEquipment: "false",
      ExpiryDate: "2024-12-31",
      LotNumber: "LOT12345",
      Supplier: "Pharma Inc",
      Description: "Pain relief medication",
      MinStockLevel: "20",
      MaxStockLevel: "200",
      Location: "Shelf A1",
    },
    {
      SKU: "EQP-001",
      Name: "Digital Thermometer",
      Category: "equipment",
      Quantity: "50",
      UnitPrice: "15.00",
      SellingPrice: "18.00",
      Barcode: "",
      IsMedicalEquipment: "true",
      ExpiryDate: "",
      LotNumber: "BATCH789",
      Supplier: "MedTech Corp",
      Description: "Digital forehead thermometer",
      MinStockLevel: "10",
      MaxStockLevel: "100",
      Location: "Equipment Room",
    },
  ];

  const csvContent = [
    headers.join(","),
    ...exampleData.map((row) =>
      headers
        .map((header) => `"${row[header as keyof typeof row] || ""}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "medical_inventory_template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
