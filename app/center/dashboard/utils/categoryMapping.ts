export const categoryMapping: { [key: string]: string } = {
  // Medication Categories
  analgesics: "medication",
  "analgesics & pain relief": "medication",
  antibiotics: "medication",
  antimalarials: "medication",
  antihypertensives: "medication",
  respiratory: "medication",
  "antacids/ppis": "medication",
  rehydration: "medication",
  sedatives: "medication",
  "antibiotics ophthalmic": "medication",
  antidiabetics: "medication",
  antidepressants: "medication",
  antipsychotics: "medication",
  anticoagulants: "medication",
  bronchodilators: "medication",
  corticosteroids: "medication",
  diabetes: "medication",
  diuretics: "medication",
  gastrointestinal: "medication",
  "hormones & contraceptives": "medication",
  immunosuppressants: "medication",
  "muscle relaxants": "medication",
  ophthalmic: "medication",
  "otic (ear)": "medication",
  topical: "medication",

  // Equipment Categories
  "diagnostic equipment": "equipment",
  "respiratory equipment": "equipment",
  "mobility equipment": "equipment",
  "sterilization equipment": "equipment",
  "surgical instruments": "equipment",
  "patient monitoring": "equipment",
  "mobility aids": "equipment",
  "laboratory equipment": "equipment",
  "dental supplies": "equipment",

  // Supplies Categories
  "first aid": "supplies",
  "first aid supplies": "supplies",
  "wound care": "supplies",
  "disposable medical supplies": "supplies",
  "personal protective equipment (ppe)": "supplies",

  // Consumables Categories
  antiseptics: "consumables",
  "skin care": "consumables",
  skincare: "consumables",
  "soaps & bath products": "consumables",
  "personal hygiene": "consumables",
  "hair care": "consumables",
  "oral care": "consumables",
  "baby care": "consumables",
  "feminine hygiene": "consumables",
  "men's grooming": "consumables",
  "deodorants & antiperspirants": "consumables",

  // Vaccine Category
  vaccines: "vaccine",
  vaccine: "vaccine",

  // Surgical Category
  surgical: "surgical",

  // Pharmaceutical Categories
  vitamins: "pharmaceutical",
  supplements: "pharmaceutical",
  "vitamins & supplements": "pharmaceutical",
  minerals: "pharmaceutical",
  "herbal & natural remedies": "pharmaceutical",
  "sports nutrition": "pharmaceutical",
  "weight management": "pharmaceutical",
  "probiotics & digestive health": "pharmaceutical",
  pharmaceutical: "pharmaceutical",

  // Specialized Pharmacy
  "veterinary medicines": "pharmaceutical",
  dermatologicals: "pharmaceutical",
  oncology: "pharmaceutical",
  cardiology: "pharmaceutical",
  neurology: "pharmaceutical",
  psychiatry: "pharmaceutical",

  // Keep original generic categories
  medication: "medication",
  equipment: "equipment",
  supplies: "supplies",
  consumables: "consumables",
  diagnostic: "diagnostic",
};

export const reverseCategoryMapping: { [key: string]: string } = {
  medication: "Analgesics",
  equipment: "Diagnostic Equipment",
  supplies: "First Aid",
  consumables: "Antiseptics",
  vaccine: "Vaccines",
  diagnostic: "Diagnostic",
  surgical: "Surgical",
  pharmaceutical: "Vitamins",
};

export const validCategories = [
  "medication",
  "equipment",
  "supplies",
  "consumables",
  "vaccine",
  "diagnostic",
  "surgical",
  "pharmaceutical",
];

export const mapCategory = (userCategory: string): string => {
  if (!userCategory) return "medication";

  const normalizedCategory = userCategory.toLowerCase().trim();

  // If already a valid category, return as is
  if (validCategories.includes(normalizedCategory)) {
    return normalizedCategory;
  }

  // Map from detailed to valid category
  return categoryMapping[normalizedCategory] || "medication";
};

export const getDisplayCategory = (backendCategory: string): string => {
  const normalizedCategory = backendCategory.toLowerCase().trim();
  return reverseCategoryMapping[normalizedCategory] || backendCategory;
};
