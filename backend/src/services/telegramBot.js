const { Telegraf, Markup } = require("telegraf");
const Product = require("../models/Product");
const Store = require("../models/Store");
const Category = require("../models/Category");
const User = require("../models/User");

let bot = null;

/**
 * Initialize Telegram Bot for Berikash
 */
const initTelegramBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || token.trim() === "" || token === "your_telegram_bot_token_here") {
    console.log("ℹ️  Telegram Bot Token not configured in .env (Skipping bot initialization)");
    return null;
  }

  try {
    bot = new Telegraf(token);

    // ─── /start Command ────────────────────────────────────────────────────────
    bot.start((ctx) => {
      const name = ctx.from.first_name || "Shopper";
      ctx.reply(
        `👋 Welcome to **Berikash Bot**, ${name}!\n\n` +
          `Save money and reduce food waste in Addis Ababa by discovering daily clearance deals from local supermarkets.\n\n` +
          `Choose an option below:`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback("🔥 Top Clearance Deals", "cmd_deals"),
            Markup.button.callback("📦 Categories", "cmd_categories"),
          ],
          [
            Markup.button.callback("📍 Nearby Deals", "cmd_nearme"),
            Markup.button.callback("🔔 My Alerts", "cmd_alerts"),
          ],
        ])
      );
    });

    // ─── /deals Command ────────────────────────────────────────────────────────
    const sendDealsList = async (ctx) => {
      try {
        const deals = await Product.find({
          status: "available",
          expiryDate: { $gt: new Date() },
        })
          .populate("store", "name address location")
          .sort({ discountPercentage: -1 })
          .limit(5);

        if (deals.length === 0) {
          return ctx.reply("🛒 No active clearance deals available right now. Check back soon!");
        }

        let message = "🔥 **Top Clearance Deals in Addis Ababa:**\n\n";
        deals.forEach((d, idx) => {
          const storeName = d.store?.name || "Supermarket";
          const subcity = d.store?.address?.subcity ? `(${d.store.address.subcity})` : "";
          const daysLeft = d.daysUntilExpiry === 0 ? "Expires Today!" : `${d.daysUntilExpiry} days left`;

          message +=
            `${idx + 1}. **${d.name}**\n` +
            `   💰 ~${d.originalPrice} ETB~ ➡️ **${d.discountedPrice} ETB** (-${d.discountPercentage}%)\n` +
            `   🏬 ${storeName} ${subcity}\n` +
            `   ⏳ ${daysLeft}\n\n`;
        });

        message += "👉 Visit http://localhost:5173 to browse all items.";
        ctx.replyWithMarkdown(message);
      } catch (err) {
        console.error("Bot deals error:", err.message);
        ctx.reply("❌ Unable to fetch deals. Please try again later.");
      }
    };

    bot.command("deals", sendDealsList);
    bot.action("cmd_deals", (ctx) => {
      ctx.answerCbQuery();
      sendDealsList(ctx);
    });

    // ─── /categories Command ───────────────────────────────────────────────────
    const sendCategoriesKeyboard = async (ctx) => {
      try {
        const categories = await Category.find({ isActive: true }).sort({ order: 1 });
        const buttons = categories.map((c) => [
          Markup.button.callback(`${c.icon} ${c.name}`, `cat_${c._id}`),
        ]);

        ctx.reply(
          "📦 Select a category to see discounted items:",
          Markup.inlineKeyboard(buttons)
        );
      } catch (err) {
        console.error("Bot categories error:", err.message);
      }
    };

    bot.command("categories", sendCategoriesKeyboard);
    bot.action("cmd_categories", (ctx) => {
      ctx.answerCbQuery();
      sendCategoriesKeyboard(ctx);
    });

    // ─── Category Selection Callback ───────────────────────────────────────────
    bot.action(/^cat_(.+)$/, async (ctx) => {
      ctx.answerCbQuery();
      const catId = ctx.match[1];
      try {
        const [cat, deals] = await Promise.all([
          Category.findById(catId),
          Product.find({
            category: catId,
            status: "available",
            expiryDate: { $gt: new Date() },
          })
            .populate("store", "name address")
            .limit(5),
        ]);

        if (!deals || deals.length === 0) {
          return ctx.reply(`📦 No active deals found in ${cat?.name || "this category"}.`);
        }

        let message = `📦 **${cat?.icon || ""} ${cat?.name} Deals:**\n\n`;
        deals.forEach((d, idx) => {
          message +=
            `${idx + 1}. **${d.name}** — **${d.discountedPrice} ETB** (-${d.discountPercentage}%)\n` +
            `   🏬 ${d.store?.name || "Store"}\n\n`;
        });

        ctx.replyWithMarkdown(message);
      } catch (err) {
        console.error("Category callback error:", err.message);
      }
    });

    // ─── Location Sharing for Nearby Deals ─────────────────────────────────────
    bot.action("cmd_nearme", (ctx) => {
      ctx.answerCbQuery();
      ctx.reply(
        "📍 Please share your location to find clearance deals near you:",
        Markup.keyboard([
          [Markup.button.locationRequest("📍 Share My Current Location")],
        ])
          .oneTime()
          .resize()
      );
    });

    bot.on("location", async (ctx) => {
      const { latitude, longitude } = ctx.message.location;

      try {
        const stores = await Store.find({
          isActive: true,
          "verification.status": "verified",
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [longitude, latitude],
              },
              $maxDistance: 10000, // 10km radius
            },
          },
        }).select("_id name address");

        const storeIds = stores.map((s) => s._id);

        const deals = await Product.find({
          store: { $in: storeIds },
          status: "available",
          expiryDate: { $gt: new Date() },
        })
          .populate("store", "name address")
          .limit(5);

        if (deals.length === 0) {
          return ctx.reply("📍 No clearance deals found within 10km of your location.");
        }

        let message = "📍 **Deals Near You:**\n\n";
        deals.forEach((d, idx) => {
          message +=
            `${idx + 1}. **${d.name}** — **${d.discountedPrice} ETB** (-${d.discountPercentage}%)\n` +
            `   🏬 ${d.store?.name} (${d.store?.address?.subcity || "Addis Ababa"})\n\n`;
        });

        ctx.replyWithMarkdown(message, Markup.removeKeyboard());
      } catch (err) {
        console.error("Location query error:", err.message);
        ctx.reply("❌ Failed to query nearby deals.", Markup.removeKeyboard());
      }
    });

    // Launch Bot in non-blocking background
    bot.launch().then(() => {
      console.log("🤖 Telegram Bot connected successfully!");
    }).catch((err) => {
      if (err.message && err.message.includes("409")) {
        console.log("🤖 Telegram Bot already running in another process (409 Conflict — OK)");
      } else {
        console.error("❌ Telegram Bot launch error:", err.message);
      }
    });

    // Graceful shutdown listeners
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));

    return bot;
  } catch (err) {
    console.error("❌ Telegram Bot initialization error:", err.message);
    return null;
  }
};

/**
 * Get active bot instance
 */
const getBot = () => bot;

module.exports = {
  initTelegramBot,
  getBot,
};
