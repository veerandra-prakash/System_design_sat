const { body, param, query } = require('express-validator');

const createAmbulanceValidator = [
  body('ambulanceNumber')
    .trim()
    .notEmpty()
    .withMessage('Ambulance number is required'),
  body('registrationNumber')
    .trim()
    .notEmpty()
    .withMessage('Registration number is required'),
  body('type')
    .notEmpty()
    .withMessage('Ambulance type is required')
    .isIn(['BLS', 'ALS', 'ICU'])
    .withMessage('Ambulance type must be BLS, ALS, or ICU'),
  body('location.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid number between -90 and 90'),
  body('location.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid number between -180 and 180'),
  body('driverId')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Driver ID must be a valid Mongo ID'),
  body('equipment')
    .optional()
    .isArray()
    .withMessage('Equipment must be an array of strings')
];

const updateStatusValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ambulance ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Available', 'Assigned', 'On Trip', 'Offline'])
    .withMessage('Status must be Available, Assigned, On Trip, or Offline')
];

const updateLocationValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ambulance ID'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('address')
    .optional()
    .trim()
];

const listAmbulanceQueryValidator = [
  query('type')
    .optional()
    .isIn(['BLS', 'ALS', 'ICU'])
    .withMessage('Type must be BLS, ALS, or ICU'),
  query('status')
    .optional()
    .isIn(['Available', 'Assigned', 'On Trip', 'Offline'])
    .withMessage('Status must be Available, Assigned, On Trip, or Offline'),
  query('isOnline')
    .optional()
    .isBoolean()
    .withMessage('isOnline must be a boolean')
];

module.exports = {
  createAmbulanceValidator,
  updateStatusValidator,
  updateLocationValidator,
  listAmbulanceQueryValidator
};
