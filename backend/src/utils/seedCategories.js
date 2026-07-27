const Category = require("../models/Category");
const { DEFAULT_CATEGORIES } = require("../config/constants");

/**
 * Seed default categories into the database if none exist.
 */
const seedCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      console.log(`✅ Default categories seeded (${DEFAULT_CATEGORIES.length} categories)`);
    }
  } catch (err) {
    console.error("❌ Failed to seed categories:", err.message);
  }
};

module.exports = seedCategories;
