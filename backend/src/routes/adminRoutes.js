const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

// All admin routes require authentication and admin role
router.use(protect, authorize("admin"));

// @route   GET /api/v1/admin/stats
// @desc    Get platform stats
router.get("/stats", asyncHandler(adminController.getPlatformStats));

// @route   GET /api/v1/admin/users
// @desc    Get paginated users list
router.get("/users", asyncHandler(adminController.getUsers));

// @route   PUT /api/v1/admin/users/:id/status
// @desc    Toggle user status (activate/suspend)
router.put("/users/:id/status", asyncHandler(adminController.toggleUserStatus));

module.exports = router;
