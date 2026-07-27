const mongoose = require("mongoose");
const { STORE_TYPES, VERIFICATION_STATUSES } = require("../config/constants");

const storeSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Store owner is required"],
    },
    name: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      maxlength: [150, "Store name cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    type: {
      type: String,
      enum: Object.values(STORE_TYPES),
      default: STORE_TYPES.SMALL_SUPERMARKET,
    },
    logo: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => v.length <= 10,
        message: "Maximum 10 images allowed",
      },
    },
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      website: { type: String, trim: true },
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true, default: "Addis Ababa" },
      subcity: { type: String, trim: true },
      woreda: { type: String, trim: true },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, "Store location coordinates are required"],
      },
    },
    operatingHours: {
      monday: {
        open: { type: String, default: "08:00" },
        close: { type: String, default: "20:00" },
      },
      tuesday: {
        open: { type: String, default: "08:00" },
        close: { type: String, default: "20:00" },
      },
      wednesday: {
        open: { type: String, default: "08:00" },
        close: { type: String, default: "20:00" },
      },
      thursday: {
        open: { type: String, default: "08:00" },
        close: { type: String, default: "20:00" },
      },
      friday: {
        open: { type: String, default: "08:00" },
        close: { type: String, default: "20:00" },
      },
      saturday: {
        open: { type: String, default: "08:00" },
        close: { type: String, default: "20:00" },
      },
      sunday: {
        open: { type: String, default: "10:00" },
        close: { type: String, default: "18:00" },
      },
    },
    verification: {
      status: {
        type: String,
        enum: Object.values(VERIFICATION_STATUSES),
        default: VERIFICATION_STATUSES.PENDING,
      },
      businessLicense: { type: String }, // uploaded file URL
      verifiedAt: { type: Date },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      rejectionReason: { type: String },
    },
    stats: {
      totalProducts: { type: Number, default: 0 },
      totalSold: { type: Number, default: 0 },
      rating: { type: Number, default: 0, min: 0, max: 5 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────

storeSchema.index({ location: "2dsphere" });
storeSchema.index({ owner: 1 });
storeSchema.index({ "verification.status": 1 });
storeSchema.index({ name: "text", description: "text" });

// ─── Virtuals ──────────────────────────────────────────────────────────────────

// Virtual populate — get all products for this store
storeSchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "store",
  justOne: false,
});

module.exports = mongoose.model("Store", storeSchema);
