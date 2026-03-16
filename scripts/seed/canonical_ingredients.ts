import type { CanonicalIngredientSeed } from "./types";

const coreIngredients: CanonicalIngredientSeed[] = [
  { name: "spaghetti", category: "grains-pasta", default_unit: "g", waste_half_life_days: 90, perishability_tier: "low" },
  { name: "penne pasta", category: "grains-pasta", default_unit: "g", waste_half_life_days: 90, perishability_tier: "low" },
  { name: "fusilli pasta", category: "grains-pasta", default_unit: "g", waste_half_life_days: 90, perishability_tier: "low" },
  { name: "egg noodles", category: "grains-pasta", default_unit: "g", waste_half_life_days: 75, perishability_tier: "low" },
  { name: "tortilla wraps", category: "bakery", default_unit: "each", waste_half_life_days: 8, perishability_tier: "medium" },
  { name: "basmati rice", category: "grains-pasta", default_unit: "g", waste_half_life_days: 120, perishability_tier: "low" },
  { name: "jasmine rice", category: "grains-pasta", default_unit: "g", waste_half_life_days: 120, perishability_tier: "low" },
  { name: "red lentils", category: "tinned-dried", default_unit: "g", waste_half_life_days: 120, perishability_tier: "low" },
  { name: "kidney beans", category: "tinned-dried", default_unit: "g", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "black beans", category: "tinned-dried", default_unit: "g", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "chickpeas", category: "tinned-dried", default_unit: "g", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "chopped tomatoes", category: "tinned-dried", default_unit: "g", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "passata", category: "tinned-dried", default_unit: "ml", waste_half_life_days: 40, perishability_tier: "medium" },
  { name: "tomato puree", category: "condiments", default_unit: "g", waste_half_life_days: 60, perishability_tier: "low" },
  { name: "coconut milk", category: "tinned-dried", default_unit: "ml", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "vegetable stock", category: "condiments", default_unit: "ml", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "chicken stock", category: "condiments", default_unit: "ml", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "soy sauce", category: "condiments", default_unit: "ml", waste_half_life_days: 180, perishability_tier: "low" },
  { name: "olive oil", category: "condiments", default_unit: "ml", waste_half_life_days: 180, perishability_tier: "low" },
  { name: "sunflower oil", category: "condiments", default_unit: "ml", waste_half_life_days: 180, perishability_tier: "low" },
  { name: "curry powder", category: "condiments", default_unit: "g", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "paprika", category: "condiments", default_unit: "g", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "ground cumin", category: "condiments", default_unit: "g", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "dried oregano", category: "condiments", default_unit: "g", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "garlic", category: "fruit-veg", default_unit: "each", waste_half_life_days: 20, perishability_tier: "medium" },
  { name: "ginger", category: "fruit-veg", default_unit: "g", waste_half_life_days: 16, perishability_tier: "medium" },
  { name: "onion", category: "fruit-veg", default_unit: "each", waste_half_life_days: 14, perishability_tier: "medium" },
  { name: "red onion", category: "fruit-veg", default_unit: "each", waste_half_life_days: 14, perishability_tier: "medium" },
  { name: "spring onion", category: "fruit-veg", default_unit: "each", waste_half_life_days: 6, perishability_tier: "high" },
  { name: "carrot", category: "fruit-veg", default_unit: "g", waste_half_life_days: 12, perishability_tier: "medium" },
  { name: "celery", category: "fruit-veg", default_unit: "g", waste_half_life_days: 9, perishability_tier: "medium" },
  { name: "broccoli", category: "fruit-veg", default_unit: "g", waste_half_life_days: 6, perishability_tier: "high" },
  { name: "cauliflower", category: "fruit-veg", default_unit: "g", waste_half_life_days: 7, perishability_tier: "high" },
  { name: "courgette", category: "fruit-veg", default_unit: "g", waste_half_life_days: 6, perishability_tier: "high" },
  { name: "bell pepper", category: "fruit-veg", default_unit: "each", waste_half_life_days: 7, perishability_tier: "high" },
  { name: "green beans", category: "fruit-veg", default_unit: "g", waste_half_life_days: 6, perishability_tier: "high" },
  { name: "spinach", category: "fruit-veg", default_unit: "g", waste_half_life_days: 3, perishability_tier: "high" },
  { name: "kale", category: "fruit-veg", default_unit: "g", waste_half_life_days: 4, perishability_tier: "high" },
  { name: "mixed salad leaves", category: "fruit-veg", default_unit: "g", waste_half_life_days: 3, perishability_tier: "high" },
  { name: "mushrooms", category: "fruit-veg", default_unit: "g", waste_half_life_days: 4, perishability_tier: "high" },
  { name: "sweetcorn", category: "tinned-dried", default_unit: "g", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "peas", category: "frozen", default_unit: "g", waste_half_life_days: 180, perishability_tier: "low" },
  { name: "sweet potato", category: "fruit-veg", default_unit: "g", waste_half_life_days: 12, perishability_tier: "medium" },
  { name: "baking potato", category: "fruit-veg", default_unit: "each", waste_half_life_days: 20, perishability_tier: "medium" },
  { name: "tomato", category: "fruit-veg", default_unit: "g", waste_half_life_days: 5, perishability_tier: "high" },
  { name: "cucumber", category: "fruit-veg", default_unit: "g", waste_half_life_days: 5, perishability_tier: "high" },
  { name: "avocado", category: "fruit-veg", default_unit: "each", waste_half_life_days: 4, perishability_tier: "high" },
  { name: "lemon", category: "fruit-veg", default_unit: "each", waste_half_life_days: 14, perishability_tier: "medium" },
  { name: "lime", category: "fruit-veg", default_unit: "each", waste_half_life_days: 14, perishability_tier: "medium" },
  { name: "fresh parsley", category: "fruit-veg", default_unit: "g", waste_half_life_days: 4, perishability_tier: "high" },
  { name: "fresh coriander", category: "fruit-veg", default_unit: "g", waste_half_life_days: 4, perishability_tier: "high" },
  { name: "fresh basil", category: "fruit-veg", default_unit: "g", waste_half_life_days: 4, perishability_tier: "high" },
  { name: "chicken breast", category: "meat-fish", default_unit: "g", waste_half_life_days: 2, perishability_tier: "high" },
  { name: "chicken thigh", category: "meat-fish", default_unit: "g", waste_half_life_days: 2, perishability_tier: "high" },
  { name: "minced beef", category: "meat-fish", default_unit: "g", waste_half_life_days: 2, perishability_tier: "high" },
  { name: "beef strips", category: "meat-fish", default_unit: "g", waste_half_life_days: 2, perishability_tier: "high" },
  { name: "salmon fillet", category: "meat-fish", default_unit: "g", waste_half_life_days: 2, perishability_tier: "high" },
  { name: "white fish fillet", category: "meat-fish", default_unit: "g", waste_half_life_days: 2, perishability_tier: "high" },
  { name: "tuna chunks", category: "tinned-dried", default_unit: "g", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "eggs", category: "dairy-eggs", default_unit: "each", waste_half_life_days: 18, perishability_tier: "medium" },
  { name: "semi-skimmed milk", category: "dairy-eggs", default_unit: "ml", waste_half_life_days: 6, perishability_tier: "high" },
  { name: "double cream", category: "dairy-eggs", default_unit: "ml", waste_half_life_days: 5, perishability_tier: "high" },
  { name: "natural yogurt", category: "dairy-eggs", default_unit: "g", waste_half_life_days: 8, perishability_tier: "medium" },
  { name: "cheddar cheese", category: "dairy-eggs", default_unit: "g", waste_half_life_days: 21, perishability_tier: "medium" },
  { name: "mozzarella", category: "dairy-eggs", default_unit: "g", waste_half_life_days: 8, perishability_tier: "medium" },
  { name: "feta", category: "dairy-eggs", default_unit: "g", waste_half_life_days: 10, perishability_tier: "medium" },
  { name: "butter", category: "dairy-eggs", default_unit: "g", waste_half_life_days: 30, perishability_tier: "low" },
  { name: "wholemeal bread", category: "bakery", default_unit: "each", waste_half_life_days: 6, perishability_tier: "medium" },
  { name: "white bread", category: "bakery", default_unit: "each", waste_half_life_days: 5, perishability_tier: "medium" },
  { name: "oats", category: "grains-pasta", default_unit: "g", waste_half_life_days: 180, perishability_tier: "low" },
  { name: "flour", category: "grains-pasta", default_unit: "g", waste_half_life_days: 180, perishability_tier: "low" },
  { name: "sugar", category: "condiments", default_unit: "g", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "salt", category: "condiments", default_unit: "g", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "black pepper", category: "condiments", default_unit: "g", waste_half_life_days: 365, perishability_tier: "low" },
  { name: "peanut butter", category: "condiments", default_unit: "g", waste_half_life_days: 90, perishability_tier: "low" },
  { name: "jam", category: "condiments", default_unit: "g", waste_half_life_days: 120, perishability_tier: "low" },
];

