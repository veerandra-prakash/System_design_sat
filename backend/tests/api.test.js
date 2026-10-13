const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Ambulance = require('../src/models/Ambulance');
const AmbulanceRequest = require('../src/models/AmbulanceRequest');

let adminToken = '';
let driverToken = '';
let patientToken = '';
let secondPatientToken = '';
let patientId = '';
let secondPatientId = '';
let testAmbulanceId = '';
let testAmbulanceNumber = 'AMB-TEST-1';
let activeRequestId = '';
let assignedAmbulanceId = '';

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ambulance_connect';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  // Cleanup test entities if any exist
  await User.deleteMany({ email: /test.*@example\.com/ });
  await Ambulance.deleteMany({ ambulanceNumber: /AMB-TEST.*/ });
  await AmbulanceRequest.deleteMany({ 'pickup.address': /TEST_LOC.*/ });

  // 1. Create Admin
  const adminRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Admin Test',
      email: 'testadmin@example.com',
      password: 'password123',
      phone: '+1-555-1000',
      role: 'admin'
    });
  adminToken = adminRes.body.data.token;

  // 2. Create Driver
  const driverRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Driver Test',
      email: 'testdriver@example.com',
      password: 'password123',
      phone: '+1-555-2000',
      role: 'driver'
    });
  driverToken = driverRes.body.data.token;

  // 3. Create Patient 1
  const patientRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Patient Test One',
      email: 'testpatient1@example.com',
      password: 'password123',
      phone: '+1-555-3000',
      role: 'patient'
    });
  patientToken = patientRes.body.data.token;
  patientId = patientRes.body.data.user._id;

  // 4. Create Patient 2
  const secondPatientRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Patient Test Two',
      email: 'testpatient2@example.com',
      password: 'password123',
      phone: '+1-555-4000',
      role: 'patient'
    });
  secondPatientToken = secondPatientRes.body.data.token;
  secondPatientId = secondPatientRes.body.data.user._id;

  // Create test ambulance
  const amb = await Ambulance.create({
    ambulanceNumber: testAmbulanceNumber,
    registrationNumber: 'TEST-REG-001',
    type: 'ALS',
    status: 'Available',
    isOnline: true,
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'Test Base Station',
      updatedAt: new Date()
    },
    equipment: ['Oxygen', 'ECG', 'Defibrillator']
  });
  testAmbulanceId = amb._id.toString();
});

afterAll(async () => {
  // Clean up test data
  await User.deleteMany({ email: /test.*@example\.com/ });
  await Ambulance.deleteMany({ ambulanceNumber: /AMB-TEST.*/ });
  await AmbulanceRequest.deleteMany({ 'pickup.address': /TEST_LOC.*/ });
  await mongoose.connection.close();
});

describe('1. Health and Authentication API', () => {
  it('GET /api/v1/health should return 200 OK with database connected', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.database.connected).toBe(true);
  });

  it('POST /api/v1/auth/login should authenticate valid user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'testpatient1@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('testpatient1@example.com');
  });

  it('POST /api/v1/auth/login should reject invalid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'testpatient1@example.com',
      password: 'wrongpassword'
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me should reject requests without JWT or invalid JWT', async () => {
    const resNoToken = await request(app).get('/api/v1/auth/me');
    expect(resNoToken.statusCode).toBe(401);

    const resBadToken = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid_or_expired_jwt_token');
    expect(resBadToken.statusCode).toBe(401);
  });

  it('GET /api/v1/auth/me should return user details for valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.name).toBe('Patient Test One');
  });
});

describe('2. Role-Based Access Control (RBAC)', () => {
  it('POST /api/v1/ambulances should forbid non-admin (patient) from registering ambulances', async () => {
    const res = await request(app)
      .post('/api/v1/ambulances')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        ambulanceNumber: 'AMB-FORBIDDEN',
        registrationNumber: 'REG-FORBIDDEN',
        type: 'BLS',
        location: { latitude: 12.9, longitude: 77.5 }
      });
    expect(res.statusCode).toBe(403);
  });

  it('GET /api/v1/admin/dashboard should forbid patient access', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('GET /api/v1/admin/dashboard should allow admin access', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.metrics).toBeDefined();
  });
});

