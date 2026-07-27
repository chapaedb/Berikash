const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ApiError = require("../utils/ApiError");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Storage Configuration ─────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectories based on file type
    let subDir = "misc";
    if (file.fieldname === "logo" || file.fieldname === "avatar") {
      subDir = "logos";
    } else if (file.fieldname === "images") {
      subDir = "images";
    } else if (file.fieldname === "businessLicense") {
      subDir = "licenses";
    }

    const dir = path.join(uploadsDir, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: fieldname-timestamp-random.ext
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// ─── File Filter ───────────────────────────────────────────────────────────────

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only image files (jpeg, jpg, png, gif, webp) are allowed"), false);
  }
};

const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (extname) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only images and PDFs are allowed"), false);
  }
};

// ─── Upload Middleware Factories ────────────────────────────────────────────────

// Single image upload (logo, avatar)
const uploadSingle = (fieldName) =>
  multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }).single(fieldName);

// Multiple images upload (product/store images)
const uploadMultiple = (fieldName, maxCount = 5) =>
  multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  }).array(fieldName, maxCount);

// Mixed upload (logo + images + license)
const uploadFields = (fields) =>
  multer({
    storage,
    fileFilter: documentFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for documents
  }).fields(fields);

/**
 * Helper to get the URL path for an uploaded file.
 * Converts absolute filesystem path to a relative URL.
 */
const getFileUrl = (file) => {
  if (!file) return null;
  // Convert backslashes to forward slashes and extract relative path
  const relativePath = file.path
    .replace(/\\/g, "/")
    .split("/uploads/")
    .pop();
  return `/uploads/${relativePath}`;
};

/**
 * Helper to get URLs for multiple uploaded files.
 */
const getFileUrls = (files) => {
  if (!files || !Array.isArray(files)) return [];
  return files.map(getFileUrl);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  getFileUrl,
  getFileUrls,
};
