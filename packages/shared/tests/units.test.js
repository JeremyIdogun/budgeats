import { describe, expect, it } from "vitest";
import {
  computeUnitPricePence,
  normalizeToBaseUnit,
  parseMultipack,
  parsePackSize,
} from "../src/units.ts";

describe("parsePackSize", () => {
  it("parses single unit pack sizes", () => {
    expect(parsePackSize("500g")).toEqual({ quantity: 500, unit: "g" });
    expect(parsePackSize("1.5kg")).toEqual({ quantity: 1.5, unit: "kg" });
  });

  it("parses multipacks and returns total quantity", () => {
    expect(parsePackSize("6 x 330ml")).toEqual({ quantity: 1980, unit: "ml" });
  });
});

describe("parseMultipack", () => {
  it("extracts count, unitSize and unit", () => {
    expect(parseMultipack("4 x 500g")).toEqual({ count: 4, unitSize: 500, unit: "g" });
  });
});

describe("normalizeToBaseUnit", () => {
  it("normalizes cross-unit quantities", () => {
    expect(normalizeToBaseUnit(1, "kg")).toBe(1000);
    expect(normalizeToBaseUnit(1.5, "l")).toBe(1500);
    expect(normalizeToBaseUnit(250, "g")).toBe(250);
    expect(normalizeToBaseUnit(250, "ml")).toBe(250);
  });
});

describe("computeUnitPricePence", () => {
  it("computes pence per 100g/ml", () => {
    expect(computeUnitPricePence(250, { quantity: 500, unit: "g" })).toBe(50);
    expect(computeUnitPricePence(180, { quantity: 1, unit: "l" })).toBe(18);
  });
});
