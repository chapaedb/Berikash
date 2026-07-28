require("dotenv").config();
const mongoose = require("mongoose");
const Store = require("../models/Store");
const Category = require("../models/Category");
const Product = require("../models/Product");
const User = require("../models/User");

const sampleStores = [
  {
    name: "Shoa Supermarket (Bole Branch)",
    description: "Premier supermarket chain branch located in Bole, Addis Ababa.",
    type: "large_supermarket",
    subcity: "Bole",
    woreda: "03",
    coordinates: [38.7885, 8.9892], // [lng, lat]
    phone: "+251911223344",
  },
  {
    name: "Bambis Supermarket (Kazanchis)",
    description: "Well-stocked grocery and deli in central Kirkos subcity.",
    type: "medium_chain",
    subcity: "Kirkos",
    woreda: "08",
    coordinates: [38.7612, 9.0105],
    phone: "+251911334455",
  },
  {
    name: "Fantu Supermarket (Megenagna)",
    description: "Fresh bakery and grocery retailer in Yeka subcity.",
    type: "large_supermarket",
    subcity: "Yeka",
    woreda: "05",
    coordinates: [38.8055, 9.0284],
    phone: "+251911445566",
  },
  {
    name: "Allmart Supermarket (Sarbet)",
    description: "Quality supermarket offering fresh produce in Nifas Silk.",
    type: "large_retailer",
    subcity: "Nifas Silk-Lafto",
    woreda: "02",
    coordinates: [38.7285, 8.9712],
    phone: "+251911556677",
  },
  {
    name: "Novis Supermarket (Piassa)",
    description: "Historic branch offering gourmet items and bakery in Arada.",
    type: "small_supermarket",
    subcity: "Arada",
    woreda: "01",
    coordinates: [38.7523, 9.0345],
    phone: "+251911667788",
  },
  {
    name: "Safeway Supermarket (CMC)",
    description: "Spacious supermarket serving eastern Addis Ababa in Lemi Kura.",
    type: "large_supermarket",
    subcity: "Lemi Kura",
    woreda: "04",
    coordinates: [38.8355, 9.0125],
    phone: "+251911778899",
  },
];

const sampleProducts = [
  { name: "Anchor Fresh Milk 1L", brand: "Anchor", orig: 130, disc: 75, qty: 20, unit: "liter", days: 2, catSlug: "dairy", imgs: ["/uploads/images/milk.png"] },
  { name: "Mama's Special Wheat Bread 700g", brand: "Mama's", orig: 65, disc: 35, qty: 30, unit: "piece", days: 1, catSlug: "bakery", imgs: ["/uploads/images/bread.png"] },
  { name: "Prime Beef Mince 500g", brand: "Local Meats", orig: 280, disc: 160, qty: 15, unit: "pack", days: 2, catSlug: "meat", imgs: ["/uploads/images/tomatoes.png"] },
  { name: "Organic Red Tomatoes 1kg", brand: "Farm Fresh", orig: 70, disc: 40, qty: 40, unit: "kg", days: 3, catSlug: "produce", imgs: ["/uploads/images/tomatoes.png"] },
  { name: "Ambo Mineral Water 6x1L", brand: "Ambo", orig: 180, disc: 110, qty: 25, unit: "bundle", days: 9, catSlug: "beverages", imgs: ["/uploads/images/water.png"] },
  { name: "Frozen Mixed Vegetables 1kg", brand: "Green Harvest", orig: 190, disc: 120, qty: 18, unit: "pack", days: 14, catSlug: "frozen-foods", imgs: ["/uploads/images/tomatoes.png"] },
  { name: "Habesha Biscuits Variety Pack", brand: "Habesha", orig: 95, disc: 55, qty: 35, unit: "pack", days: 4, catSlug: "snacks", imgs: ["/uploads/images/bread.png"] },
  { name: "Holland Dairy Greek Yogurt 500g", brand: "Holland Dairy", orig: 140, disc: 85, qty: 12, unit: "piece", days: 2, catSlug: "dairy", imgs: ["/uploads/images/milk.png"] },
];

const seedStoresAndDeals = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/berikash");
    console.log("Connected to MongoDB...");

    // Find owner user
    let owner = await User.findOne({ role: "store_owner" });
    if (!owner) {
      owner = await User.findOne();
    }

    const categories = await Category.find();
    const catMap = {};
    categories.forEach((c) => (catMap[c.slug] = c._id));

    // Clear existing sample stores and products to prevent duplicates
    console.log("Seeding multi-subcity partner stores across Addis Ababa...");

    const createdStores = [];
    for (const storeData of sampleStores) {
      let store = await Store.findOne({ name: storeData.name });
      if (!store) {
        store = await Store.create({
          owner: owner._id,
          name: storeData.name,
          description: storeData.description,
          type: storeData.type,
          contact: { phone: storeData.phone, email: "store@berikash.com" },
          address: { city: "Addis Ababa", subcity: storeData.subcity, woreda: storeData.woreda },
          location: {
            type: "Point",
            coordinates: storeData.coordinates,
          },
          verification: {
            status: "verified",
            verifiedAt: new Date(),
          },
          isActive: true,
        });
      } else {
        // Ensure verified and has updated location
        store.verification.status = "verified";
        store.location = { type: "Point", coordinates: storeData.coordinates };
        await store.save();
      }
      createdStores.push(store);
    }

    console.log(`✅ ${createdStores.length} stores active across Bole, Kirkos, Yeka, Nifas Silk, Arada, and Lemi Kura!`);

    // Attach clearance products to each store
    await Product.deleteMany({}); // refresh product list

    const productDocs = [];
    for (const store of createdStores) {
      for (const p of sampleProducts) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + p.days);
        const catId = catMap[p.catSlug] || categories[0]?._id;

        productDocs.push({
          store: store._id,
          name: `${p.name} (${store.address.subcity})`,
          brand: p.brand,
          originalPrice: p.orig,
          discountedPrice: p.disc,
          discountPercentage: Math.round(((p.orig - p.disc) / p.orig) * 100),
          quantity: p.qty,
          unit: p.unit,
          expiryDate: expiry,
          category: catId,
          images: p.imgs || [],
          status: "available",
          isActive: true,
        });
      }
    }

    const createdProducts = await Product.insertMany(productDocs);
    console.log(`✅ Successfully seeded ${createdProducts.length} clearance deals across all store locations!`);
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedStoresAndDeals();
