const mongoose = require("mongoose");
const { PRODUCT_STATUSES } = require("../config/constants");

const productSchema = new mongoose.Schema(
  {
    // Store reference — every product must belong to a verified store
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store reference is required"],
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    brand: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => v.length <= 5,
        message: "Maximum 5 images allowed",
      },
    },
    originalPrice: {
      type: Number,
      required: [true, "Original price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountedPrice: {
      type: Number,
      required: [true, "Discounted price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    unit: {
      type: String,
      enum: ["kg", "piece", "liter", "pack", "box", "bundle"],
      default: "piece",
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUSES),
      default: PRODUCT_STATUSES.AVAILABLE,
    },
    barcode: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    savedBy: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ──────────────────────────────────────────────────────────────────

// Calculate days until expiry
productSchema.virtual("daysUntilExpiry").get(function () {
  if (!this.expiryDate) return null;
  const now = new Date();
  const diff = this.expiryDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// ─── Indexes ───────────────────────────────────────────────────────────────────

// Text search index
productSchema.index({ name: "text", description: "text", brand: "text" });

// Compound index for common queries
productSchema.index({ status: 1, expiryDate: 1 });
productSchema.index({ store: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });

// ─── Pre-save Hook ─────────────────────────────────────────────────────────────

productSchema.pre("save", function () {
  // Auto-calculate discount percentage
  if (this.isModified("originalPrice") || this.isModified("discountedPrice")) {
    if (this.originalPrice > 0) {
      this.discountPercentage = Math.round(
        ((this.originalPrice - this.discountedPrice) / this.originalPrice) * 100
      );
    }
  }

  // Auto-expire check
  if (this.expiryDate && new Date(this.expiryDate) <= new Date()) {
    this.status = PRODUCT_STATUSES.EXPIRED;
    this.isActive = false;
  }
});

module.exports = mongoose.model("Product", productSchema);
