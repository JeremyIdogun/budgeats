import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeCheapestMixedRetailer,
  computeCheapestSingleRetailer,
  computeMealCostPence,
  getEffectivePricePence,
  resolveIngredientPrice,
} from "./index";
import type { IngredientPriceInput, MealCostInput } from "./types";

describe("pricing-engine golden cases", () => {
  it("larger pack wins on unit price but loses after waste penalty", () => {
    const makeMeal = (packSizeBaseUnit: number, packPricePence: number): MealCostInput => ({
      id: "m1",
      name: "Soup Base",
      ingredients: [
        {
          ingredientName: "tomato",
          recipeRequiredQuantity: 100,
          reuseInWeekPlan: 0,
          reuseDaysFromNow: 0,
          wasteHalfLifeDays: 2,
          priceInput: {
            ingredientName: "tomato",
            exactProductMatches: [
              {
                retailerProductId: `tom-${packSizeBaseUnit}`,
                retailerId: "tesco",
                name: "tomato pack",
                packSizeBaseUnit,
                prices: { base_price_pence: packPricePence },
                isOwnLabel: true,
              },
            ],
            canonicalIngredientMatches: [],
            approvedSubstitutes: [],
            cheapestValidOptions: [],
            loyaltyEnabled: false,
          },
        },
      ],
    });

    const largePack = computeMealCostPence(
      makeMeal(1000, 300),
      { weekStartDate: "2026-03-09" },
      "tesco",
      false,
    );
    const smallPack = computeMealCostPence(
      makeMeal(250, 120),
      { weekStartDate: "2026-03-09" },
      "tesco",
      false,
    );

    const largeUnitPrice = 300 / 1000;
    const smallUnitPrice = 120 / 250;
    assert.ok(largeUnitPrice < smallUnitPrice);
    assert.ok(largePack.totalCostPence > smallPack.totalCostPence);
  });

  it("loyalty price beats standard price when enabled", () => {
    const standard = getEffectivePricePence(
      { base_price_pence: 200, loyalty_price_pence: 150 },
      false,
    );
    const loyalty = getEffectivePricePence(
      { base_price_pence: 200, loyalty_price_pence: 150 },
      true,
    );

    assert.equal(loyalty, 150);
    assert.ok(loyalty < standard);
  });

  it("substitute can beat equivalent on total cost", () => {
    const equivalentOnly: IngredientPriceInput = {
      ingredientName: "minced beef",
      exactProductMatches: [],
      canonicalIngredientMatches: [
        {
          retailerProductId: "eq-1",
          retailerId: "tesco",
          name: "beef mince equivalent",
          packSizeBaseUnit: 500,
          prices: { base_price_pence: 450 },
          isOwnLabel: false,
        },
      ],
      approvedSubstitutes: [],
      cheapestValidOptions: [],
      loyaltyEnabled: false,
    };

    const substituteOnly: IngredientPriceInput = {
      ingredientName: "minced beef",
      exactProductMatches: [],
      canonicalIngredientMatches: [],
      approvedSubstitutes: [
        {
          retailerProductId: "sub-1",
          retailerId: "tesco",
          name: "green lentils",
          packSizeBaseUnit: 500,
          prices: { base_price_pence: 180 },
          isOwnLabel: true,
        },
      ],
      cheapestValidOptions: [],
      loyaltyEnabled: false,
    };

    const equivalent = resolveIngredientPrice(equivalentOnly);
    const substitute = resolveIngredientPrice(substituteOnly);
    assert.ok(substitute.pricePence < equivalent.pricePence);
    assert.equal(substitute.matchLabel, "substitute");
  });

  it("basket single-retailer winner differs from mixed-retailer winner", () => {
    const meal = {
      id: "m2",
      name: "Two Ingredient Basket",
      ingredients: [
        {
          ingredientName: "pasta",
          options: [
            {
              retailerId: "tesco",
              option: {
                retailerProductId: "a",
                retailerId: "tesco",
                name: "pasta tesco",
                packSizeBaseUnit: 500,
                prices: { base_price_pence: 100 },
              },
            },
            {
              retailerId: "asda",
              option: {
                retailerProductId: "b",
                retailerId: "asda",
                name: "pasta asda",
                packSizeBaseUnit: 500,
                prices: { base_price_pence: 300 },
              },
            },
          ],
        },
        {
          ingredientName: "tomato sauce",
          options: [
            {
              retailerId: "tesco",
              option: {
                retailerProductId: "c",
                retailerId: "tesco",
                name: "sauce tesco",
                packSizeBaseUnit: 500,
                prices: { base_price_pence: 500 },
              },
            },
            {
              retailerId: "asda",
              option: {
                retailerProductId: "d",
                retailerId: "asda",
                name: "sauce asda",
                packSizeBaseUnit: 500,
                prices: { base_price_pence: 150 },
              },
            },
          ],
        },
      ],
    };

    const single = computeCheapestSingleRetailer(meal, ["tesco", "asda"], {});
    const mixed = computeCheapestMixedRetailer(meal, ["tesco", "asda"], {});

    assert.equal(single.totalCostPence, 450);
    assert.equal(mixed.totalCostPence, 250);
    assert.ok(mixed.totalCostPence < single.totalCostPence);
  });
});
