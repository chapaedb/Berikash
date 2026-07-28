require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const promoteAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/berikash");
    console.log("Connected to MongoDB...");

    // Update all current users or find Chapa E. Denbel and make admin
    const result = await User.updateMany({}, { $set: { role: "admin" } });
    console.log(`✅ Promoted ${result.modifiedCount} user(s) to 'admin' role!`);

    const users = await User.find().select("name email role");
    console.log("Current Users:", users);
  } catch (err) {
    console.error("Error promoting admin:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

promoteAdmin();
