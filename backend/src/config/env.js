/**
 * Environment variable validation.
 * Fails fast on startup if required variables are missing.
 */
const requiredVars = ["MONGO_URI"];

const validateEnv = () => {
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `FATAL: Missing required environment variables: ${missing.join(", ")}`
    );
    console.error("Please check your .env file.");
    process.exit(1);
  }
};

module.exports = validateEnv;
