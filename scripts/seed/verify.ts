import { mealsSeed } from "./meals";

const minimumMeals = 150;

if (mealsSeed.length < minimumMeals) {
  throw new Error(
    `Seed meal coverage too low: expected at least ${minimumMeals}, got ${mealsSeed.length}`,
  );
}

console.log(`Seed verification passed: ${mealsSeed.length} meals available.`);
