const mongoose = require('mongoose');

const ambulanceRequestSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required']
    },
    ambulanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ambulance',
      default: null
    },
    patientContactNumber: {
      type: String,
      required: [true, 'Patient contact number is required'],
      trim: true
    },
    pickup: {
      address: {
        type: String,
        required: [true, 'Pickup address is required'],
        trim: true
      },
      latitude: {
        type: Number,
        required: [true, 'Pickup latitude is required'],
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        required: [true, 'Pickup longitude is required'],
        min: -180,
        max: 180
      }
    },
    destination: {
      hospitalName: {
        type: String,
        default: 'Nearest Emergency Care Hospital',
        trim: true
      },
      address: {
        type: String,
        default: 'City General Hospital Emergency Department',
        trim: true
      },
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      }
    },
    emergencyType: {
      type: String,
      required: [true, 'Emergency type is required'],
      enum: {
        values: [
          'Cardiac Arrest',
          'Accident & Trauma',
          'Respiratory Distress',
          'Stroke',
          'Maternal / Pregnancy',
          'Severe Fever / Infection',
          'Other Emergency'
        ],
        message: '{VALUE} is not a valid emergency type'
      }
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    requestedAmbulanceType: {
      type: String,
      required: [true, 'Requested ambulance type is required'],
      enum: {
        values: ['BLS', 'ALS', 'ICU'],
        message: '{VALUE} is not a valid ambulance type'
      },
      default: 'BLS'
    },
    status: {
      type: String,
      enum: {
        values: [
          'REQUESTED',
          'ACCEPTED',
          'DISPATCHED',
          'ARRIVING',
          'PATIENT_PICKED_UP',
          'COMPLETED',
          'CANCELLED',
          'REJECTED'
        ],
        message: '{VALUE} is not a valid request status'
      },
      default: 'REQUESTED'
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null
    },
    distanceKm: {
      type: Number,
      default: null
    },
    etaMinutes: {
      type: Number,
      default: null
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    assignedAt: {
      type: Date,
      default: null
    },
    pickedUpAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null
        },
        note: {
          type: String,
          default: ''
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes
ambulanceRequestSchema.index({ patientId: 1, createdAt: -1 });
ambulanceRequestSchema.index({ ambulanceId: 1 });
ambulanceRequestSchema.index({ status: 1 });
ambulanceRequestSchema.index({ createdAt: -1 });

// Helper to check if request is cancellable
// Requests can only be cancelled before patient is picked up or completed
ambulanceRequestSchema.methods.isCancellable = function () {
  const nonCancellableStates = ['PATIENT_PICKED_UP', 'COMPLETED', 'CANCELLED', 'REJECTED'];
  return !nonCancellableStates.includes(this.status);
};

const AmbulanceRequest = mongoose.model('AmbulanceRequest', ambulanceRequestSchema);
module.exports = AmbulanceRequest;
