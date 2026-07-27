const User = require("../models/User");
const Store = require("../models/Store");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const { sendSuccess, sendPaginated } = require("../utils/helpers");
const { PAGINATION, VERIFICATION_STATUSES, PRODUCT_STATUSES } = require("../config/constants");

// @desc    Get high-level platform statistics
// @route   GET /api/v1/admin/stats
// @access  Admin
exports.getPlatformStats = async (req, res) => {
  const [
    totalUsers,
    totalStores,
    pendingStores,
    totalProducts,
    activeProducts,
    expiredProducts,
  ] = await Promise.all([
    User.countDocuments(),
    Store.countDocuments({ "verification.status": VERIFICATION_STATUSES.VERIFIED }),
    Store.countDocuments({ "verification.status": VERIFICATION_STATUSES.PENDING }),
    Product.countDocuments(),
    Product.countDocuments({ status: PRODUCT_STATUSES.AVAILABLE }),
    Product.countDocuments({ status: PRODUCT_STATUSES.EXPIRED }),
  ]);

  sendSuccess(res, {
    users: { total: totalUsers },
    stores: { verified: totalStores, pending: pendingStores },
    products: {
      total: totalProducts,
      active: activeProducts,
      expired: expiredProducts,
    },
  });
};

// @desc    Get paginated users list
// @route   GET /api/v1/admin/users
// @access  Admin
exports.getUsers = async (req, res) => {
  const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) {
    filter.$or = [
      { name: new RegExp(req.query.q, "i") },
      { email: new RegExp(req.query.q, "i") },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  sendPaginated(res, users, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
};

// @desc    Toggle user active/suspended status
// @route   PUT /api/v1/admin/users/:id/status
// @access  Admin
exports.toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (user._id.toString() === req.user.id) {
    throw ApiError.badRequest("You cannot deactivate your own admin account");
  }

  user.isActive = !user.isActive;
  await user.save();

  sendSuccess(
    res,
    { id: user._id, isActive: user.isActive },
    `User account ${user.isActive ? "activated" : "suspended"} successfully`
  );
};
