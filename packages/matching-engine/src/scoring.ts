import { extractAttributes } from "./normalization";
import type {
  IngredientDescriptor,
  MatchBreakdown,
  MatchLabel,
  MatchResult,
  MatchStatus,
  ProductCandidate,
} from "./types";

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function tokenSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;
  if (union === 0) return 0;
  const coverage = intersection / Math.max(Math.min(setA.size, setB.size), 1);
  const jaccard = intersection / union;
  return clamp(0.7 * coverage + 0.3 * jaccard);
}

function prefixSimilarity(a: string, b: string): number {
  const minLen = Math.min(a.length, b.length);
  if (minLen === 0) return 0;
  let prefixLen = 0;
  for (let index = 0; index < minLen; index += 1) {
    if (a[index] !== b[index]) break;
    prefixLen += 1;
  }
  return prefixLen / minLen;
}

function stringSimilarity(a: string, b: string): number {
  const tokenScore = tokenSimilarity(a.split(" "), b.split(" "));
  const prefixScore = prefixSimilarity(a, b);
  return clamp(0.9 * tokenScore + 0.1 * prefixScore);
}

function categoricalSimilarity(a: string | null, b: string | null): number {
  if (!a || !b) return 0.5;
  return a === b ? 1 : 0;
}

function formSimilarity(a: string | null, b: string | null): number {
  if (!a || !b) return 0.5;
  if (a === b) return 1;
  return 0.35;
}

function sizeSimilarity(required: number | null, candidate: number | null): number {
  if (!required || !candidate || required <= 0 || candidate <= 0) return 0.5;
  const ratio = Math.min(required, candidate) / Math.max(required, candidate);
  return clamp(ratio);
}

function routeStatus(score: number): MatchStatus {
  if (score >= 0.9) return "auto";
  if (score >= 0.65) return "review";
  return "unmatched";
}

function inferLabel(score: number): MatchLabel {
  if (score >= 0.9) return "exact";
  if (score >= 0.65) return "equivalent";
  return "substitute";
}

function buildExplanation(result: MatchResult): string {
  return `name=${result.breakdown.ingredientNameSimilarity.toFixed(2)}, category=${result.breakdown.categorySimilarity.toFixed(2)}, form=${result.breakdown.formSimilarity.toFixed(2)}, size=${result.breakdown.sizeSimilarity.toFixed(2)} => ${result.status}`;
}

export function scoreCandidate(
  ingredient: IngredientDescriptor,
  candidate: ProductCandidate,
): MatchResult {
  const left = extractAttributes(ingredient);
  const right = extractAttributes(candidate);

  const breakdown: MatchBreakdown = {
    ingredientNameSimilarity: stringSimilarity(left.normalizedName, right.normalizedName),
    categorySimilarity: categoricalSimilarity(left.category, right.category),
    formSimilarity: formSimilarity(left.form, right.form),
    qualityTierSimilarity: categoricalSimilarity(left.qualityTier, right.qualityTier),
    brandTierSimilarity: categoricalSimilarity(left.brandTier, right.brandTier),
    sizeSimilarity: sizeSimilarity(left.sizeBaseUnit, right.sizeBaseUnit),
  };

  const rawScore =
    0.35 * breakdown.ingredientNameSimilarity +
    0.2 * breakdown.categorySimilarity +
    0.15 * breakdown.formSimilarity +
    0.1 * breakdown.qualityTierSimilarity +
    0.1 * breakdown.brandTierSimilarity +
    0.1 * breakdown.sizeSimilarity;

  const matchScore = clamp(rawScore);
  const status = routeStatus(matchScore);
  const matchLabel = inferLabel(matchScore);

  const result: MatchResult = {
    retailerProductId: candidate.retailerProductId,
    matchScore,
    status,
    matchLabel,
    explanation: "",
    breakdown,
  };

  result.explanation = buildExplanation(result);
  return result;
}

export function rankCandidates(
  ingredient: IngredientDescriptor,
  candidates: ProductCandidate[],
): MatchResult[] {
  return candidates
    .map((candidate) => scoreCandidate(ingredient, candidate))
    .sort((left, right) => right.matchScore - left.matchScore);
}
