const express = require("express");
const router = express.Router();
const productRoutes = require("./productRoutes");
const authRoutes = require("./authRoutes");
const storeRoutes = require("./storeRoutes");
const categoryRoutes = require("./categoryRoutes");
const searchRoutes = require("./searchRoutes");
const adminRoutes = require("./adminRoutes");

/**
 * Route aggregator — mounts all route modules under versioned paths.
 * New route modules should be added here as they are created.
 */

// ─── Auth Routes ───────────────────────────────────────────────────────────────
router.use("/auth", authRoutes);

// ─── Store Routes ──────────────────────────────────────────────────────────────
router.use("/stores", storeRoutes);

// ─── Category Routes ───────────────────────────────────────────────────────────
router.use("/categories", categoryRoutes);

// ─── Product Routes ────────────────────────────────────────────────────────────
router.use("/products", productRoutes);

// ─── Search Routes ─────────────────────────────────────────────────────────────
router.use("/search", searchRoutes);

// ─── Admin Routes ──────────────────────────────────────────────────────────────
router.use("/admin", adminRoutes);

module.exports = router;
