/**
 * Schema-based request validator middleware.
 * Validates req.body, req.query, or req.params against standard rules.
 * 
 * Example usage:
 * router.post('/login', validate({
 *   body: {
 *     email: { type: 'string', required: true, format: 'email' },
 *     password: { type: 'string', required: true, min: 6 }
 *   }
 * }), loginController);
 */

const validate = (rules) => {
  return (req, res, next) => {
    const errors = [];

    // Helper function to validate fields
    const checkObj = (obj, fieldRules, sourceName) => {
      if (!obj) {
        if (Object.keys(fieldRules).some(k => fieldRules[k].required)) {
          errors.push(`Request ${sourceName} is missing.`);
        }
        return;
      }

      for (const [key, rule] of Object.entries(fieldRules)) {
        const val = obj[key];

        // Check if required
        if (rule.required && (val === undefined || val === null || val === '')) {
          errors.push(`Field '${key}' in ${sourceName} is required.`);
          continue;
        }

        // If not required and not present, skip further checks
        if (val === undefined || val === null || val === '') {
          continue;
        }

        // Check type
        if (rule.type) {
          if (rule.type === 'array') {
            if (!Array.isArray(val)) {
              errors.push(`Field '${key}' must be an array.`);
            }
          } else if (rule.type === 'number') {
            const num = Number(val);
            if (isNaN(num)) {
              errors.push(`Field '${key}' must be a number.`);
            }
          } else if (typeof val !== rule.type) {
            errors.push(`Field '${key}' must be a ${rule.type}.`);
          }
        }

        // Check format
        if (rule.format && typeof val === 'string') {
          if (rule.format === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(val)) {
              errors.push(`Field '${key}' must be a valid email address.`);
            }
          }
          if (rule.format === 'mongodb-id') {
            const idRegex = /^[0-9a-fA-F]{24}$/;
            if (!idRegex.test(val)) {
              errors.push(`Field '${key}' must be a valid MongoDB ObjectId.`);
            }
          }
        }

        // Check min/max lengths or value bounds
        if (rule.min !== undefined) {
          if (typeof val === 'string' && val.length < rule.min) {
            errors.push(`Field '${key}' must have at least ${rule.min} characters.`);
          }
          if (typeof val === 'number' && val < rule.min) {
            errors.push(`Field '${key}' must be at least ${rule.min}.`);
          }
          if (Array.isArray(val) && val.length < rule.min) {
            errors.push(`Field '${key}' must contain at least ${rule.min} items.`);
          }
        }

        if (rule.max !== undefined) {
          if (typeof val === 'string' && val.length > rule.max) {
            errors.push(`Field '${key}' must not exceed ${rule.max} characters.`);
          }
          if (typeof val === 'number' && val > rule.max) {
            errors.push(`Field '${key}' must not be greater than ${rule.max}.`);
          }
          if (Array.isArray(val) && val.length > rule.max) {
            errors.push(`Field '${key}' must not contain more than ${rule.max} items.`);
          }
        }

        // Check enum values
        if (rule.enum && Array.isArray(rule.enum)) {
          if (!rule.enum.includes(val)) {
            errors.push(`Field '${key}' must be one of [${rule.enum.join(', ')}].`);
          }
        }
      }
    };

    if (rules.body) checkObj(req.body, rules.body, 'body');
    if (rules.query) checkObj(req.query, rules.query, 'query');
    if (rules.params) checkObj(req.params, rules.params, 'params');

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

module.exports = validate;
