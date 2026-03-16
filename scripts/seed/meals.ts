import type { MealIngredientSeed, MealSeed, SeedMealType } from "./types";

function ingredients(entries: Array<[string, number, MealIngredientSeed["unit"]]>): MealIngredientSeed[] {
  return entries.map(([ingredient_name, quantity, unit]) => ({ ingredient_name, quantity, unit }));
}

const requiredMeals: MealSeed[] = [
  {
    name: "Pasta Bake",
    mealType: "dinner",
    prepTimeMinutes: 40,
    meal_ingredients: ingredients([
      ["penne pasta", 300, "g"],
      ["passata", 500, "ml"],
      ["cheddar cheese", 120, "g"],
      ["mozzarella", 80, "g"],
      ["onion", 1, "each"],
      ["garlic", 2, "each"],
    ]),
  },
  {
    name: "Veggie Chilli",
    mealType: "dinner",
    prepTimeMinutes: 35,
    meal_ingredients: ingredients([
      ["kidney beans", 400, "g"],
      ["black beans", 400, "g"],
      ["chopped tomatoes", 400, "g"],
      ["bell pepper", 1, "each"],
      ["onion", 1, "each"],
      ["ground cumin", 8, "g"],
    ]),
  },
  {
    name: "Chicken Curry",
    mealType: "dinner",
    prepTimeMinutes: 35,
    meal_ingredients: ingredients([
      ["chicken breast", 450, "g"],
      ["coconut milk", 400, "ml"],
      ["curry powder", 12, "g"],
      ["onion", 1, "each"],
      ["garlic", 2, "each"],
      ["basmati rice", 280, "g"],
    ]),
  },
  {
    name: "Stir Fry",
    mealType: "dinner",
    prepTimeMinutes: 20,
    meal_ingredients: ingredients([
      ["egg noodles", 250, "g"],
      ["chicken thigh", 400, "g"],
      ["bell pepper", 1, "each"],
      ["carrot", 160, "g"],
      ["soy sauce", 40, "ml"],
      ["ginger", 20, "g"],
    ]),
  },
  {
    name: "Tuna Pasta",
    mealType: "lunch",
    prepTimeMinutes: 20,
    meal_ingredients: ingredients([
      ["fusilli pasta", 260, "g"],
      ["tuna chunks", 200, "g"],
      ["sweetcorn", 150, "g"],
      ["semi-skimmed milk", 120, "ml"],
      ["cheddar cheese", 50, "g"],
    ]),
  },
  {
    name: "Omelette",
    mealType: "breakfast",
    prepTimeMinutes: 12,
    meal_ingredients: ingredients([
      ["eggs", 4, "each"],
      ["semi-skimmed milk", 40, "ml"],
      ["cheddar cheese", 35, "g"],
      ["spinach", 40, "g"],
    ]),
  },
  {
    name: "Jacket Potato",
    mealType: "lunch",
    prepTimeMinutes: 50,
    meal_ingredients: ingredients([
      ["baking potato", 2, "each"],
      ["butter", 30, "g"],
      ["cheddar cheese", 80, "g"],
      ["baked beans", 200, "g"],
    ]),
  },
  {
    name: "Wraps",
    mealType: "lunch",
    prepTimeMinutes: 15,
    meal_ingredients: ingredients([
      ["tortilla wraps", 4, "each"],
      ["chicken breast", 350, "g"],
      ["mixed salad leaves", 100, "g"],
      ["tomato", 120, "g"],
      ["natural yogurt", 80, "g"],
    ]),
  },
  {
    name: "Spaghetti Bolognese",
    mealType: "dinner",
    prepTimeMinutes: 45,
    meal_ingredients: ingredients([
      ["spaghetti", 320, "g"],
      ["minced beef", 450, "g"],
      ["passata", 500, "ml"],
      ["onion", 1, "each"],
      ["carrot", 120, "g"],
      ["celery", 80, "g"],
    ]),
  },
  {
    name: "Lentil Soup",
    mealType: "dinner",
    prepTimeMinutes: 30,
    meal_ingredients: ingredients([
      ["red lentils", 250, "g"],
      ["vegetable stock", 1000, "ml"],
      ["onion", 1, "each"],
      ["carrot", 180, "g"],
      ["garlic", 2, "each"],
    ]),
  },
];

