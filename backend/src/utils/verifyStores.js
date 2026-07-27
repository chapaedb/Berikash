require("dotenv").config();
const mongoose = require("mongoose");
const Store = require("../models/Store");
const { VERIFICATION_STATUSES } = require("../config/constants");

const verifyAllPendingStores = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/berikash");
    console.log("Connected to MongoDB...");

    const result = await Store.updateMany(
      { "verification.status": VERIFICATION_STATUSES.PENDING },
      {
        $set: {
          "verification.status": VERIFICATION_STATUSES.VERIFIED,
          "verification.verifiedAt": new Date(),
        },
      }
    );

    console.log(`✅ Successfully verified ${result.modifiedCount} store(s)!`);
  } catch (err) {
    console.error("❌ Verification error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

verifyAllPendingStores();
