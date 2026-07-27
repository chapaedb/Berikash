const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { protect, authorize } = require("../middleware/auth");
const { uploadMultiple, uploadSingle } = require("../middleware/upload");
const validate = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");
const { createProductSchema, updateProductSchema } = require("../utils/validators");

const productImagesUpload = uploadMultiple("images", 5);
const csvUpload = uploadSingle("file");

// ─── Public Routes ─────────────────────────────────────────────────────────────
router.get("/", asyncHandler(productController.getProducts));
router.get("/:id", asyncHandler(productController.getProduct));

// ─── Store Owner & Admin Routes ────────────────────────────────────────────────
router.post(
  "/",
  protect,
  authorize("store_owner", "admin"),
  productImagesUpload,
  validate(createProductSchema),
  asyncHandler(productController.createProduct)
);

router.post(
  "/bulk-upload",
  protect,
  authorize("store_owner", "admin"),
  csvUpload,
  asyncHandler(productController.bulkUploadProducts)
);

router.put(
  "/:id",
  protect,
  authorize("store_owner", "admin"),
  productImagesUpload,
  validate(updateProductSchema),
  asyncHandler(productController.updateProduct)
);

router.delete(
  "/:id",
  protect,
  authorize("store_owner", "admin"),
  asyncHandler(productController.deleteProduct)
);

module.exports = router;
