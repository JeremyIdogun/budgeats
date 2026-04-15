import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  deriveBudgetRemainingPence,
  deriveBudgetUtilisationPct,
  deriveIngredientCostPence,
  deriveMealCostPence,
} from "./budget";
import type { Ingredient, IngredientPrice, Meal } from "@/models";

function ingredient(id: string, storageQuantity = 1000): Ingredient {
  return {
    id,
    name: id,
    category: "grains-pasta",
    defaultUnit: "g",
    storageUnit: "g",
    storageQuantity,
  };
}

function price(ingredientId: string, pricePerStorageUnit: number): IngredientPrice {
  return {
    ingredientId,
    retailerId: "tesco",
    pricePerStorageUnit,
    isOwnLabel: false,
    lastUpdated: "2026-04-15T00:00:00Z",
  };
}

describe("budget", () => {
  describe("deriveIngredientCostPence", () => {
    it("rounds up fractional pence", () => {
      // 100p per 1000g → 250g = 25p
      const cost = deriveIngredientCostPence(ingredient("flour", 1000), price("flour", 100), 250);
      assert.equal(cost, 25);
    });

    it("uses ceiling to avoid under-charging", () => {
      // 100p per 1000g → 251g = 25.1p → 26p
      const cost = deriveIngredientCostPence(ingredient("flour", 1000), price("flour", 100), 251);
      assert.equal(cost, 26);
    });

    it("rejects invalid inputs", () => {
      assert.throws(() => deriveIngredientCostPence(ingredient("x"), price("x", 100), -1));
      assert.throws(() => deriveIngredientCostPence(ingredient("x", 0), price("x", 100), 10));
    });
  });

  describe("deriveMealCostPence", () => {
    const ingredients = [ingredient("flour", 1000), ingredient("butter", 250)];
    const prices = [price("flour", 100), price("butter", 200)];
    const meal: Meal = {
      id: "scones",
      name: "Scones",
      emoji: "🥐",
      type: "breakfast",
      prepTimeMinutes: 20,
      dietaryTags: [],
      basePortions: 2,
      ingredients: [
        { ingredientId: "flour", quantity: 500, unit: "g" },
        { ingredientId: "butter", quantity: 100, unit: "g" },
      ],
    };

    it("sums ingredient costs scaled to target portions", () => {
      // 2→4 portions: flour 1000g = 100p; butter 200g → 200p/250g * 200g = 160p
      const cost = deriveMealCostPence(meal, ingredients, prices, "tesco", 4);
      assert.equal(cost, 100 + 160);
    });

    it("returns null when an ingredient is missing", () => {
      const cost = deriveMealCostPence(meal, [ingredients[0]], prices, "tesco", 2);
      assert.equal(cost, null);
    });

    it("returns null when a price is missing for the retailer", () => {
      const cost = deriveMealCostPence(meal, ingredients, [prices[0]], "tesco", 2);
      assert.equal(cost, null);
    });

    it("skips optional ingredients", () => {
      const mealWithOptional: Meal = {
        ...meal,
        ingredients: [
          meal.ingredients[0],
          { ...meal.ingredients[1], optional: true },
        ],
      };
      const cost = deriveMealCostPence(mealWithOptional, ingredients, prices, "tesco", 2);
      assert.equal(cost, 50); // only flour 500g = 50p
    });
  });

  describe("deriveBudgetRemainingPence", () => {
    it("subtracts spent from budget", () => {
      assert.equal(deriveBudgetRemainingPence(7500, 3000), 4500);
    });

    it("can go negative when over budget", () => {
      assert.equal(deriveBudgetRemainingPence(5000, 6000), -1000);
    });
  });

  describe("deriveBudgetUtilisationPct", () => {
    it("returns zero for non-positive budgets", () => {
      assert.equal(deriveBudgetUtilisationPct(0, 1000), 0);
      assert.equal(deriveBudgetUtilisationPct(-100, 1000), 0);
    });

    it("returns percentage of spend over budget", () => {
      assert.equal(deriveBudgetUtilisationPct(10000, 2500), 25);
    });
  });
});
