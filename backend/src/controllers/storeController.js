const Store = require("../models/Store");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const { getFileUrl, getFileUrls } = require("../middleware/upload");
const { sendSuccess, sendCreated, sendPaginated } = require("../utils/helpers");
const { PAGINATION } = require("../config/constants");

// ─── Create Store ──────────────────────────────────────────────────────────────

exports.createStore = async (req, res) => {
  // Check if user already has a store
  const existingStore = await Store.findOne({ owner: req.user.id });
  if (existingStore) {
    throw ApiError.conflict("You already have a registered store");
  }

  // Build store data
  const storeData = {
    ...req.body,
    owner: req.user.id,
  };

  // Handle location — expect { coordinates: [lng, lat] }
  if (req.body.lng && req.body.lat) {
    storeData.location = {
      type: "Point",
      coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
    };
  }

  // Handle file uploads
  if (req.files) {
    if (req.files.logo && req.files.logo[0]) {
      storeData.logo = getFileUrl(req.files.logo[0]);
    }
    if (req.files.images) {
      storeData.images = getFileUrls(req.files.images);
    }
    if (req.files.businessLicense && req.files.businessLicense[0]) {
      storeData.verification = {
        ...storeData.verification,
        businessLicense: getFileUrl(req.files.businessLicense[0]),
      };
    }
  }

  const store = await Store.create(storeData);
  sendCreated(res, store, "Store registered successfully. Awaiting verification.");
};

// ─── Get All Stores ────────────────────────────────────────────────────────────

exports.getStores = async (req, res) => {
  const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {
    isActive: true,
    "verification.status": "verified",
  };

  if (req.query.type) {
    filter.type = req.query.type;
  }

  if (req.query.q) {
    filter.$text = { $search: req.query.q };
  }

  const [stores, total] = await Promise.all([
    Store.find(filter)
      .select("-operatingHours -verification.businessLicense")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Store.countDocuments(filter),
  ]);

  sendPaginated(res, stores, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
};

// ─── Get Nearby Stores ─────────────────────────────────────────────────────────

exports.getNearbyStores = async (req, res) => {
  const { lat, lng, maxDistance = 10000 } = req.query; // maxDistance in metres

  if (!lat || !lng) {
    throw ApiError.badRequest("Please provide lat and lng query parameters");
  }

  const stores = await Store.find({
    isActive: true,
    "verification.status": "verified",
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: parseInt(maxDistance),
      },
    },
  })
    .select("name type address location contact stats verification.status logo")
    .limit(20);

  sendSuccess(res, stores, `Found ${stores.length} store(s) within ${maxDistance / 1000}km`);
};

// ─── Get Single Store ──────────────────────────────────────────────────────────

exports.getStore = async (req, res) => {
  const store = await Store.findById(req.params.id).populate(
    "owner",
    "name email"
  );

  if (!store) {
    throw ApiError.notFound("Store not found");
  }

  sendSuccess(res, store);
};

// ─── Update Store ──────────────────────────────────────────────────────────────

exports.updateStore = async (req, res) => {
  let store = await Store.findById(req.params.id);

  if (!store) {
    throw ApiError.notFound("Store not found");
  }

  // Ensure the user owns this store
  if (store.owner.toString() !== req.user.id && req.user.role !== "admin") {
    throw ApiError.forbidden("You are not authorized to update this store");
  }

  // Handle location update
  if (req.body.lng && req.body.lat) {
    req.body.location = {
      type: "Point",
      coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
    };
  }

  // Handle file uploads
  if (req.files) {
    if (req.files.logo && req.files.logo[0]) {
      req.body.logo = getFileUrl(req.files.logo[0]);
    }
    if (req.files.images) {
      req.body.images = [
        ...store.images,
        ...getFileUrls(req.files.images),
      ];
    }
  }

  store = await Store.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, store, "Store updated successfully");
};

// ─── Delete (Deactivate) Store ─────────────────────────────────────────────────

exports.deleteStore = async (req, res) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    throw ApiError.notFound("Store not found");
  }

  if (store.owner.toString() !== req.user.id && req.user.role !== "admin") {
    throw ApiError.forbidden("You are not authorized to delete this store");
  }

  store.isActive = false;
  await store.save();

  sendSuccess(res, null, "Store deactivated successfully");
};

// ─── Get Nearby Stores ─────────────────────────────────────────────────────────

exports.getNearbyStores = async (req, res) => {
  const { lat, lng, maxDistance = 5 } = req.query;

  if (!lat || !lng) {
    throw ApiError.badRequest("Latitude and longitude are required");
  }

  const stores = await Store.find({
    isActive: true,
    "verification.status": "verified",
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: parseFloat(maxDistance) * 1000, // Convert km to meters
      },
    },
  }).select("-operatingHours -verification.businessLicense");

  sendSuccess(res, stores);
};

// ─── Get Store Products ────────────────────────────────────────────────────────

exports.getStoreProducts = async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) {
    throw ApiError.notFound("Store not found");
  }

  const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const filter = {
    store: req.params.id,
    status: "available",
    expiryDate: { $gt: new Date() },
  };

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  sendPaginated(res, products, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
};

// ─── Get My Store (for store owners) ───────────────────────────────────────────

exports.getMyStore = async (req, res) => {
  const store = await Store.findOne({ owner: req.user.id });

  if (!store) {
    throw ApiError.notFound("You don't have a registered store");
  }

  sendSuccess(res, store);
};

// ─── Verify Store (Admin) ──────────────────────────────────────────────────────

exports.verifyStore = async (req, res) => {
  const { status, rejectionReason } = req.body;

  if (!["verified", "rejected"].includes(status)) {
    throw ApiError.badRequest("Status must be 'verified' or 'rejected'");
  }

  if (status === "rejected" && !rejectionReason) {
    throw ApiError.badRequest("Rejection reason is required");
  }

  const store = await Store.findById(req.params.id);
  if (!store) {
    throw ApiError.notFound("Store not found");
  }

  store.verification.status = status;
  store.verification.verifiedAt = new Date();
  store.verification.verifiedBy = req.user.id;

  if (status === "rejected") {
    store.verification.rejectionReason = rejectionReason;
  }

  await store.save();

  sendSuccess(
    res,
    store,
    `Store ${status === "verified" ? "verified" : "rejected"} successfully`
  );
};

// ─── Get Pending Stores (Admin) ────────────────────────────────────────────────

exports.getPendingStores = async (req, res) => {
  const stores = await Store.find({
    "verification.status": "pending",
  })
    .populate("owner", "name email phone")
    .sort({ createdAt: 1 });

  sendSuccess(res, stores);
};