const additionalByCategory: Record<string, string[]> = {
  "fruit-veg": [
    "aubergine", "leek", "parsnip", "swede", "beetroot", "pak choi", "romaine lettuce",
    "rocket", "radish", "turnip", "cabbage", "savoy cabbage", "brussels sprouts", "butternut squash",
    "pumpkin", "green chilli", "red chilli", "banana", "apple", "pear", "orange",
  ],
  "dairy-eggs": [
    "greek yogurt", "cottage cheese", "cream cheese", "parmesan", "halloumi", "skyr",
  ],
  "meat-fish": [
    "turkey mince", "pork mince", "prawns", "smoked mackerel", "sausages", "bacon",
  ],
  "tinned-dried": [
    "cannellini beans", "butter beans", "haricot beans", "green lentils", "borlotti beans",
    "chopped tomatoes with herbs", "baked beans", "coconut cream",
  ],
  "grains-pasta": [
    "brown rice", "couscous", "quinoa", "bulgur wheat", "lasagne sheets", "tagliatelle", "macaroni",
  ],
  condiments: [
    "balsamic vinegar", "apple cider vinegar", "dijon mustard", "wholegrain mustard",
    "mayonnaise", "sriracha", "chilli flakes", "garam masala", "smoked paprika", "turmeric",
    "cinnamon", "honey",
  ],
  bakery: ["pitta bread", "bagels", "naans", "crumpets", "burger buns", "bread rolls"],
  frozen: ["frozen mixed vegetables", "frozen spinach", "frozen berries", "hash browns", "frozen chips"],
};

