import type { ExtractedAttributes, IngredientDescriptor, ProductCandidate } from "./types";

const abbreviationMap: Record<string, string> = {
  choc: "chocolate",
  tom: "tomato",
  veg: "vegetable",
  ck: "chicken",
  mins: "minutes",
};

const formKeywords = ["fresh", "frozen", "tinned", "dried"] as const;
const qualityKeywords = ["value", "own-label", "branded", "premium"] as const;
const brandKeywords = ["budget", "store", "national", "premium"] as const;

function normalizeToken(token: string): string {
  return abbreviationMap[token] ?? token;
}

export function normalizeText(raw: string): string {
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((token) => normalizeToken(token))
    .join(" ");
}

function tokenize(raw: string): string[] {
  return normalizeText(raw)
    .split(" ")
    .filter((token) => token.length > 1);
}

function firstKeyword(tokens: string[], keywords: readonly string[]): string | null {
  return keywords.find((value) => tokens.includes(value)) ?? null;
}

function inferQualityTier(tokens: string[], explicit?: string): string | null {
  if (explicit) return explicit;
  return firstKeyword(tokens, qualityKeywords);
}

function inferBrandTier(tokens: string[], explicit?: string): string | null {
  if (explicit) return explicit;
  return firstKeyword(tokens, brandKeywords);
}

function inferForm(tokens: string[], explicit?: string): string | null {
  if (explicit) return explicit;
  return firstKeyword(tokens, formKeywords);
}

export function extractAttributes(input: IngredientDescriptor | ProductCandidate): ExtractedAttributes {
  const normalizedName = normalizeText(input.name);
  const tokens = tokenize(input.name);
  const sizeBaseUnit =
    "requiredSizeBaseUnit" in input
      ? (input.requiredSizeBaseUnit ?? null)
      : ("sizeBaseUnit" in input ? (input.sizeBaseUnit ?? null) : null);

  return {
    normalizedName,
    tokens,
    category: input.category ?? null,
    form: inferForm(tokens, input.form),
    qualityTier: inferQualityTier(tokens, input.qualityTier),
    brandTier: inferBrandTier(tokens, input.brandTier),
    sizeBaseUnit,
  };
}
