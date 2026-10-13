# AmbulanceConnect — Emergency Ambulance Service Management System 🚑🚨

> **Prototype Disclaimer Notice:** This application is an educational, full-stack software prototype. It is **NOT** a certified substitute for official emergency response numbers. In a genuine medical crisis, always dial your local national emergency services hotline (e.g., **911** in the US/Canada, **112** in Europe, or **108** in India). Dispatch times and distances are simulated calculations.

---

## 🌟 Overview & Architecture

**AmbulanceConnect** is a comprehensive, production-ready Emergency Ambulance Service Management System designed to bridge the critical gap between emergency distress calls, intelligent nearest-unit fleet dispatching, paramedic navigation, and hospital ER triage.

The system features:
- **Intelligent Nearest-Unit Assignment Algorithm:** Calculates real-time distance using the **Haversine formula**, filters by required medical acuity (Basic Life Support `BLS`, Advanced Life Support `ALS`, Intensive Care `ICU`), and executes an **atomic reservation** to eliminate concurrent duplicate bookings.
- **Live GPS Fleet Telemetry & Interactive Maps:** Powered by **Leaflet** and **OpenStreetMap**, displaying real-time vehicle movement, pickup beacons, destination hospitals, route polylines, and a simulated movement demo mode.
- **Real-Time WebSocket Sync:** Powered by **Socket.IO** rooms (`request:<id>`, `ambulance:<id>`, `room:admin`) for sub-second status transitions.
- **End-to-End Trip Lifecycle:** Enforcing strict server-side state transitions:
  `REQUESTED` ➔ `ACCEPTED` ➔ `DISPATCHED` ➔ `ARRIVING` ➔ `PATIENT_PICKED_UP` ➔ `COMPLETED` (plus `CANCELLED` and `REJECTED`).
- **Role-Based Access Control (RBAC):** Dedicated views and permissions for **Patients**, **Ambulance Drivers**, and **Chief Dispatcher Admins**.
- **Interactive Swagger Documentation & Postman Collection:** Complete OpenAPI 3.0 specs and ready-to-run Postman JSON collection.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, React Router v7, Axios, Lucide React, Leaflet, Socket.io-client |
| **Backend** | Node.js, Express.js, Socket.IO, Helmet, Morgan, Express-Rate-Limit, Express-Validator |
| **Database** | MongoDB with Mongoose ODM (Indexes, Schemas, Timestamps, Compound Queries) |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs password hashing |
| **Testing** | Jest, Supertest (20 Automated Unit & Integration Tests Passing) |
| **Documentation** | Swagger UI (`/api-docs`), OpenAPI 3.0, Postman Collection |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or higher (tested on Node v24)
- **npm**: v9 or higher
- **MongoDB**: Local MongoDB community server running on port `27017` or MongoDB Atlas URI.
  *(MongoDB Compass connection: `mongodb://localhost:27017`)*

---

### 2. Installation

Clone or open the repository root:
```bash
cd "c:\Users\Thiru kumaran v\Downloads\SD-project"
```

Install Backend Dependencies:
```bash
cd backend
npm install
```

Install Frontend Dependencies:
```bash
cd ../frontend
npm install
```

---

### 3. Environment Configuration

#### Backend Configuration (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ambulance_connect
JWT_SECRET=super_secret_jwt_key_ambulance_connect_2026_secure
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
```

#### Frontend Configuration (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

---

### 4. Database Seeding (Sample Data)

To populate the database with default administrative users, paramedic drivers, patient accounts, 5 ambulances with equipment, and initial requests:

```bash
cd backend
npm run seed
```

#### Default Test Accounts:
| Role | Email | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Chief Admin** | `admin@ambulance.com` | `admin123` | Full access to fleet, requests, analytics |
| **Driver 1** | `driver1@ambulance.com` | `driver123` | Assigned to `AMB-101` (ALS Unit) |
| **Driver 2** | `driver2@ambulance.com` | `driver123` | Assigned to `AMB-102` (ICU Unit) |
| **Driver 3** | `driver3@ambulance.com` | `driver123` | Assigned to `AMB-103` (BLS Unit) |
| **Patient** | `patient@ambulance.com` | `patient123` | Default patient caller |

> ⚡ **Tip:** You can also use the **"Test Personas"** dropdown in the top navigation bar to switch between Patient, Driver, and Admin in **1 click** without typing credentials!

---

### 5. Running the Application

Open two terminal windows:

#### Terminal 1 — Start the Backend Server:
```bash
cd backend
npm run dev
# Or: npm start
```
*Backend runs on `http://localhost:5000`*
- **Swagger Documentation:** `http://localhost:5000/api-docs`
- **Health Check Endpoint:** `http://localhost:5000/api/v1/health`

#### Terminal 2 — Start the Frontend Development Server:
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

### 6. Running Automated Tests

Run the full Jest & Supertest automated integration test suite:
```bash
cd backend
npm test
```
**Test Coverage Includes:**
- System Health check & MongoDB connectivity
- User registration, login, and rejection of invalid credentials
- Invalid, expired, and absent JWT token handling
- Role-based Access Control (RBAC) preventing unauthorized operations
- Ambulance listing, filtering, and availability checks
- Automatic Haversine nearest-ambulance assignment
- Duplicate ambulance assignment prevention
- Emergency status checks & cancellation eligibility
- Live GPS location retrieval
- Safe request cancellation and automatic vehicle release
- Validation preventing invalid status transitions

---

## 🧭 Step-by-Step Workflow Verification

Follow this end-to-end flow to verify the entire system:

