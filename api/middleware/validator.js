import { body, validationResult } from 'express-validator';

export const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
  },
];

export const validateVisitorStart = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, hyphens, and dots'),

  body('password')
    .isString()
    .isLength({ min: 8, max: 100 })
    .withMessage('Password must be between 8 and 100 characters'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
  },
];

export const validateReply = [
  body('reply')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Reply must be between 1 and 2000 characters')
    .escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
  },
];

export const validatePassword = [
  body('password')
    .isString()
    .isLength({ min: 4, max: 100 })
    .withMessage('Password must be between 4 and 100 characters'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
  },
];
