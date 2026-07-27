const Product = require("../models/Product");
const Store = require("../models/Store");
const Category = require("../models/Category");
const ApiError = require("../utils/ApiError");
const { getFileUrls } = require("../middleware/upload");
const { sendSuccess, sendCreated, sendPaginated } = require("../utils/helpers");
const { PAGINATION, PRODUCT_STATUSES } = require("../config/constants");
const csv = require("csv-parser");
const fs = require("fs");

// ─── Create Product ────────────────────────────────────────────────────────────

exports.createProduct = async (req, res) => {
  // Store owners can only post products for their own store
  let storeId = req.body.store;

  if (req.user.role === "store_owner") {
    const store = await Store.findOne({ owner: req.user.id });
    if (!store) {
      throw ApiError.forbidden("You must register and verify a store before creating products");
    }
    if (store.verification.status !== "verified") {
      throw ApiError.forbidden("Your store is pending verification. You cannot post products yet.");
    }
    storeId = store._id;
  } else if (!storeId) {
    throw ApiError.badRequest("Store ID is required");
  }

  const { originalPrice, discountedPrice } = req.body;
  if (parseFloat(discountedPrice) >= parseFloat(originalPrice)) {
    throw ApiError.badRequest("Discounted price must be strictly less than original price");
  }

  const productData = {
    ...req.body,
    store: storeId,
    discountPercentage: Math.round(
      ((originalPrice - discountedPrice) / originalPrice) * 100
    ),
  };

  // Handle uploaded images
  if (req.files && req.files.length > 0) {
    productData.images = getFileUrls(req.files);
  }

  const product = await Product.create(productData);

  // Increment store product count
  await Store.findByIdAndUpdate(storeId, { $inc: { "stats.totalProducts": 1 } });

  sendCreated(res, product, "Product posted successfully");
};

// ─── Get Products (Paginated) ──────────────────────────────────────────────────

exports.getProducts = async (req, res) => {
  const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const filter = {
    status: PRODUCT_STATUSES.AVAILABLE,
    expiryDate: { $gt: new Date() },
  };

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.store) {
    filter.store = req.query.store;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("store", "name logo address location type rating")
      .populate("category", "name nameAmharic icon slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  sendPaginated(res, products, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
};

// ─── Get Single Product ────────────────────────────────────────────────────────

exports.getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("store", "name logo address location contact operatingHours rating")
    .populate("category", "name nameAmharic icon slug");

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  // Increment view count
  product.views = (product.views || 0) + 1;
  await product.save({ validateBeforeSave: false });

  sendSuccess(res, product);
};

// ─── Update Product ────────────────────────────────────────────────────────────

exports.updateProduct = async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  // Check store ownership if user is store_owner
  if (req.user.role === "store_owner") {
    const store = await Store.findOne({ owner: req.user.id });
    if (!store || product.store.toString() !== store._id.toString()) {
      throw ApiError.forbidden("You do not have permission to update this product");
    }
  }

  // Handle price changes
  const origPrice = req.body.originalPrice || product.originalPrice;
  const discPrice = req.body.discountedPrice || product.discountedPrice;
  if (discPrice >= origPrice) {
    throw ApiError.badRequest("Discounted price must be less than original price");
  }

  req.body.discountPercentage = Math.round(
    ((origPrice - discPrice) / origPrice) * 100
  );

  // Handle added images
  if (req.files && req.files.length > 0) {
    req.body.images = [...product.images, ...getFileUrls(req.files)].slice(0, 5);
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, product, "Product updated successfully");
};

// ─── Delete Product (Soft Delete) ──────────────────────────────────────────────

exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  if (req.user.role === "store_owner") {
    const store = await Store.findOne({ owner: req.user.id });
    if (!store || product.store.toString() !== store._id.toString()) {
      throw ApiError.forbidden("You do not have permission to delete this product");
    }
  }

  product.status = PRODUCT_STATUSES.REMOVED;
  product.isActive = false;
  await product.save({ validateBeforeSave: false });

  sendSuccess(res, null, "Product removed successfully");
};

// ─── Bulk Upload Products (CSV) ────────────────────────────────────────────────

exports.bulkUploadProducts = async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("Please upload a CSV file");
  }

  const store = await Store.findOne({ owner: req.user.id });
  if (!store) {
    throw ApiError.forbidden("You must have a verified store to bulk upload products");
  }

  const results = [];
  const errors = [];
  let rowNumber = 1;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => {
      rowNumber++;
      // Validate row
      const { name, originalPrice, discountedPrice, quantity, expiryDate, category } = data;
      if (!name || !originalPrice || !discountedPrice || !quantity || !expiryDate) {
        errors.push(`Row ${rowNumber}: Missing required fields`);
        return;
      }

      const orig = parseFloat(originalPrice);
      const disc = parseFloat(discountedPrice);

      if (disc >= orig) {
        errors.push(`Row ${rowNumber}: Discounted price (${disc}) must be less than original (${orig})`);
        return;
      }

      results.push({
        store: store._id,
        name: name.trim(),
        description: data.description ? data.description.trim() : "",
        brand: data.brand ? data.brand.trim() : "",
        originalPrice: orig,
        discountedPrice: disc,
        discountPercentage: Math.round(((orig - disc) / orig) * 100),
        quantity: parseInt(quantity, 10),
        unit: data.unit || "piece",
        expiryDate: new Date(expiryDate),
        barcode: data.barcode || "",
        status: PRODUCT_STATUSES.AVAILABLE,
      });
    })
    .on("end", async () => {
      // Clean up uploaded temp CSV file
      fs.unlinkSync(req.file.path);

      if (results.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid product rows found in CSV file",
          errors,
        });
      }

      const created = await Product.insertMany(results);
      await Store.findByIdAndUpdate(store._id, {
        $inc: { "stats.totalProducts": created.length },
      });

      sendCreated(res, {
        importedCount: created.length,
        failedCount: errors.length,
        errors,
      }, `Successfully imported ${created.length} products`);
    });
};
