export type MatchLabel = "exact" | "equivalent" | "substitute";
export type MatchStatus = "auto" | "review" | "unmatched";

export interface IngredientDescriptor {
  name: string;
  category?: string;
  form?: string;
  qualityTier?: string;
  brandTier?: string;
  requiredSizeBaseUnit?: number;
}

export interface ProductCandidate {
  retailerProductId: string;
  name: string;
  category?: string;
  form?: string;
  qualityTier?: string;
  brandTier?: string;
  sizeBaseUnit?: number;
}

export interface ExtractedAttributes {
  normalizedName: string;
  tokens: string[];
  category: string | null;
  form: string | null;
  qualityTier: string | null;
  brandTier: string | null;
  sizeBaseUnit: number | null;
}

export interface MatchBreakdown {
  ingredientNameSimilarity: number;
  categorySimilarity: number;
  formSimilarity: number;
  qualityTierSimilarity: number;
  brandTierSimilarity: number;
  sizeSimilarity: number;
}

export interface MatchResult {
  retailerProductId: string;
  matchScore: number;
  status: MatchStatus;
  matchLabel: MatchLabel;
  explanation: string;
  breakdown: MatchBreakdown;
}
