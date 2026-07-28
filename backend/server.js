require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./src/config/db");
const validateEnv = require("./src/config/env");
const errorHandler = require("./src/middleware/errorHandler");
const { apiLimiter } = require("./src/middleware/rateLimiter");
const routes = require("./src/routes");

// ─── Validate Environment ──────────────────────────────────────────────────────
validateEnv();

// ─── Initialize Express ────────────────────────────────────────────────────────
const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// ─── Request Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
app.use("/api/", apiLimiter);

// ─── Static Files (for local image uploads) ────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── API Routes ────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Berikash API is running",
    version: "1.0.0",
    docs: "/api/v1",
  });
});

app.use("/api/v1", routes);

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

const seedCategories = require("./src/utils/seedCategories");
const initCronJobs = require("./src/services/cronService");
const { initTelegramBot } = require("./src/services/telegramBot");

// ─── Connect Database & Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedCategories();
  initCronJobs();
  initTelegramBot();

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║           🟢 Berikash API Server             ║
║──────────────────────────────────────────────║
║  Port:        ${String(PORT).padEnd(30)}║
║  Environment: ${String(process.env.NODE_ENV || "development").padEnd(30)}║
║  API Base:    /api/v1${" ".repeat(23)}║
╚══════════════════════════════════════════════╝
    `);
  });
};

startServer();
