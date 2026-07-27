const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

/**
 * Protect routes — require authentication.
 * Extracts JWT from Authorization header, verifies it,
 * and attaches the user to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(ApiError.unauthorized("Not authorized — no token provided"));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (without password)
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(ApiError.unauthorized("User no longer exists"));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden("Your account has been deactivated"));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(ApiError.unauthorized("Not authorized — invalid token"));
  }
};

/**
 * Authorize by role — restrict access to specific roles.
 * Must be used after protect middleware.
 *
 * Usage:
 *   router.get("/admin", protect, authorize("admin"), controller.adminAction);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Not authorized"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

module.exports = { protect, authorize };
