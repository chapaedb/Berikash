/**
 * Joi validation schemas for Berikash API.
 * Organized by domain (auth, products, stores, etc.)
 */
const Joi = require("joi");

// ─── Product Schemas ───────────────────────────────────────────────────────────

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().max(1000).allow("").optional(),
  category: Joi.string().allow("").optional(),
  brand: Joi.string().trim().max(100).allow("").optional(),
  originalPrice: Joi.number().positive().required(),
  discountedPrice: Joi.number().positive().required(),
  quantity: Joi.number().integer().min(0).required(),
  unit: Joi.string()
    .valid("kg", "piece", "liter", "pack", "box", "bundle")
    .default("piece"),
  expiryDate: Joi.date().iso().greater("now").required(),
  barcode: Joi.string().allow("").optional(),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).optional(),
  description: Joi.string().trim().max(1000).allow("").optional(),
  category: Joi.string().allow("").optional(),
  brand: Joi.string().trim().max(100).allow("").optional(),
  originalPrice: Joi.number().positive().optional(),
  discountedPrice: Joi.number().positive().optional(),
  quantity: Joi.number().integer().min(0).optional(),
  unit: Joi.string()
    .valid("kg", "piece", "liter", "pack", "box", "bundle")
    .optional(),
  expiryDate: Joi.date().iso().optional(),
  barcode: Joi.string().allow("").optional(),
  status: Joi.string()
    .valid("available", "reserved", "sold", "expired", "removed")
    .optional(),
}).min(1); // At least one field required

// ─── Search / Query Schemas ────────────────────────────────────────────────────

const searchQuerySchema = Joi.object({
  q: Joi.string().trim().max(200).optional(),
  category: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  minDiscount: Joi.number().min(0).max(100).optional(),
  maxDistance: Joi.number().min(0).max(100).optional(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  expiringWithin: Joi.number().integer().min(1).max(30).optional(),
  brand: Joi.string().optional(),
  store: Joi.string().optional(),
  status: Joi.string()
    .valid("available", "reserved", "sold", "expired")
    .default("available"),
  sortBy: Joi.string()
    .valid("price", "discount", "expiry", "distance", "newest", "popular")
    .default("newest"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// ─── Auth Schemas ──────────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid("customer", "store_owner").default("customer"),
  phone: Joi.string()
    .pattern(/^[+]?[\d\s-]{7,15}$/)
    .optional()
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  phone: Joi.string()
    .pattern(/^[+]?[\d\s-]{7,15}$/)
    .optional(),
  avatar: Joi.string().uri().optional(),
  location: Joi.object({
    type: Joi.string().valid("Point").default("Point"),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
  }).optional(),
  notificationPreferences: Joi.object({
    telegram: Joi.boolean().optional(),
    push: Joi.boolean().optional(),
    email: Joi.boolean().optional(),
  }).optional(),
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
});

// ─── ID Param Schema ───────────────────────────────────────────────────────────

const mongoIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid ID format",
    }),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  searchQuerySchema,
  mongoIdSchema,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
};

