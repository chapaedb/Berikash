const cron = require("node-cron");
const Product = require("../models/Product");
const { PRODUCT_STATUSES } = require("../config/constants");

/**
 * Initialize background cron jobs for Berikash.
 */
const initCronJobs = () => {
  // Run every hour to check for expired products
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const result = await Product.updateMany(
        {
          expiryDate: { $lte: now },
          status: PRODUCT_STATUSES.AVAILABLE,
        },
        {
          $set: {
            status: PRODUCT_STATUSES.EXPIRED,
            isActive: false,
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`⏰ Cron: Auto-expired ${result.modifiedCount} product(s)`);
      }
    } catch (err) {
      console.error("❌ Cron Error (auto-expiry):", err.message);
    }
  });

  console.log("⏰ Background cron jobs initialized (Hourly product expiry check)");
};

module.exports = initCronJobs;