1. **Open the Web Application:**
   Visit `http://localhost:5173` in your browser.
2. **Log In as a Patient:**
   Click **"Test Personas" ➔ "Patient User"** (or login with `patient@ambulance.com` / `patient123`).
3. **Submit an Ambulance Request:**
   - Click the red **"Request Ambulance"** button.
   - Choose Emergency Type (e.g. *Accident & Trauma*) and Ambulance Tier (*ALS*).
   - Click **"Detect My GPS Location"** (or use the prefilled coordinates).
   - Click **"CONFIRM & DISPATCH AMBULANCE NOW"**.
4. **Observe Instant Assignment:**
   - The Haversine algorithm scans available units, finds the nearest eligible unit (e.g., `AMB-101`), and locks the reservation.
   - You are redirected to the **Confirmation Screen**, showing the assigned vehicle, driver contact, and estimated arrival.
5. **Open Live Tracking Screen:**
   - Click **"Open Live Tracking Map"**.
   - Watch the Leaflet map display the ambulance icon, pickup marker, hospital pin, and dashed route polyline.
   - Click **"Simulate Step (Demo)"** to see the ambulance move closer along the route with live updates!
6. **Switch to Driver Console:**
   - In the navigation bar, click **"Test Personas" ➔ "Ambulance Driver"**.
   - Navigate to `/driver`.
   - See the active mission card with patient pickup details.
   - Click **"Start En Route (DISPATCHED)"** ➔ **"Mark Arrived at Scene (ARRIVING)"** ➔ **"Patient Onboard (PICKED UP)"** ➔ **"Transfer Complete (FINISH MISSION)"**.
7. **Verify Automatic Unit Release:**
   - Upon completion, the ambulance is automatically returned to `Available` in the fleet!
   - In the patient view (`/dashboard` and `/history`), the trip is recorded as `COMPLETED`.
8. **Inspect the Admin Dashboard:**
   - Click **"Test Personas" ➔ "Chief Admin"**.
   - Navigate to `/admin` to view live fleet metrics, aggregate emergency analytics, and the complete call queue.

---

## 📡 REST API Reference

Base URL: `/api/v1`

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` — Register a new patient/driver account.
- `POST /api/v1/auth/login` — Authenticate and receive JWT token.
- `GET /api/v1/auth/me` — Retrieve current authenticated profile.
- `PATCH /api/v1/auth/me` — Update name, phone, or next-of-kin contact.

### Ambulances (`/api/v1/ambulances`)
- `GET /api/v1/ambulances` — List & filter ambulances (`type`, `status`, `isOnline`).
- `GET /api/v1/ambulances/available` — List only online & available ambulances.
- `GET /api/v1/ambulances/:id` — Get ambulance specifications and assigned driver.
- `POST /api/v1/ambulances` — Register a new ambulance (*Admin only*).
- `PATCH /api/v1/ambulances/:id/status` — Update vehicle status (*Driver/Admin*).
- `PATCH /api/v1/ambulances/:id/location` — Update GPS coordinates (*Driver/Admin*).
- `POST /api/v1/ambulances/:id/simulate-move` — Simulated movement step for demo testing.

### Emergency Requests (`/api/v1/requests`)
- `POST /api/v1/requests` — Submit emergency request & trigger nearest assignment.
- `GET /api/v1/requests/my` — Get authenticated patient's request history.
- `GET /api/v1/requests/:id` — Get full request details.
- `GET /api/v1/requests/:id/status` — Get status timeline and cancellation eligibility.
- `PATCH /api/v1/requests/:id/status` — Update trip status (*Driver/Admin*).
- `PATCH /api/v1/requests/:id/cancel` — Cancel an active request with reason.
- `GET /api/v1/requests/:id/location` — Get assigned ambulance's last known GPS location.

### Admin Operations (`/api/v1/admin`)
- `GET /api/v1/admin/dashboard` — Fleet metrics and recent call logs (*Admin only*).
- `GET /api/v1/admin/requests` — Filterable emergency request records (*Admin only*).
- `GET /api/v1/admin/ambulances` — Full fleet inventory (*Admin only*).
- `GET /api/v1/admin/analytics` — Pathology & response time analytics (*Admin only*).

### System Health
- `GET /api/v1/health` — System uptime, MongoDB connectivity, and service status.

---

## 📮 Postman Collection

Import the included Postman collection into Postman:
- File location: `backend/postman/AmbulanceConnect.postman_collection.json`
- Includes pre-configured environment variables (`baseUrl`, `authToken`, `requestId`, `ambulanceId`) and automatic token extraction scripts!

---

## 🚢 Deployment Guidelines

### 1. Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow your server IP address (or `0.0.0.0/0` in Network Access).
3. Copy the Atlas SRV connection string:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/ambulance_connect?retryWrites=true&w=majority`
4. Set `MONGODB_URI` in your backend deployment environment variables.

### 2. Backend Deployment (Render / Railway / AWS EC2)
1. Set the Root Directory to `backend`.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set Environment Variables:
   - `PORT=5000` (or platform default `$PORT`)
   - `NODE_ENV=production`
   - `MONGODB_URI=<your_mongodb_uri>`
   - `JWT_SECRET=<strong_secret_key>`
   - `CLIENT_URL=https://your-frontend-domain.com`

### 3. Frontend Deployment (Vercel / Netlify)
1. Set the Root Directory to `frontend`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variables:
   - `VITE_API_URL=https://your-backend-api.com/api/v1`
   - `VITE_SOCKET_URL=https://your-backend-api.com`

---

## 📄 License
This project is open-source under the **ISC License**.
Built with precision for emergency response engineering.
