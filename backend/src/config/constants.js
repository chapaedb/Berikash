/**
 * Application-wide constants for Berikash.
 */

const USER_ROLES = {
  CUSTOMER: "customer",
  STORE_OWNER: "store_owner",
  ADMIN: "admin",
};

const PRODUCT_STATUSES = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  SOLD: "sold",
  EXPIRED: "expired",
  REMOVED: "removed",
};

const STORE_TYPES = {
  SMALL_SUPERMARKET: "small_supermarket",
  LARGE_SUPERMARKET: "large_supermarket",
  CONVENIENCE_STORE: "convenience_store",
  MEDIUM_CHAIN: "medium_chain",
  LARGE_RETAILER: "large_retailer",
  GROCERY: "grocery",
  BAKERY: "bakery",
  BUTCHER: "butcher",
  SPECIALTY: "specialty",
  PHARMACY: "pharmacy",
};

const VERIFICATION_STATUSES = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
};

const DEFAULT_CATEGORIES = [
  { name: "Dairy", nameAmharic: "የወተት ምርቶች", icon: "🥛", slug: "dairy", order: 1 },
  { name: "Bakery", nameAmharic: "ዳቦ ቤት", icon: "🍞", slug: "bakery", order: 2 },
  { name: "Meat", nameAmharic: "ስጋ", icon: "🥩", slug: "meat", order: 3 },
  { name: "Produce", nameAmharic: "አትክልትና ፍራፍሬ", icon: "🥬", slug: "produce", order: 4 },
  { name: "Frozen Foods", nameAmharic: "የቀዘቀዙ ምግቦች", icon: "🧊", slug: "frozen-foods", order: 5 },
  { name: "Snacks", nameAmharic: "መክሰስ", icon: "🍿", slug: "snacks", order: 6 },
  { name: "Beverages", nameAmharic: "መጠጦች", icon: "🥤", slug: "beverages", order: 7 },
  { name: "Household", nameAmharic: "የቤት ዕቃዎች", icon: "🧹", slug: "household", order: 8 },
  { name: "Baby Products", nameAmharic: "የሕፃናት ምርቶች", icon: "🍼", slug: "baby-products", order: 9 },
  { name: "Personal Care", nameAmharic: "የግል ንጽህና", icon: "🧴", slug: "personal-care", order: 10 },
];

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

module.exports = {
  USER_ROLES,
  PRODUCT_STATUSES,
  STORE_TYPES,
  VERIFICATION_STATUSES,
  DEFAULT_CATEGORIES,
  PAGINATION,
};
