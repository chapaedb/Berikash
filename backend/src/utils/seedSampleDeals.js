require("dotenv").config();
const mongoose = require("mongoose");
const Store = require("../models/Store");
const Category = require("../models/Category");
const Product = require("../models/Product");

const sampleProducts = [
  {
    name: "Anchor Fresh Milk 1L",
    description: "Pasteurized fresh milk from Shoa Supermarket. Great for breakfast.",
    brand: "Anchor",
    originalPrice: 130,
    discountedPrice: 75,
    quantity: 20,
    unit: "liter",
    daysUntil: 2,
    categorySlug: "dairy",
  },
  {
    name: "Mama's Special Wheat Bread (700g)",
    description: "Freshly baked wheat bread near expiration date. Soft and nutritious.",
    brand: "Mama's Bakery",
    originalPrice: 65,
    discountedPrice: 35,
    quantity: 35,
    unit: "piece",
    daysUntil: 1,
    categorySlug: "bakery",
  },
  {
    name: "Prime Beef Mince 500g",
    description: "Premium grade Ethiopian beef mince. Freshly packaged.",
    brand: "Local Meats",
    originalPrice: 280,
    discountedPrice: 160,
    quantity: 12,
    unit: "pack",
    daysUntil: 2,
    categorySlug: "meat",
  },
  {
    name: "Organic Red Tomatoes 1kg",
    description: "Ripe red tomatoes from Rift Valley farms.",
    brand: "Farm Fresh",
    originalPrice: 70,
    discountedPrice: 40,
    quantity: 50,
    unit: "kg",
    daysUntil: 3,
    categorySlug: "produce",
  },
  {
    name: "Ambo Mineral Water 6 x 1L",
    description: "Sparkling natural mineral water 6-pack bundle.",
    brand: "Ambo",
    originalPrice: 180,
    discountedPrice: 110,
    quantity: 15,
    unit: "bundle",
    daysUntil: 10,
    categorySlug: "beverages",
  },
  {
    name: "Frozen Mixed Vegetables 1kg",
    description: "Carrots, peas, and sweetcorn frozen mix.",
    brand: "Green Harvest",
    originalPrice: 190,
    discountedPrice: 120,
    quantity: 18,
    unit: "pack",
    daysUntil: 14,
    categorySlug: "frozen-foods",
  },
  {
    name: "Habesha Biscuits Variety Pack 500g",
    description: "Crispy assorted tea biscuits.",
    brand: "Habesha",
    originalPrice: 95,
    discountedPrice: 55,
    quantity: 40,
    unit: "pack",
    daysUntil: 5,
    categorySlug: "snacks",
  },
  {
    name: "Greek Style Yogurt 500g",
    description: "Rich and creamy natural Greek yogurt.",
    brand: "Holland Dairy",
    originalPrice: 140,
    discountedPrice: 85,
    quantity: 14,
    unit: "piece",
    daysUntil: 3,
    categorySlug: "dairy",
  },
];

const seedDeals = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/berikash");
    console.log("Connected to MongoDB...");

    // Get a verified store
    let store = await Store.findOne({ "verification.status": "verified" });
    if (!store) {
      console.log("No verified store found, looking for any store...");
      store = await Store.findOne();
    }

    if (!store) {
      console.error("❌ No store found in database. Please register a store first.");
      process.exit(1);
    }

    console.log(`Seeding deals for store: ${store.name} (${store._id})`);

    // Get categories map
    const categories = await Category.find();
    const catMap = {};
    categories.forEach((c) => {
      catMap[c.slug] = c._id;
    });

    const docs = [];
    for (const p of sampleProducts) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + p.daysUntil);

      const catId = catMap[p.categorySlug] || categories[0]?._id;

      docs.push({
        store: store._id,
        name: p.name,
        description: p.description,
        brand: p.brand,
        originalPrice: p.originalPrice,
        discountedPrice: p.discountedPrice,
        discountPercentage: Math.round(((p.originalPrice - p.discountedPrice) / p.originalPrice) * 100),
        quantity: p.quantity,
        unit: p.unit,
        expiryDate: expiry,
        category: catId,
        status: "available",
        isActive: true,
      });
    }

    // Remove existing sample products to avoid clutter
    await Product.deleteMany({ store: store._id });
    const created = await Product.insertMany(docs);

    // Update store stats
    await Store.findByIdAndUpdate(store._id, {
      $set: { "stats.totalProducts": created.length },
    });

    console.log(`✅ Successfully seeded ${created.length} clearance deals for ${store.name}!`);
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedDeals();
