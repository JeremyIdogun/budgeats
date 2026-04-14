import { describe, expect, it } from "vitest";
import { scoreCandidate } from "./scoring";

describe("matching-engine scoreCandidate", () => {
  it("scores exact name matches >= 0.90", () => {
    const result = scoreCandidate(
      {
        name: "chopped tomatoes",
        category: "tinned",
        form: "tinned",
        qualityTier: "own-label",
        brandTier: "store",
        requiredSizeBaseUnit: 400,
      },
      {
        retailerProductId: "p1",
        name: "own-label chopped tomatoes",
        category: "tinned",
        form: "tinned",
        qualityTier: "own-label",
        brandTier: "store",
        sizeBaseUnit: 400,
      },
    );

    expect(result.matchScore).toBeGreaterThanOrEqual(0.9);
    expect(result.status).toBe("auto");
  });

  it("scores different forms in 0.65-0.90 range", () => {
    const result = scoreCandidate(
      {
        name: "spinach",
        category: "vegetable",
        form: "fresh",
        requiredSizeBaseUnit: 200,
      },
      {
        retailerProductId: "p2",
        name: "frozen spinach blocks",
        category: "vegetable",
        form: "frozen",
        sizeBaseUnit: 225,
      },
    );

    expect(result.matchScore).toBeGreaterThanOrEqual(0.65);
    expect(result.matchScore).toBeLessThan(0.9);
    expect(result.status).toBe("review");
  });

  it("scores completely different products < 0.65", () => {
    const result = scoreCandidate(
      {
        name: "chicken breast",
        category: "meat",
        form: "fresh",
        requiredSizeBaseUnit: 400,
      },
      {
        retailerProductId: "p3",
        name: "dark chocolate digestives",
        category: "biscuits",
        form: "dried",
        sizeBaseUnit: 200,
      },
    );

    expect(result.matchScore).toBeLessThan(0.65);
    expect(result.status).toBe("unmatched");
  });
});
