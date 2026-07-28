const Product = require("../models/Product");
const Store = require("../models/Store");
const ApiError = require("../utils/ApiError");
const { sendPaginated, sendSuccess, calculateDistanceKm } = require("../utils/helpers");
const { PAGINATION, PRODUCT_STATUSES } = require("../config/constants");

// @desc    Search and filter products with compound queries
// @route   GET /api/v1/search
// @access  Public
exports.searchProducts = async (req, res) => {
  const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  // Base filter: active and non-expired products
  const filter = {
    status: PRODUCT_STATUSES.AVAILABLE,
    expiryDate: { $gt: new Date() },
  };

  // Text search (name, description, brand)
  if (req.query.q) {
    filter.$text = { $search: req.query.q };
  }

  // Category filter
  if (req.query.category) {
    filter.category = req.query.category;
  }

  // Brand filter
  if (req.query.brand) {
    filter.brand = new RegExp(req.query.brand, "i");
  }

  // Specific store filter
  if (req.query.store) {
    filter.store = req.query.store;
  }

  // Price range
  if (req.query.minPrice || req.query.maxPrice) {
    filter.discountedPrice = {};
    if (req.query.minPrice) filter.discountedPrice.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) filter.discountedPrice.$lte = parseFloat(req.query.maxPrice);
  }

  // Minimum discount percentage
  if (req.query.minDiscount) {
    filter.discountPercentage = { $gte: parseFloat(req.query.minDiscount) };
  }

  // Expiring within X days
  if (req.query.expiringWithin) {
    const days = parseInt(req.query.expiringWithin, 10);
    const maxExpiry = new Date();
    maxExpiry.setDate(maxExpiry.getDate() + days);
    filter.expiryDate.$lte = maxExpiry;
  }

  // Geospatial filtering by user location
  if (req.query.lat && req.query.lng) {
    const maxDist = parseFloat(req.query.maxDistance || 10) * 1000; // km to meters
    const nearbyStores = await Store.find({
      isActive: true,
      "verification.status": "verified",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(req.query.lng), parseFloat(req.query.lat)],
          },
          $maxDistance: maxDist,
        },
      },
    }).select("_id");

    const storeIds = nearbyStores.map((s) => s._id);
    filter.store = { $in: storeIds };
  }

  // Sorting
  let sort = { createdAt: -1 };
  switch (req.query.sortBy) {
    case "price_asc":
      sort = { discountedPrice: 1 };
      break;
    case "price_desc":
      sort = { discountedPrice: -1 };
      break;
    case "discount":
      sort = { discountPercentage: -1 };
      break;
    case "expiry":
      sort = { expiryDate: 1 };
      break;
    case "popular":
      sort = { views: -1, savedBy: -1 };
      break;
    case "newest":
    default:
      sort = { createdAt: -1 };
      break;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("store", "name logo address location type rating")
      .populate("category", "name nameAmharic icon slug")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  sendPaginated(res, products, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
};

// @desc    Get trending deals (top views & discounts)
// @route   GET /api/v1/search/trending
// @access  Public
exports.getTrendingDeals = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);

  const products = await Product.find({
    status: PRODUCT_STATUSES.AVAILABLE,
    expiryDate: { $gt: new Date() },
  })
    .populate("store", "name logo address location rating")
    .populate("category", "name nameAmharic icon slug")
    .sort({ discountPercentage: -1, views: -1 })
    .limit(limit);

  sendSuccess(res, products);
};

// @desc    Get nearby deals (geo-based)
// @route   GET /api/v1/search/nearby
// @access  Public
exports.getNearbyDeals = async (req, res) => {
  const { lat, lng, maxDistance = 10 } = req.query;

  if (!lat || !lng) {
    throw ApiError.badRequest("Latitude (lat) and longitude (lng) parameters are required");
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const maxDistMeters = parseFloat(maxDistance) * 1000;

  const nearbyStores = await Store.find({
    isActive: true,
    "verification.status": "verified",
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [userLng, userLat],
        },
        $maxDistance: maxDistMeters,
      },
    },
  }).select("_id name logo location address");

  const storeIds = nearbyStores.map((s) => s._id);

  const products = await Product.find({
    store: { $in: storeIds },
    status: PRODUCT_STATUSES.AVAILABLE,
    expiryDate: { $gt: new Date() },
  })
    .populate("store", "name logo address location rating")
    .populate("category", "name nameAmharic icon slug")
    .sort({ discountPercentage: -1 })
    .limit(40);

  // Attach distanceKm to each product
  const productsWithDistance = products.map((p) => {
    const pObj = p.toObject();
    if (p.store?.location?.coordinates) {
      const [sLng, sLat] = p.store.location.coordinates;
      pObj.distanceKm = calculateDistanceKm(userLat, userLng, sLat, sLng);
    } else {
      pObj.distanceKm = null;
    }
    return pObj;
  });

  sendSuccess(res, productsWithDistance);
};
