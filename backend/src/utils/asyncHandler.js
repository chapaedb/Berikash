/**
 * Wraps async route handlers to catch errors automatically.
 * Eliminates the need for try/catch blocks in every route.
 *
 * Usage:
 *   router.get("/", asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
