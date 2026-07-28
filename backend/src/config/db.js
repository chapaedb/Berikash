const mongoose = require("mongoose");

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/berikash";

  try {
    const conn = await mongoose.connect(primaryUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`⚠️ Primary MongoDB connection failed (${err.message}). Trying fallback addresses...`);

    // Fallback URIs for WSL / localhost / IPv6 environment differences
    const fallbackUris = [
      "mongodb://127.0.0.1:27017/berikash",
      "mongodb://localhost:27017/berikash",
    ];

    let connected = false;
    for (const uri of fallbackUris) {
      if (uri === primaryUri) continue;
      try {
        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB connected via fallback (${uri}): ${conn.connection.host}`);
        connected = true;
        break;
      } catch (_) {}
    }

    if (!connected) {
      console.error("❌ FATAL: Could not connect to MongoDB.");
      console.error("👉 Tip for WSL users: If running from WSL terminal, start MongoDB in WSL using `sudo service mongodb start` OR run `npm run dev` from Windows PowerShell.");
      process.exit(1);
    }
  }
};

module.exports = connectDB;
