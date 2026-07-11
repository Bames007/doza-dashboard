// app/utils/categories.ts
export const pharmacyCategories = [
  // Medical Categories
  "Analgesics & Pain Relief",
  "Antibiotics",
  "Antihypertensives",
  "Antidiabetics",
  "Antidepressants",
  "Antipsychotics",
  "Anticoagulants",
  "Bronchodilators",
  "Corticosteroids",
  "Diuretics",
  "Gastrointestinal",
  "Hormones & Contraceptives",
  "Immunosuppressants",
  "Muscle Relaxants",
  "Ophthalmic",
  "Otic (Ear)",
  "Topical",
  "Vaccines",

  // Medical Equipment & Supplies
  "Diagnostic Equipment",
  "Surgical Instruments",
  "Patient Monitoring",
  "Mobility Aids",
  "First Aid Supplies",
  "Wound Care",
  "Disposable Medical Supplies",
  "Personal Protective Equipment (PPE)",
  "Laboratory Equipment",
  "Dental Supplies",

  // Health & Wellness
  "Vitamins & Supplements",
  "Minerals",
  "Herbal & Natural Remedies",
  "Sports Nutrition",
  "Weight Management",
  "Probiotics & Digestive Health",

  // Personal Care & Toiletries
  "Skincare",
  "Hair Care",
  "Oral Care",
  "Baby Care",
  "Feminine Hygiene",
  "Men's Grooming",
  "Deodorants & Antiperspirants",
  "Soaps & Bath Products",

  // Provision Store Items
  "Beverages",
  "Snacks & Confectionery",
  "Canned Foods",
  "Dairy Products",
  "Grains & Cereals",
  "Spices & Condiments",
  "Personal Hygiene",
  "Household Cleaning",
  "Baby Products",
  "Pet Care",

  // Specialized Pharmacy
  "Veterinary Medicines",
  "Dermatologicals",
  "Oncology",
  "Cardiology",
  "Neurology",
  "Psychiatry",

  // Other
  "Medical Books & References",
  "Pharmacy Accessories",
  "Seasonal Items",
  "Promotional Items",
  "Custom/Other",
] as const;

// Type for category autocomplete
export type PharmacyCategory = (typeof pharmacyCategories)[number];

// Grouped categories for better organization in dropdowns
export const groupedCategories = [
  {
    group: "Medications",
    categories: [
      "Analgesics & Pain Relief",
      "Antibiotics",
      "Antihypertensives",
      "Antidiabetics",
      "Antidepressants",
      "Antipsychotics",
      "Anticoagulants",
      "Bronchodilators",
      "Corticosteroids",
      "Diabetes",
      "Diuretics",
      "Gastrointestinal",
      "Hormones & Contraceptives",
      "Immunosuppressants",
      "Muscle Relaxants",
      "Ophthalmic",
      "Otic (Ear)",
      "Topical",
      "Vaccines",
    ],
  },
  {
    group: "Medical Equipment & Supplies",
    categories: [
      "Diagnostic Equipment",
      "Surgical Instruments",
      "Patient Monitoring",
      "Mobility Aids",
      "First Aid Supplies",
      "Wound Care",
      "Disposable Medical Supplies",
      "Personal Protective Equipment (PPE)",
      "Laboratory Equipment",
      "Dental Supplies",
    ],
  },
  {
    group: "Health & Wellness",
    categories: [
      "Vitamins & Supplements",
      "Minerals",
      "Herbal & Natural Remedies",
      "Sports Nutrition",
      "Weight Management",
      "Probiotics & Digestive Health",
    ],
  },
  {
    group: "Personal Care",
    categories: [
      "Skincare",
      "Hair Care",
      "Oral Care",
      "Baby Care",
      "Feminine Hygiene",
      "Men's Grooming",
      "Deodorants & Antiperspirants",
      "Soaps & Bath Products",
    ],
  },
  {
    group: "Provision Store Items",
    categories: [
      "Beverages",
      "Snacks & Confectionery",
      "Canned Foods",
      "Dairy Products",
      "Grains & Cereals",
      "Spices & Condiments",
      "Personal Hygiene",
      "Household Cleaning",
      "Baby Products",
      "Pet Care",
    ],
  },
  {
    group: "Specialized Pharmacy",
    categories: [
      "Veterinary Medicines",
      "Dermatologicals",
      "Oncology",
      "Cardiology",
      "Neurology",
      "Psychiatry",
    ],
  },
  {
    group: "Other",
    categories: [
      "Medical Books & References",
      "Pharmacy Accessories",
      "Seasonal Items",
      "Promotional Items",
      "Custom/Other",
    ],
  },
];

// Helper function to get all categories as a flat array
export const getAllCategories = (): string[] => {
  return groupedCategories.flatMap((group) => group.categories);
};

// Helper function to get category group
export const getCategoryGroup = (category: string): string => {
  for (const group of groupedCategories) {
    if (group.categories.includes(category)) {
      return group.group;
    }
  }
  return "Other";
};

// Helper to check if a category is medical equipment
export const isMedicalEquipmentCategory = (category: string): boolean => {
  const equipmentGroup = groupedCategories.find(
    (g) => g.group === "Medical Equipment & Supplies"
  );
  return equipmentGroup?.categories.includes(category) || false;
};

// Helper to check if a category requires prescription
export const isPrescriptionCategory = (category: string): boolean => {
  const prescriptionCategories = [
    "Antibiotics",
    "Antihypertensives",
    "Antidiabetics",
    "Antidepressants",
    "Antipsychotics",
    "Anticoagulants",
    "Bronchodilators",
    "Corticosteroids",
    "Immunosuppressants",
    "Hormones & Contraceptives",
  ];
  return prescriptionCategories.includes(category);
};
