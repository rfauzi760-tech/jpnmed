/** Inventory target only. J-Med maps these concepts to communication content; it does not copy RFSmed decision support. */
export const RFSMED_INVENTORY = {
  source: 'https://rfsmed.vercel.app',
  observedAt: '2026-09-21',
  counts: { drugs: 518, guidelines: 340, icd10: 638, scores: 163, calculators: 29, imaging: 159, interactions: 2479 },
  total: 4326,
} as const;

export const RFSMED_SPECIALTIES = [
  'emergency-medicine', 'internal-medicine', 'pediatrics', 'neonatology', 'obstetrics-gynecology', 'infectious-disease',
  'cardiology', 'pulmonology', 'gastroenterology', 'hepatology', 'nephrology', 'hypertension', 'endocrinology', 'neurology',
  'hematology', 'oncology', 'surgery', 'orthopedics', 'urology', 'ent', 'ophthalmology', 'dermatology', 'psychiatry',
  'anesthesiology', 'intensive-care', 'geriatrics', 'palliative-care', 'nutrition', 'nursing', 'toxicology',
] as const;
