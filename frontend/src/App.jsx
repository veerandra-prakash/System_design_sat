import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrototypeNoticeBanner from './components/PrototypeNoticeBanner';
import ProtectedRoute from './components/ProtectedRoute';

// 16 Pages
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import PatientDashboardPage from './pages/PatientDashboardPage';
import RequestAmbulancePage from './pages/RequestAmbulancePage';
import RequestConfirmationPage from './pages/RequestConfirmationPage';
import TrackingPage from './pages/TrackingPage';
import EmergencyStatusPage from './pages/EmergencyStatusPage';
import RequestHistoryPage from './pages/RequestHistoryPage';
import AmbulanceDetailsPage from './pages/AmbulanceDetailsPage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ManageAmbulancesPage from './pages/ManageAmbulancesPage';
import ManageRequestsPage from './pages/ManageRequestsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
          <PrototypeNoticeBanner />
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* 1. Landing page */}
              <Route path="/" element={<LandingPage />} />

              {/* 2. Register page */}
              <Route path="/register" element={<RegisterPage />} />

              {/* 3. Login page */}
              <Route path="/login" element={<LoginPage />} />

              {/* 4. Patient dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* 5. Request ambulance page */}
              <Route
                path="/request"
                element={
                  <ProtectedRoute allowedRoles={['patient', 'admin']}>
                    <RequestAmbulancePage />
                  </ProtectedRoute>
                }
              />

              {/* 6. Request confirmation page */}
              <Route
                path="/request/confirmation/:id"
                element={
                  <ProtectedRoute>
                    <RequestConfirmationPage />
                  </ProtectedRoute>
                }
              />

              {/* 7. Live ambulance tracking page */}
              <Route
                path="/track/:id"
                element={
                  <ProtectedRoute>
                    <TrackingPage />
                  </ProtectedRoute>
                }
              />

              {/* 8. Emergency status page */}
              <Route
                path="/status/:id"
                element={
                  <ProtectedRoute>
                    <EmergencyStatusPage />
                  </ProtectedRoute>
                }
              />

              {/* 9. Request history page */}
              <Route
                path="/history"
                element={
                  <ProtectedRoute allowedRoles={['patient', 'admin']}>
                    <RequestHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* 10. Ambulance details page */}
              <Route path="/ambulances/:id" element={<AmbulanceDetailsPage />} />

              {/* 11. Driver dashboard */}
              <Route
                path="/driver"
                element={
                  <ProtectedRoute allowedRoles={['driver', 'admin']}>
                    <DriverDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* 12. Admin dashboard */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* 13. Manage ambulances page */}
              <Route
                path="/admin/ambulances"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManageAmbulancesPage />
                  </ProtectedRoute>
                }
              />

              {/* 14. Manage emergency requests page */}
              <Route
                path="/admin/requests"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManageRequestsPage />
                  </ProtectedRoute>
                }
              />

              {/* 15. Profile page */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* 16. Not Found page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
