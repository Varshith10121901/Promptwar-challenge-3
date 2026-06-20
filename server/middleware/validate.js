/**
 * Input validation and sanitization using express-validator
 */
const { body, validationResult } = require('express-validator');

/**
 * Common validation runner middleware
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors nicely
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  };
};

// Auth validation rules
const registerRules = [
  body('username')
    .trim()
    .isAlphanumeric()
    .withMessage('Username must be alphanumeric')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
];

const loginRules = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username or Email is required')
    .escape(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Footprint entry validation rules
const entryRules = [
  body('category')
    .trim()
    .isIn(['transport', 'energy', 'food', 'consumption'])
    .withMessage('Category must be transport, energy, food, or consumption'),
  body('subCategory')
    .trim()
    .notEmpty()
    .withMessage('Sub-category is required')
    .escape(),
  body('value')
    .isFloat({ min: 0.001 })
    .withMessage('Value must be a number greater than 0'),
  body('unit')
    .trim()
    .notEmpty()
    .withMessage('Unit of measurement is required')
    .escape(),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid YYYY-MM-DD format'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage('Notes cannot exceed 250 characters')
    .escape()
];

// Goal validation rules
const goalRules = [
  body('carbonGoal')
    .isFloat({ min: 1.0 })
    .withMessage('Monthly carbon goal must be at least 1.0 kg CO2e')
];

// Challenge validation rules
const enrollRules = [
  body('challengeId')
    .isInt({ min: 1 })
    .withMessage('Challenge ID must be a valid integer')
];

module.exports = {
  validateRegister: validate(registerRules),
  validateLogin: validate(loginRules),
  validateEntry: validate(entryRules),
  validateGoal: validate(goalRules),
  validateEnrollment: validate(enrollRules)
};
