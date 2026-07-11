// app/utils/medicPoints.ts
export const calculatePointsForVerification = (
  confidenceScore: number,
  hasReferences: boolean = false,
  hasImages: boolean = false,
  isComplete: boolean = false
): number => {
  let points = 10; // Base points

  // Points based on confidence score
  if (confidenceScore >= 90) points += 25;
  else if (confidenceScore >= 80) points += 20;
  else if (confidenceScore >= 70) points += 15;
  else if (confidenceScore >= 60) points += 10;
  else if (confidenceScore >= 50) points += 5;

  // Bonus points
  if (hasReferences) points += 5;
  if (hasImages) points += 10;
  if (isComplete) points += 15;

  return Math.min(points, 75); // Cap at 75 points per verification
};

export const getLevelRequirements = (level: string) => {
  const requirements: Record<string, { points: number; drugs: number }> = {
    "New Medic": { points: 0, drugs: 0 },
    "Beginner Medic": { points: 10, drugs: 1 },
    "Verified Medic": { points: 100, drugs: 5 },
    "Advanced Medic": { points: 500, drugs: 20 },
    "Drug Expert": { points: 1000, drugs: 50 },
    "Senior Pharmacist": { points: 2500, drugs: 100 },
    "Master Pharmacist": { points: 5000, drugs: 200 },
    "Legendary Medic": { points: 10000, drugs: 500 },
  };

  return requirements[level] || requirements["New Medic"];
};
