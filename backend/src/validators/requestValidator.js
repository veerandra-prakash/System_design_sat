const { body, param, query } = require('express-validator');

const createRequestValidator = [
  body('pickup.address')
    .trim()
    .notEmpty()
    .withMessage('Pickup address is required'),
  body('pickup.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Pickup latitude must be a valid number between -90 and 90'),
  body('pickup.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Pickup longitude must be a valid number between -180 and 180'),
  body('patientContactNumber')
    .trim()
    .notEmpty()
    .withMessage('Patient contact number is required')
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage('Valid contact number is required'),
  body('emergencyType')
    .notEmpty()
    .withMessage('Emergency type is required')
    .isIn([
      'Cardiac Arrest',
      'Accident & Trauma',
      'Respiratory Distress',
      'Stroke',
      'Maternal / Pregnancy',
      'Severe Fever / Infection',
      'Other Emergency'
    ])
    .withMessage('Invalid emergency type selected'),
  body('requestedAmbulanceType')
    .notEmpty()
    .withMessage('Requested ambulance type is required')
    .isIn(['BLS', 'ALS', 'ICU'])
    .withMessage('Ambulance type must be BLS, ALS, or ICU'),
  body('destination.hospitalName')
    .optional()
    .trim(),
  body('destination.address')
    .optional()
    .trim(),
  body('destination.latitude')
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 }),
  body('destination.longitude')
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 }),
  body('description')
    .optional()
    .trim()
];

const updateRequestStatusValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid request ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn([
      'REQUESTED',
      'ACCEPTED',
      'DISPATCHED',
      'ARRIVING',
      'PATIENT_PICKED_UP',
      'COMPLETED',
      'CANCELLED',
      'REJECTED'
    ])
    .withMessage('Invalid status value'),
  body('note')
    .optional()
    .trim()
];

const cancelRequestValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid request ID'),
  body('cancellationReason')
    .trim()
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .isLength({ min: 3, max: 300 })
    .withMessage('Reason must be between 3 and 300 characters')
];

const listRequestsQueryValidator = [
  query('status')
    .optional()
    .isIn([
      'REQUESTED',
      'ACCEPTED',
      'DISPATCHED',
      'ARRIVING',
      'PATIENT_PICKED_UP',
      'COMPLETED',
      'CANCELLED',
      'REJECTED'
    ])
    .withMessage('Invalid status filter'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

module.exports = {
  createRequestValidator,
  updateRequestStatusValidator,
  cancelRequestValidator,
  listRequestsQueryValidator
};
