const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require("../utils/validators");

// ─── Public Routes ─────────────────────────────────────────────────────────────

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register)
);

// @route   POST /api/v1/auth/login
// @desc    Login user & return JWT
// @access  Public
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(authController.login)
);

// ─── Protected Routes ──────────────────────────────────────────────────────────

// @route   GET /api/v1/auth/me
// @desc    Get current logged-in user profile
// @access  Private
router.get("/me", protect, asyncHandler(authController.getMe));

// @route   PUT /api/v1/auth/me
// @desc    Update user profile
// @access  Private
router.put(
  "/me",
  protect,
  validate(updateProfileSchema),
  asyncHandler(authController.updateProfile)
);

// @route   PUT /api/v1/auth/change-password
// @desc    Change password
// @access  Private
router.put(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

// ─── Favorites ─────────────────────────────────────────────────────────────────

// @route   PUT /api/v1/auth/favorites/products/:id
// @desc    Toggle favorite product
// @access  Private
router.put(
  "/favorites/products/:id",
  protect,
  asyncHandler(authController.toggleFavoriteProduct)
);

// @route   PUT /api/v1/auth/favorites/stores/:id
// @desc    Toggle favorite store
// @access  Private
router.put(
  "/favorites/stores/:id",
  protect,
  asyncHandler(authController.toggleFavoriteStore)
);

module.exports = router;