function inferUnit(name: string): CanonicalIngredientSeed["default_unit"] {
  if (name.includes("milk") || name.includes("stock") || name.includes("vinegar")) return "ml";
  if (name.includes("bread") || name.includes("wrap") || name.includes("bagels") || name.includes("buns")) return "each";
  return "g";
}

function inferHalfLife(category: string): number {
  if (category === "fruit-veg") return 6;
  if (category === "meat-fish") return 2;
  if (category === "dairy-eggs") return 8;
  if (category === "frozen") return 150;
  if (category === "tinned-dried" || category === "condiments" || category === "grains-pasta") return 180;
  return 12;
}

function inferPerishability(halfLife: number): CanonicalIngredientSeed["perishability_tier"] {
  if (halfLife <= 4) return "high";
  if (halfLife <= 14) return "medium";
  return "low";
}

const enriched = Object.entries(additionalByCategory).flatMap(([category, names]) =>
  names.map((name) => {
    const waste_half_life_days = inferHalfLife(category);
    return {
      name,
      category,
      default_unit: inferUnit(name),
      waste_half_life_days,
      perishability_tier: inferPerishability(waste_half_life_days),
    } as CanonicalIngredientSeed;
  }),
);

const combined = [...coreIngredients, ...enriched];
const deduped = Array.from(
  new Map(combined.map((ingredient) => [ingredient.name.toLowerCase(), ingredient])).values(),
);

// Task target: 120-150 ingredients. We pin to a deterministic 130 rows.
export const canonicalIngredientsSeed: CanonicalIngredientSeed[] = deduped.slice(0, 130);
