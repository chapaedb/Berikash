const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");
const validate = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");
const { searchQuerySchema } = require("../utils/validators");

// ─── Public Routes ─────────────────────────────────────────────────────────────

// @route   GET /api/v1/search
// @desc    Search and filter products
// @access  Public
router.get(
  "/",
  validate(searchQuerySchema, "query"),
  asyncHandler(searchController.searchProducts)
);

// @route   GET /api/v1/search/trending
// @desc    Get trending high-discount deals
// @access  Public
router.get("/trending", asyncHandler(searchController.getTrendingDeals));

// @route   GET /api/v1/search/nearby
// @desc    Get nearby deals based on lat/lng coordinates
// @access  Public
router.get("/nearby", asyncHandler(searchController.getNearbyDeals));

module.exports = router;
