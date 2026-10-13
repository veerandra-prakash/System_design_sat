require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Ambulance = require('../models/Ambulance');
const AmbulanceRequest = require('../models/AmbulanceRequest');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ambulance_connect';
  await mongoose.connect(uri);
  console.log('[Seed] Connected to MongoDB database at:', uri);
};

const seedData = async () => {
  try {
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Ambulance.deleteMany({}),
      AmbulanceRequest.deleteMany({})
    ]);

    console.log('[Seed] Seeding sample users...');
    const adminPasswordHash = await User.hashPassword('admin123');
    const driverPasswordHash = await User.hashPassword('driver123');
    const patientPasswordHash = await User.hashPassword('patient123');

    // 1. Admin User
    const admin = await User.create({
      name: 'Dr. Sarah Connor (Chief Dispatcher)',
      email: 'admin@ambulance.com',
      phone: '+1-555-0100',
      passwordHash: adminPasswordHash,
      role: 'admin',
      emergencyContact: {
        name: 'EMS HQ Dispatch Operations',
        phone: '+1-555-0101',
        relationship: 'Operations Desk'
      }
    });

    // 2. Drivers
    const driver1 = await User.create({
      name: 'Marcus Vance',
      email: 'driver1@ambulance.com',
      phone: '+1-555-0201',
      passwordHash: driverPasswordHash,
      role: 'driver',
      emergencyContact: {
        name: 'Elena Vance',
        phone: '+1-555-0202',
        relationship: 'Spouse'
      }
    });

    const driver2 = await User.create({
      name: 'Priya Sharma (Paramedic Specialist)',
      email: 'driver2@ambulance.com',
      phone: '+1-555-0203',
      passwordHash: driverPasswordHash,
      role: 'driver',
      emergencyContact: {
        name: 'Raj Sharma',
        phone: '+1-555-0204',
        relationship: 'Brother'
      }
    });

    const driver3 = await User.create({
      name: 'David Miller',
      email: 'driver3@ambulance.com',
      phone: '+1-555-0205',
      passwordHash: driverPasswordHash,
      role: 'driver',
      emergencyContact: {
        name: 'Clara Miller',
        phone: '+1-555-0206',
        relationship: 'Mother'
      }
    });

    // 3. Patients
    const patient1 = await User.create({
      name: 'Johnathan Reed',
      email: 'patient@ambulance.com',
      phone: '+1-555-0301',
      passwordHash: patientPasswordHash,
      role: 'patient',
      emergencyContact: {
        name: 'Mary Reed',
        phone: '+1-555-0302',
        relationship: 'Spouse'
      }
    });

    const patient2 = await User.create({
      name: 'Amina Al-Mansoor',
      email: 'amina@example.com',
      phone: '+1-555-0303',
      passwordHash: patientPasswordHash,
      role: 'patient',
      emergencyContact: {
        name: 'Tariq Mansoor',
        phone: '+1-555-0304',
        relationship: 'Parent'
      }
    });

    console.log('[Seed] Seeding sample ambulances with GPS coordinates...');
    // We'll use a realistic city center area (e.g. Bangalore center / City Center coordinates)
    // Center: ~12.9716, 77.5946
    const ambulances = await Ambulance.create([
      {
        ambulanceNumber: 'AMB-101',
        registrationNumber: 'KA-01-AB-1001',
        type: 'ALS', // Advanced Life Support
        driverId: driver1._id,
        status: 'Available',
        isOnline: true,
        location: {
          latitude: 12.9724,
          longitude: 77.5951,
          address: 'Central Station Depot, MG Road',
          updatedAt: new Date()
        },
        equipment: ['Oxygen Cylinder', 'Defibrillator', 'ECG Monitor', 'Stretcher', 'Advanced Trauma Kit']
      },
      {
        ambulanceNumber: 'AMB-102',
        registrationNumber: 'KA-01-AB-1002',
        type: 'ICU', // Intensive Care Unit
        driverId: driver2._id,
        status: 'Available',
        isOnline: true,
        location: {
          latitude: 12.9785,
          longitude: 77.6012,
          address: 'North District EMS Bay, Shivajinagar',
          updatedAt: new Date()
        },
        equipment: ['Transport Ventilator', 'Infusion Pump', 'Cardiac Monitor', 'Suction Machine', 'Defibrillator', 'Oxygen Bank']
      },
      {
        ambulanceNumber: 'AMB-103',
        registrationNumber: 'KA-01-AB-1003',
        type: 'BLS', // Basic Life Support
        driverId: driver3._id,
        status: 'Available',
        isOnline: true,
        location: {
          latitude: 12.9642,
          longitude: 77.5878,
          address: 'South Zone EMS Station, Richmond Circle',
          updatedAt: new Date()
        },
        equipment: ['First Aid Kit', 'Oxygen Tank', 'Spine Board', 'Wheelchair', 'Basic Trauma Splints']
      },
      {
        ambulanceNumber: 'AMB-104',
        registrationNumber: 'KA-01-AB-1004',
        type: 'ALS',
        driverId: null,
        status: 'Available',
        isOnline: true,
        location: {
          latitude: 12.981,
          longitude: 77.575,
          address: 'West Sector Station, Malleshwaram',
          updatedAt: new Date()
        },
        equipment: ['Defibrillator', 'Oxygen Cylinder', 'Trauma Kit', 'Stretcher']
      },
      {
        ambulanceNumber: 'AMB-105',
        registrationNumber: 'KA-01-AB-1005',
        type: 'BLS',
        driverId: null,
        status: 'Offline',
        isOnline: false,
        location: {
          latitude: 12.955,
          longitude: 77.57,
          address: 'Maintenance Garage, Wilson Garden',
          updatedAt: new Date()
        },
        equipment: ['Basic First Aid Kit', 'Stretcher']
      }
    ]);

    console.log('[Seed] Seeding sample emergency requests...');
    // Seed 1: Completed previous trip for patient1
    await AmbulanceRequest.create({
      patientId: patient1._id,
      patientContactNumber: patient1.phone,
      ambulanceId: ambulances[0]._id,
      pickup: {
        address: '42 Brigade Road, Ashok Nagar',
        latitude: 12.973,
        longitude: 77.606
      },
      destination: {
        hospitalName: 'Bowring and Lady Curzon Emergency Hospital',
        address: 'Lady Curzon Rd, Tasker Town',
        latitude: 12.982,
        longitude: 77.602
      },
      emergencyType: 'Accident & Trauma',
      description: 'Minor road accident, wrist fracture and abrasions.',
      requestedAmbulanceType: 'ALS',
      status: 'COMPLETED',
      distanceKm: 2.1,
      etaMinutes: 6,
      requestedAt: new Date(Date.now() - 4 * 3600 * 1000),
      assignedAt: new Date(Date.now() - 4 * 3600 * 1000 + 30000),
      pickedUpAt: new Date(Date.now() - 4 * 3600 * 1000 + 8 * 60000),
      completedAt: new Date(Date.now() - 4 * 3600 * 1000 + 25 * 60000),
      statusHistory: [
        {
          status: 'REQUESTED',
          timestamp: new Date(Date.now() - 4 * 3600 * 1000),
          updatedBy: patient1._id,
          note: 'Emergency request created'
        },
        {
          status: 'ACCEPTED',
          timestamp: new Date(Date.now() - 4 * 3600 * 1000 + 30000),
          updatedBy: admin._id,
          note: 'Assigned AMB-101 nearest ALS unit'
        },
        {
          status: 'DISPATCHED',
          timestamp: new Date(Date.now() - 4 * 3600 * 1000 + 60000),
          updatedBy: driver1._id,
          note: 'Driver en route with sirens'
        },
        {
          status: 'ARRIVING',
          timestamp: new Date(Date.now() - 4 * 3600 * 1000 + 5 * 60000),
          updatedBy: driver1._id,
          note: 'Ambulance arriving at scene'
        },
        {
          status: 'PATIENT_PICKED_UP',
          timestamp: new Date(Date.now() - 4 * 3600 * 1000 + 8 * 60000),
          updatedBy: driver1._id,
          note: 'Patient stabilized on stretcher'
        },
        {
          status: 'COMPLETED',
          timestamp: new Date(Date.now() - 4 * 3600 * 1000 + 25 * 60000),
          updatedBy: driver1._id,
          note: 'Patient transferred safely to emergency care triage'
        }
      ]
    });

    console.log('[Seed] Database successfully seeded with:');
    console.log(' - Admin User:      admin@ambulance.com   / admin123');
    console.log(' - Driver 1 User:   driver1@ambulance.com / driver123 (Assigned to AMB-101 ALS)');
    console.log(' - Driver 2 User:   driver2@ambulance.com / driver123 (Assigned to AMB-102 ICU)');
    console.log(' - Driver 3 User:   driver3@ambulance.com / driver123 (Assigned to AMB-103 BLS)');
    console.log(' - Patient User:    patient@ambulance.com / patient123');
    console.log(' - 5 Registered Ambulances across BLS, ALS, ICU');
    console.log(' - Sample requests and status history.');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
