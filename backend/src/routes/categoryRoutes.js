const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { protect, authorize } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

// ─── Public Routes ─────────────────────────────────────────────────────────────
router.get("/", asyncHandler(categoryController.getCategories));
router.get("/:identifier", asyncHandler(categoryController.getCategory));

// ─── Admin Routes ──────────────────────────────────────────────────────────────
router.post(
  "/",
  protect,
  authorize("admin"),
  asyncHandler(categoryController.createCategory)
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(categoryController.updateCategory)
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(categoryController.deleteCategory)
);

module.exports = router;