const breakfastBases = [
  { title: "Porridge Bowl", ingredients: ingredients([["oats", 70, "g"], ["semi-skimmed milk", 250, "ml"], ["banana", 1, "each"]]), prep: 8 },
  { title: "Yogurt Fruit Pot", ingredients: ingredients([["natural yogurt", 220, "g"], ["apple", 1, "each"], ["honey", 15, "g"]]), prep: 6 },
  { title: "Egg Muffin", ingredients: ingredients([["eggs", 2, "each"], ["wholemeal bread", 1, "each"], ["spinach", 30, "g"]]), prep: 10 },
  { title: "Peanut Toast", ingredients: ingredients([["wholemeal bread", 2, "each"], ["peanut butter", 30, "g"], ["banana", 1, "each"]]), prep: 5 },
];

const lunchBases = [
  { title: "Chicken Wrap", ingredients: ingredients([["tortilla wraps", 2, "each"], ["chicken breast", 220, "g"], ["mixed salad leaves", 50, "g"], ["natural yogurt", 30, "g"]]), prep: 15 },
  { title: "Tuna Jacket", ingredients: ingredients([["baking potato", 1, "each"], ["tuna chunks", 120, "g"], ["sweetcorn", 60, "g"]]), prep: 35 },
  { title: "Lentil Bowl", ingredients: ingredients([["red lentils", 160, "g"], ["chopped tomatoes", 250, "g"], ["spinach", 60, "g"]]), prep: 22 },
  { title: "Veg Pasta Lunch", ingredients: ingredients([["penne pasta", 180, "g"], ["courgette", 120, "g"], ["bell pepper", 1, "each"], ["passata", 180, "ml"]]), prep: 20 },
];

const dinnerBases = [
  { title: "Chicken Stir Fry", ingredients: ingredients([["egg noodles", 220, "g"], ["chicken thigh", 320, "g"], ["broccoli", 180, "g"], ["soy sauce", 35, "ml"]]), prep: 20 },
  { title: "Bean Chilli", ingredients: ingredients([["kidney beans", 400, "g"], ["chopped tomatoes", 400, "g"], ["onion", 1, "each"], ["paprika", 8, "g"]]), prep: 30 },
  { title: "Curry Pot", ingredients: ingredients([["chicken breast", 360, "g"], ["coconut milk", 300, "ml"], ["curry powder", 10, "g"], ["basmati rice", 260, "g"]]), prep: 32 },
  { title: "Bolognese Night", ingredients: ingredients([["spaghetti", 280, "g"], ["minced beef", 400, "g"], ["passata", 350, "ml"], ["onion", 1, "each"]]), prep: 38 },
  { title: "Fish Traybake", ingredients: ingredients([["white fish fillet", 380, "g"], ["baking potato", 2, "each"], ["green beans", 180, "g"], ["olive oil", 15, "ml"]]), prep: 34 },
  { title: "Veggie Soup Supper", ingredients: ingredients([["red lentils", 200, "g"], ["vegetable stock", 900, "ml"], ["carrot", 150, "g"], ["celery", 90, "g"]]), prep: 28 },
];

function cloneMeal(baseName: string, mealType: SeedMealType, prepTimeMinutes: number, meal_ingredients: MealIngredientSeed[], variant: string): MealSeed {
  return {
    name: `${baseName} ${variant}`,
    mealType,
    prepTimeMinutes,
    meal_ingredients: meal_ingredients.map((entry) => ({ ...entry })),
  };
}

const variants = [
  "Classic",
  "Quick",
  "Family",
  "Budget",
  "Hearty",
  "Weeknight",
  "Light",
  "Protein",
  "Greens",
  "Comfort",
];

const generatedMeals: MealSeed[] = [];

for (const variant of variants) {
  for (const base of breakfastBases) {
    generatedMeals.push(cloneMeal(base.title, "breakfast", base.prep + (variant === "Quick" ? -2 : 0), base.ingredients, variant));
  }
  for (const base of lunchBases) {
    generatedMeals.push(cloneMeal(base.title, "lunch", base.prep + (variant === "Quick" ? -3 : 0), base.ingredients, variant));
  }
  for (const base of dinnerBases) {
    generatedMeals.push(cloneMeal(base.title, "dinner", base.prep + (variant === "Quick" ? -4 : 0), base.ingredients, variant));
  }
}

const deduped = Array.from(
  new Map([...requiredMeals, ...generatedMeals].map((meal) => [meal.name.toLowerCase(), meal])).values(),
);

// Task target: 150-200 meals. We pin to deterministic 160 rows.
export const mealsSeed: MealSeed[] = deduped.slice(0, 160);
