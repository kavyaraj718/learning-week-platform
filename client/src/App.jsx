import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

import EmployeeLayout from './layouts/EmployeeLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Activities from './pages/Activities.jsx';
import ActivityDetail from './pages/ActivityDetail.jsx';
import Leaderboards from './pages/Leaderboards.jsx';
import Achievements from './pages/Achievements.jsx';
import UpcomingEvents from './pages/UpcomingEvents.jsx';
import Profile from './pages/Profile.jsx';

import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import ManageActivities from './pages/admin/ManageActivities.jsx';
import Registrations from './pages/admin/Registrations.jsx';
import WinnerSelection from './pages/admin/WinnerSelection.jsx';
import BulkUpload from './pages/admin/BulkUpload.jsx';
import PointsConfig from './pages/admin/PointsConfig.jsx';
import Integrations from './pages/admin/Integrations.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Employee portal */}
      <Route path="/app" element={<ProtectedRoute><EmployeeLayout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="activities" element={<Activities />} />
        <Route path="activities/:id" element={<ActivityDetail />} />
        <Route path="leaderboards" element={<Leaderboards />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="events" element={<UpcomingEvents />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Admin portal */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminAnalytics />} />
        <Route path="activities" element={<ManageActivities />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="winners" element={<WinnerSelection />} />
        <Route path="upload" element={<BulkUpload />} />
        <Route path="points" element={<PointsConfig />} />
        <Route path="integrations" element={<Integrations />} />
      </Route>

      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
