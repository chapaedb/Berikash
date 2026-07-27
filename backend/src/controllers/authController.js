const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

/**
 * Generate JWT token for a user.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

/**
 * Send token response with user data.
 */
const sendTokenResponse = (res, user, statusCode = 200, message = "Success") => {
  const token = generateToken(user._id);

  // Remove password from output
  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: userObj,
      token,
    },
  });
};

// ─── Register ──────────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict("An account with this email already exists");
  }

  // Only allow customer and store_owner roles via registration
  // Admin accounts must be created manually or by another admin
  const allowedRoles = ["customer", "store_owner"];
  const userRole = allowedRoles.includes(role) ? role : "customer";

  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
    phone,
  });

  sendTokenResponse(res, user, 201, "Account created successfully");
};

// ─── Login ─────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Get user with password field (excluded by default)
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("Your account has been deactivated");
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  sendTokenResponse(res, user, 200, "Login successful");
};

// ─── Get Current User Profile ──────────────────────────────────────────────────

exports.getMe = async (req, res) => {
  const mongoose = require("mongoose");
  let query = User.findById(req.user.id);

  // Conditionally populate — models may not exist yet in early chunks
  if (mongoose.modelNames().includes("Product")) {
    query = query.populate("favorites.products", "name discountedPrice images expiryDate status");
  }
  if (mongoose.modelNames().includes("Store")) {
    query = query.populate("favorites.stores", "name logo");
  }

  const user = await query;

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  res.status(200).json({
    success: true,
    data: user,
  });
};

// ─── Update Profile ────────────────────────────────────────────────────────────

exports.updateProfile = async (req, res) => {
  // Fields that are allowed to be updated
  const allowedFields = [
    "name",
    "phone",
    "avatar",
    "location",
    "notificationPreferences",
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
};

// ─── Change Password ───────────────────────────────────────────────────────────

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(res, user, 200, "Password changed successfully");
};

// ─── Toggle Favorite Product ───────────────────────────────────────────────────

exports.toggleFavoriteProduct = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const productId = req.params.id;
  const index = user.favorites.products.indexOf(productId);

  if (index > -1) {
    // Remove from favorites
    user.favorites.products.splice(index, 1);
  } else {
    // Add to favorites
    user.favorites.products.push(productId);
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: index > -1 ? "Removed from favorites" : "Added to favorites",
    data: { favorites: user.favorites },
  });
};

// ─── Toggle Favorite Store ─────────────────────────────────────────────────────

exports.toggleFavoriteStore = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const storeId = req.params.id;
  const index = user.favorites.stores.indexOf(storeId);

  if (index > -1) {
    user.favorites.stores.splice(index, 1);
  } else {
    user.favorites.stores.push(storeId);
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: index > -1 ? "Removed from favorites" : "Added to favorites",
    data: { favorites: user.favorites },
  });
};
