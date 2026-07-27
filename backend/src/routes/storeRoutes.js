const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const { protect, authorize } = require("../middleware/auth");
const { uploadFields } = require("../middleware/upload");
const asyncHandler = require("../utils/asyncHandler");

// Store file upload configuration
const storeUpload = uploadFields([
  { name: "logo", maxCount: 1 },
  { name: "images", maxCount: 10 },
  { name: "businessLicense", maxCount: 1 },
]);

// ─── IMPORTANT: Static routes MUST come before :id param routes ────────────────

// @route   GET /api/v1/stores
// @desc    Get all verified stores (with optional search/filter)
// @access  Public
router.get("/", asyncHandler(storeController.getStores));

// @route   GET /api/v1/stores/nearby
// @desc    Find stores near a location
// @access  Public
router.get("/nearby", asyncHandler(storeController.getNearbyStores));

// @route   GET /api/v1/stores/me/store
// @desc    Get current user's store
// @access  Store Owner
router.get(
  "/me/store",
  protect,
  authorize("store_owner", "admin"),
  asyncHandler(storeController.getMyStore)
);

// @route   GET /api/v1/stores/admin/pending
// @desc    Get all pending store verifications
// @access  Admin
router.get(
  "/admin/pending",
  protect,
  authorize("admin"),
  asyncHandler(storeController.getPendingStores)
);

// @route   POST /api/v1/stores
// @desc    Register a new store
// @access  Store Owner
router.post(
  "/",
  protect,
  authorize("store_owner", "admin"),
  storeUpload,
  asyncHandler(storeController.createStore)
);

// ─── Parameterized routes (MUST be after static routes) ────────────────────────

// @route   GET /api/v1/stores/:id
// @desc    Get single store by ID
// @access  Public
router.get("/:id", asyncHandler(storeController.getStore));

// @route   GET /api/v1/stores/:id/products
// @desc    Get a store's active products
// @access  Public
router.get("/:id/products", asyncHandler(storeController.getStoreProducts));

// @route   PUT /api/v1/stores/:id
// @desc    Update store
// @access  Store Owner (own store) or Admin
router.put(
  "/:id",
  protect,
  authorize("store_owner", "admin"),
  storeUpload,
  asyncHandler(storeController.updateStore)
);

// @route   DELETE /api/v1/stores/:id
// @desc    Deactivate store
// @access  Store Owner (own store) or Admin
router.delete(
  "/:id",
  protect,
  authorize("store_owner", "admin"),
  asyncHandler(storeController.deleteStore)
);

// @route   PUT /api/v1/stores/:id/verify
// @desc    Verify or reject a store
// @access  Admin
router.put(
  "/:id/verify",
  protect,
  authorize("admin"),
  asyncHandler(storeController.verifyStore)
);

module.exports = router;
