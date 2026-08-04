export type Category = "longevity" | "sleep" | "focus" | "recovery" | "general";
export type TimeOfDay = "morning" | "afternoon" | "evening";

export interface SupplementItem {
  id: string;
  brand: string;
  name: string;
  category: Category;
  totalPills: number;
  remainingPills: number;
  dailyDose: number;
  timeOfDay: TimeOfDay;
  expirationDate: string; // ISO
  takenToday: boolean;
  takeWithFood: boolean;
  affiliateUrl: string;
  priceEstimate: number;
  note?: string;
  barcode?: string;
  activeIngredients?: ActiveIngredient[];
}

export interface ActiveIngredient {
  name: string;
  amountMg: number;
}

const iso = (daysFromNow: number) =>
  new Date(Date.now() + daysFromNow * 86400000).toISOString();

export const initialSupplements: SupplementItem[] = [
  {
    id: "d3k2",
    brand: "Thorne",
    name: "Vitamin D3 + K2",
    category: "longevity",
    totalPills: 60,
    remainingPills: 42,
    dailyDose: 1,
    timeOfDay: "morning",
    expirationDate: iso(560),
    takenToday: true,
    takeWithFood: true,
    affiliateUrl: "https://iherb.com/pr/thorne-d3-k2?rcode=BIOSTACK",
    priceEstimate: 28.5,
    note: "Take with fats",
    barcode: "693749306061",
    activeIngredients: [
      { name: "Vitamin D3", amountMg: 0.125 },
      { name: "Vitamin K2", amountMg: 0.2 },
    ],
  },
  {
    id: "nmn",
    brand: "Renue By Science",
    name: "NMN 500mg",
    category: "longevity",
    totalPills: 90,
    remainingPills: 11,
    dailyDose: 2,
    timeOfDay: "morning",
    expirationDate: iso(300),
    takenToday: false,
    takeWithFood: false,
    affiliateUrl: "https://iherb.com/pr/nmn-500?rcode=BIOSTACK",
    priceEstimate: 64.0,
    note: "Empty stomach",
  },
  {
    id: "electrolytes",
    brand: "LMNT",
    name: "Morning Electrolytes",
    category: "recovery",
    totalPills: 30,
    remainingPills: 19,
    dailyDose: 1,
    timeOfDay: "morning",
    expirationDate: iso(410),
    takenToday: true,
    takeWithFood: false,
    affiliateUrl: "https://amazon.com/dp/lmnt?tag=biostack-20",
    priceEstimate: 45.0,
    note: "With 500ml water",
  },
  {
    id: "zinc",
    brand: "Life Extension",
    name: "Zinc Picolinate 30mg",
    category: "general",
    totalPills: 100,
    remainingPills: 63,
    dailyDose: 1,
    timeOfDay: "morning",
    expirationDate: iso(720),
    takenToday: false,
    takeWithFood: true,
    affiliateUrl: "https://iherb.com/pr/zinc-pico?rcode=BIOSTACK",
    priceEstimate: 12.0,
    barcode: "737870193203",
    activeIngredients: [{ name: "Zinc", amountMg: 30 }],
  },
  {
    id: "copper",
    brand: "Solgar",
    name: "Copper 2mg",
    category: "general",
    totalPills: 100,
    remainingPills: 88,
    dailyDose: 1,
    timeOfDay: "morning",
    expirationDate: iso(640),
    takenToday: false,
    takeWithFood: true,
    affiliateUrl: "https://iherb.com/pr/copper?rcode=BIOSTACK",
    priceEstimate: 9.5,
    barcode: "033984014503",
    activeIngredients: [{ name: "Copper", amountMg: 2 }],
  },
  {
    id: "omega3",
    brand: "Nordic Naturals",
    name: "Omega-3 Ultimate",
    category: "longevity",
    totalPills: 120,
    remainingPills: 74,
    dailyDose: 2,
    timeOfDay: "afternoon",
    expirationDate: iso(12),
    takenToday: false,
    takeWithFood: true,
    affiliateUrl: "https://iherb.com/pr/omega-3?rcode=BIOSTACK",
    priceEstimate: 39.9,
    note: "Take with fats",
  },
  {
    id: "coq10",
    brand: "Qunol",
    name: "CoQ10 Ubiquinol 100mg",
    category: "recovery",
    totalPills: 60,
    remainingPills: 8,
    dailyDose: 1,
    timeOfDay: "afternoon",
    expirationDate: iso(480),
    takenToday: false,
    takeWithFood: true,
    affiliateUrl: "https://amazon.com/dp/coq10?tag=biostack-20",
    priceEstimate: 33.0,
    note: "Take with fats",
  },
  {
    id: "magnesium",
    brand: "Pure Encapsulations",
    name: "Magnesium Glycinate",
    category: "sleep",
    totalPills: 90,
    remainingPills: 51,
    dailyDose: 2,
    timeOfDay: "evening",
    expirationDate: iso(390),
    takenToday: false,
    takeWithFood: false,
    affiliateUrl: "https://iherb.com/pr/mag-glycinate?rcode=BIOSTACK",
    priceEstimate: 31.0,
    note: "90 min pre-bed",
    barcode: "766298009423",
    activeIngredients: [{ name: "Magnesium", amountMg: 120 }],
  },
  {
    id: "theanine",
    brand: "NOW Foods",
    name: "L-Theanine 200mg",
    category: "sleep",
    totalPills: 60,
    remainingPills: 22,
    dailyDose: 1,
    timeOfDay: "evening",
    expirationDate: iso(250),
    takenToday: false,
    takeWithFood: false,
    affiliateUrl: "https://iherb.com/pr/l-theanine?rcode=BIOSTACK",
    priceEstimate: 17.5,
    activeIngredients: [{ name: "L-Theanine", amountMg: 200 }],
  },
  {
    id: "apigenin",
    brand: "Double Wood",
    name: "Apigenin 50mg",
    category: "sleep",
    totalPills: 60,
    remainingPills: 5,
    dailyDose: 1,
    timeOfDay: "evening",
    expirationDate: iso(-3),
    takenToday: false,
    takeWithFood: false,
    affiliateUrl: "https://amazon.com/dp/apigenin?tag=biostack-20",
    priceEstimate: 22.0,
    activeIngredients: [{ name: "Apigenin", amountMg: 50 }],
  },
  {
    id: "alphagpc",
    brand: "Nootropics Depot",
    name: "Alpha-GPC 300mg",
    category: "focus",
    totalPills: 60,
    remainingPills: 36,
    dailyDose: 1,
    timeOfDay: "morning",
    expirationDate: iso(520),
    takenToday: true,
    takeWithFood: false,
    affiliateUrl: "https://amazon.com/dp/alpha-gpc?tag=biostack-20",
    priceEstimate: 26.0,
  },
  {
    id: "creatine",
    brand: "Thorne",
    name: "Creatine Monohydrate",
    category: "recovery",
    totalPills: 90,
    remainingPills: 68,
    dailyDose: 1,
    timeOfDay: "afternoon",
    expirationDate: iso(600),
    takenToday: false,
    takeWithFood: false,
    affiliateUrl: "https://iherb.com/pr/creatine?rcode=BIOSTACK",
    priceEstimate: 43.0,
  },
];

