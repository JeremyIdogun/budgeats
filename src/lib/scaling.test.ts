import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { getScalingFactor, scaleQuantity } from "./scaling";

describe("scaling", () => {
  describe("getScalingFactor", () => {
    it("returns the ratio of target over base", () => {
      assert.equal(getScalingFactor(2, 4), 2);
      assert.equal(getScalingFactor(4, 2), 0.5);
    });

    it("rejects non-positive base portions", () => {
      assert.throws(() => getScalingFactor(0, 4), /basePortions/);
      assert.throws(() => getScalingFactor(-1, 4), /basePortions/);
    });

    it("rejects non-positive target portions", () => {
      assert.throws(() => getScalingFactor(2, 0), /targetPortions/);
      assert.throws(() => getScalingFactor(2, -1), /targetPortions/);
    });

    it("rejects non-finite inputs", () => {
      assert.throws(() => getScalingFactor(Number.NaN, 2), /basePortions/);
      assert.throws(() => getScalingFactor(2, Number.POSITIVE_INFINITY), /targetPortions/);
    });
  });

  describe("scaleQuantity", () => {
    it("scales a base quantity by portion ratio", () => {
      assert.equal(scaleQuantity(100, 2, 4), 200);
      assert.equal(scaleQuantity(250, 4, 2), 125);
    });

    it("allows zero base quantity", () => {
      assert.equal(scaleQuantity(0, 2, 4), 0);
    });

    it("rejects negative quantities", () => {
      assert.throws(() => scaleQuantity(-1, 2, 4), /baseQuantity/);
    });
  });
});
