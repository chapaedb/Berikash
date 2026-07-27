const Joi = require("joi");
const ApiError = require("../utils/ApiError");

/**
 * Request validation middleware factory.
 * Validates req.body, req.query, or req.params against a Joi schema.
 *
 * Usage:
 *   router.post("/", validate(createProductSchema), controller.create);
 *
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @param {string} source - "body" | "query" | "params" (default: "body")
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join(". ");
      return next(ApiError.badRequest(message));
    }

    // Replace with validated & sanitized values
    req[source] = value;
    next();
  };
};

module.exports = validate;
