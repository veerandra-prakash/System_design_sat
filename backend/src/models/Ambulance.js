const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema(
  {
    ambulanceNumber: {
      type: String,
      required: [true, 'Ambulance number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    type: {
      type: String,
      required: [true, 'Ambulance type is required'],
      enum: {
        values: ['BLS', 'ALS', 'ICU'],
        message: '{VALUE} is not a valid ambulance type (must be BLS, ALS, or ICU)'
      }
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['Available', 'Assigned', 'On Trip', 'Offline'],
        message: '{VALUE} is not a valid ambulance status'
      },
      default: 'Available'
    },
    isOnline: {
      type: Boolean,
      default: true
    },
    location: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      },
      address: {
        type: String,
        default: 'Base Station / En Route'
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    },
    equipment: {
      type: [String],
      default: ['First Aid Kit', 'Oxygen Cylinder', 'Stretcher']
    }
  },
  {
    timestamps: true
  }
);

// Indexes
ambulanceSchema.index({ status: 1, isOnline: 1, type: 1 });
ambulanceSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
ambulanceSchema.index({ driverId: 1 });

const Ambulance = mongoose.model('Ambulance', ambulanceSchema);
module.exports = Ambulance;