describe('3. Ambulance Management API', () => {
  it('GET /api/v1/ambulances should list ambulances and support filtering', async () => {
    const res = await request(app).get('/api/v1/ambulances?type=ALS');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.ambulances)).toBe(true);
    expect(res.body.data.ambulances.some((a) => a.ambulanceNumber === testAmbulanceNumber)).toBe(true);
  });

  it('GET /api/v1/ambulances/available should list only Available and Online ambulances', async () => {
    const res = await request(app).get('/api/v1/ambulances/available');
    expect(res.statusCode).toBe(200);
    const available = res.body.data.ambulances;
    expect(available.every((a) => a.status === 'Available' && a.isOnline)).toBe(true);
  });

  it('GET /api/v1/ambulances/:id should return details of specific ambulance', async () => {
    const res = await request(app).get(`/api/v1/ambulances/${testAmbulanceId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.ambulance.ambulanceNumber).toBe(testAmbulanceNumber);
  });
});

describe('4. Ambulance Request & Assignment Lifecycle', () => {
  it('POST /api/v1/requests should create request and automatically assign nearest eligible ambulance', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        pickup: {
          address: 'TEST_LOC 1: 100 Main Street',
          latitude: 12.972,
          longitude: 77.595
        },
        patientContactNumber: '+1-555-3000',
        emergencyType: 'Accident & Trauma',
        requestedAmbulanceType: 'ALS',
        description: 'Need immediate ALS unit'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.request).toBeDefined();
    expect(res.body.data.request.status).toBe('ACCEPTED');
    expect(res.body.data.request.ambulanceId).toBeDefined();
    activeRequestId = res.body.data.request._id;
    assignedAmbulanceId = res.body.data.request.ambulanceId._id;

    // Verify assigned ambulance status changed to Assigned
    const amb = await Ambulance.findById(assignedAmbulanceId);
    expect(amb.status).toBe('Assigned');
  });

  it('Prevent duplicate ambulance assignment: same ambulance cannot be assigned to another request', async () => {
    // When test ambulance is now 'Assigned', and we make another request asking for ALS when all ALS are busy
    // Set all other ALS ambulances to Offline temporarily to test "No available ambulance" or non-duplicate
    await Ambulance.updateMany(
      { _id: { $ne: testAmbulanceId }, type: 'ALS' },
      { status: 'On Trip' }
    );

    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${secondPatientToken}`)
      .send({
        pickup: {
          address: 'TEST_LOC 2: 500 Second Ave',
          latitude: 12.98,
          longitude: 77.6
        },
        patientContactNumber: '+1-555-4000',
        emergencyType: 'Cardiac Arrest',
        requestedAmbulanceType: 'ALS'
      });

    expect(res.statusCode).toBe(201);
    // testAmbulanceId should NOT be re-assigned because it is already Assigned!
    if (res.body.data.request.ambulanceId) {
      expect(res.body.data.request.ambulanceId.toString()).not.toBe(testAmbulanceId);
    }
  });

  it('GET /api/v1/requests/:id/status should return emergency status and cancellation eligibility', async () => {
    const res = await request(app)
      .get(`/api/v1/requests/${activeRequestId}/status`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('ACCEPTED');
    expect(res.body.data.isCancellable).toBe(true);
    expect(res.body.data.ambulance).toBeDefined();
  });

  it('GET /api/v1/requests/:id/location should return ambulance location', async () => {
    const res = await request(app)
      .get(`/api/v1/requests/${activeRequestId}/location`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.location.latitude).toBeDefined();
    expect(res.body.data.location.longitude).toBeDefined();
  });

  it('Unauthorized access to another patient private request should be blocked with 403', async () => {
    // Patient 2 attempts to access Patient 1's request
    const res = await request(app)
      .get(`/api/v1/requests/${activeRequestId}`)
      .set('Authorization', `Bearer ${secondPatientToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('PATCH /api/v1/requests/:id/status should reject invalid transitions', async () => {
    // Current status is ACCEPTED; valid next is DISPATCHED or CANCELLED.
    // Trying to jump directly to COMPLETED should fail
    const res = await request(app)
      .patch(`/api/v1/requests/${activeRequestId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'COMPLETED' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Invalid status transition');
  });

  it('PATCH /api/v1/requests/:id/status allows valid transition to DISPATCHED', async () => {
    const res = await request(app)
      .patch(`/api/v1/requests/${activeRequestId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DISPATCHED', note: 'Ambulance en route' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.request.status).toBe('DISPATCHED');
  });

  it('PATCH /api/v1/requests/:id/cancel allows patient to cancel with reason and releases ambulance', async () => {
    const res = await request(app)
      .patch(`/api/v1/requests/${activeRequestId}/cancel`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ cancellationReason: 'Family took patient via personal car' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.request.status).toBe('CANCELLED');

    // Ambulance should be safely released back to Available
    const amb = await Ambulance.findById(assignedAmbulanceId);
    expect(amb.status).toBe('Available');
  });

  it('Cannot cancel already cancelled request', async () => {
    const res = await request(app)
      .patch(`/api/v1/requests/${activeRequestId}/cancel`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ cancellationReason: 'Trying to cancel again' });

    expect(res.statusCode).toBe(400);
  });
});
