 const productStandards = {
    energyKcal: {
      unit: "kcal",
      maxPerDay: 2000,
      alertIfAbovePer100: 600,
    },
    protein: {
      unit: "g",
      rdaPerDay: 50,
    },
    carbohydrates: {
      unit: "g",
      rdaPerDay: 275,
    },
    totalSugar: {
      unit: "g",
      rdaPerDay: 50,
      alertIfAbovePer100: 10,
    },
    addedSugar: {
      unit: "g",
      maxPerDay: 25,
      flagIfPresent: true,
    },
    totalFat: {
      unit: "g",
      rdaPerDay: 70,
    },
    saturatedFat: {
      unit: "g",
      rdaPerDay: 20,
      alertIfAbovePer100: 5,
    },
    transFat: {
      unit: "g",
      maxPerDay: 2,
      flagIfPresent: true,
    },
    cholesterol: {
      unit: "mg",
      maxPerDay: 300,
    },
    sodium: {
      unit: "mg",
      maxPerDay: 2000,
      alertIfAbovePer100: 500,
    },
    dietaryFiber: {
      unit: "g",
      rdaPerDay: 25,
    },
    caffeine: {
      unit: "mg",
      maxPerDay: 400,
      warnAboveSingleIntake: 60,
    },
    allergens: [
      "nuts",
      "milk",
      "gluten",
      "soy",
      "eggs",
      "fish",
      "peanuts",
      "shellfish",
      "sesame",
      "mustard",
      "celery",
      "lupin",
      "sulfites",
      "beetroot extract",
      "corn syrup",
    ],
    ingredientsToFlag: [
      "caffeine",
      "palm oil",
      "added sugar",
      "artificial sweetener",
      "aspartame",
      "acesulfame potassium",
      "color 102", // Tartrazine
      "color 110", // Sunset Yellow
      "color 122", // Azorubine
      "preservative",
      "sodium benzoate",
      "potassium sorbate",
      "BHA",
      "BHT",
      "msg",
      "monosodium glutamate",
      "trans fat",
      "aluminium salt",
    ],
    dangerousIngredients: [
      {
        name: "Ethylene Oxide",
        risk: "Carcinogenic",
        foundIn: ["MDH Masala", "Everest Masala (EU alerts)"],
        flaggedBy: ["EU", "FDA"],
      },
      {
        name: "Lead",
        risk: "Neurotoxic, harmful to children",
        foundIn: ["Maggi (2015 recall)"],
        flaggedBy: ["FSSAI", "WHO"],
      },
      {
        name: "Brominated Vegetable Oil (BVO)",
        risk: "Banned in Europe, linked to thyroid issues",
        foundIn: ["Mountain Dew (old formula)"],
        flaggedBy: ["EU", "India under review"],
      },
      {
        name: "Titanium Dioxide (E171)",
        risk: "May cause DNA damage",
        foundIn: ["Chewing gums, candies"],
        flaggedBy: ["France", "California"],
      },
      {
        name: "Butylated Hydroxyanisole (BHA)",
        risk: "Possible human carcinogen",
        foundIn: ["Packaged chips, instant noodles"],
        flaggedBy: ["IARC", "California Prop 65"],
      },
      {
        name: "Potassium Bromate",
        risk: "Possible cancer risk",
        foundIn: ["Bread, baked goods"],
        flaggedBy: ["FSSAI (banned)", "WHO"],
      },
    ],
  };
userpref={
  sugar:10,
  carbohydrates:200

}
  
module.exports = productStandards;
module.exports = userpref;
  
  