export const categoryLabels: Record<Category, string> = {
  longevity: "Longevity",
  sleep: "Sleep",
  focus: "Focus",
  recovery: "Recovery",
  general: "General",
};

export const timeBlocks: {
  key: TimeOfDay;
  label: string;
  window: string;
}[] = [
  { key: "morning", label: "Morning Protocol", window: "07:00 – 09:00" },
  { key: "afternoon", label: "Afternoon", window: "12:00 – 14:00" },
  { key: "evening", label: "Evening / Pre-Bed", window: "21:00 – 22:30" },
];

export function daysUntil(isoDate: string) {
  return Math.round((new Date(isoDate).getTime() - Date.now()) / 86400000);
}

export function daysOfSupply(item: SupplementItem) {
  return Math.floor(item.remainingPills / Math.max(item.dailyDose, 1));
}

export function expirationLabel(item: SupplementItem) {
  const d = daysUntil(item.expirationDate);
  if (d < 0) return { text: "EXPIRED", tone: "crimson" as const };
  if (d <= 30) return { text: `EXP: In ${d} Days`, tone: "amber" as const };
  return {
    text: `EXP: ${new Date(item.expirationDate).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })}`,
    tone: "emerald" as const,
  };
}

/** Local ingredient dictionary used when a product has no explicit label data. */
const ingredientKeywords: { match: RegExp; name: string; fallbackMg: number }[] = [
  { match: /zinc/i, name: "Zinc", fallbackMg: 15 },
  { match: /copper/i, name: "Copper", fallbackMg: 2 },
  { match: /magnesium/i, name: "Magnesium", fallbackMg: 120 },
  { match: /\bd3\b|vitamin d/i, name: "Vitamin D3", fallbackMg: 0.125 },
  { match: /\bk2\b|vitamin k/i, name: "Vitamin K2", fallbackMg: 0.1 },
  { match: /theanine/i, name: "L-Theanine", fallbackMg: 200 },
  { match: /apigenin/i, name: "Apigenin", fallbackMg: 50 },
  { match: /omega|fish oil/i, name: "Omega-3", fallbackMg: 1000 },
  { match: /iron/i, name: "Iron", fallbackMg: 18 },
  { match: /calcium/i, name: "Calcium", fallbackMg: 500 },
];

/** Derives per-pill active ingredients from label data or, failing that, the product name. */
export function deriveIngredients(item: SupplementItem): ActiveIngredient[] {
  if (item.activeIngredients?.length) return item.activeIngredients;
  const mgMatch = item.name.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g)\b/i);
  const unit = mgMatch?.[2]?.toLowerCase();
  const parsed = mgMatch
    ? Number(mgMatch[1]) * (unit === "mcg" ? 0.001 : unit === "g" ? 1000 : 1)
    : null;

  return ingredientKeywords
    .filter((k) => k.match.test(item.name))
    .map((k) => ({ name: k.name, amountMg: parsed ?? k.fallbackMg }));
}

export const mockScanResult = {
  brand: "Life Extension",
  name: "Two-Per-Day Multivitamin",
  servingSize: "2 capsules",
  totalPills: 120,
  expirationDate: "2027-11-01",
  category: "general" as Category,
  priceEstimate: 24.75,
};
