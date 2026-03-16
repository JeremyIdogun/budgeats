import assert from "node:assert/strict";
import { describe, it } from "node:test";
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

    assert.ok(result.matchScore >= 0.9);
    assert.equal(result.status, "auto");
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

    assert.ok(result.matchScore >= 0.65);
    assert.ok(result.matchScore < 0.9);
    assert.equal(result.status, "review");
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

    assert.ok(result.matchScore < 0.65);
    assert.equal(result.status, "unmatched");
  });
});
