const { getBot } = require("../services/telegramBot");
const User = require("../models/User");

/**
 * Send deal notification to users subscribed to the product's category on Telegram.
 * @param {Object} product - Newly created product document
 * @param {Object} store - Store document
 */
const notifySubscribedUsers = async (product, store) => {
  const bot = getBot();
  if (!bot) return; // Bot not initialized

  try {
    // Find users who have telegram enabled and are subscribed to this category
    const users = await User.find({
      telegramChatId: { $exists: true, $ne: "" },
      "notificationPreferences.telegram": true,
      $or: [
        { subscribedCategories: product.category },
        { subscribedCategories: { $size: 0 } }, // Or subscribed to all
      ],
    });

    if (users.length === 0) return;

    const message =
      `🚨 **NEW CLEARANCE DEAL!**\n\n` +
      `🏬 **${store.name}** (${store.address?.subcity || "Addis Ababa"})\n` +
      `📦 **${product.name}**\n` +
      `💰 Original: ~${product.originalPrice} ETB~ ➡️ **${product.discountedPrice} ETB** (-${product.discountPercentage}% OFF)\n` +
      `⏳ Quantity: ${product.quantity} ${product.unit}(s)\n\n` +
      `👉 View on web: http://localhost:5173`;

    for (const user of users) {
      try {
        await bot.telegram.sendMessage(user.telegramChatId, message, {
          parse_mode: "Markdown",
        });
      } catch (err) {
        console.error(`Failed to send Telegram message to ${user.telegramChatId}:`, err.message);
      }
    }
  } catch (err) {
    console.error("Telegram notification error:", err.message);
  }
};

module.exports = notifySubscribedUsers;
