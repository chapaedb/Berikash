const Category = require("../models/Category");
const ApiError = require("../utils/ApiError");
const { sendSuccess, sendCreated } = require("../utils/helpers");

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
  sendSuccess(res, categories);
};

// @desc    Get single category by slug or ID
// @route   GET /api/v1/categories/:identifier
// @access  Public
exports.getCategory = async (req, res) => {
  const { identifier } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

  const category = isObjectId
    ? await Category.findById(identifier)
    : await Category.findOne({ slug: identifier });

  if (!category) {
    throw ApiError.notFound("Category not found");
  }

  sendSuccess(res, category);
};

// @desc    Create a category
// @route   POST /api/v1/categories
// @access  Admin
exports.createCategory = async (req, res) => {
  const { name, nameAmharic, icon, slug, order } = req.body;

  const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const existing = await Category.findOne({
    $or: [{ name }, { slug: generatedSlug }],
  });

  if (existing) {
    throw ApiError.conflict("Category with this name or slug already exists");
  }

  const category = await Category.create({
    name,
    nameAmharic,
    icon: icon || "📦",
    slug: generatedSlug,
    order: order || 0,
  });

  sendCreated(res, category, "Category created successfully");
};

// @desc    Update a category
// @route   PUT /api/v1/categories/:id
// @access  Admin
exports.updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    throw ApiError.notFound("Category not found");
  }

  sendSuccess(res, category, "Category updated successfully");
};

// @desc    Delete (deactivate) a category
// @route   DELETE /api/v1/categories/:id
// @access  Admin
exports.deleteCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!category) {
    throw ApiError.notFound("Category not found");
  }

  sendSuccess(res, null, "Category deactivated successfully");
};
