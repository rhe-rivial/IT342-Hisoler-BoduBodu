import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AuthContainer from "./features/auth/AuthContainer";
import DashboardLayout from "./shared/components/DashboardLayout";
import CustomWorkouts from "./features/workouts/CustomWorkouts";
import AdminPanel from "./features/admin/AdminPanel";
import ExerciseLibrary from "./features/exercises/ExerciseLibrary";
import DefaultWorkouts from "./features/workouts/DefaultWorkouts";
import UserManagement from './features/admin/UserManagement';
import Dashboard from './features/dashboard/Dashboard';
import Progress from './features/progress/Progress';
import WorkoutHistory from './features/workouts/WorkoutHistory';
import Profile from './features/profile/Profile';

// Protect routes (must be logged in)
function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");
  return user ? children : <Navigate to="/login" replace />;
}

// Protect admin-only routes
function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const rawRole = user?.role ? String(user.role).toUpperCase() : "";
      if (rawRole.includes("ADMIN")) return children;
    }
  } catch (e) {
    console.warn("[AdminRoute] Failed to parse stored user:", e);
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    let r = payload.role || payload.roles || payload.authorities || "";
    if (Array.isArray(r)) {
      r = r.map((item) => (typeof item === "object" ? item.authority || "" : item)).join(",");
    }
    const rs = String(r).toUpperCase();
    if (rs.includes("ADMIN")) return children;
  } catch (e) {
    console.warn("[AdminRoute] Failed to decode JWT:", e);
  }

  return <Navigate to="/dashboard" replace />;
}

// Prevent logged-in users from going back to login/register
function PublicRoute({ children }) {
  const user = localStorage.getItem("user");
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/login"    element={<PublicRoute><AuthContainer /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><AuthContainer /></PublicRoute>} />

        {/* Protected Layout */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard"        element={<Dashboard />} />
          <Route path="/workouts"         element={<DefaultWorkouts />} />
          <Route path="/exercise-library" element={<ExerciseLibrary />} />
          <Route path="/workout-plans"    element={<CustomWorkouts />} />
          <Route path="/progress"         element={<Progress />} />
          <Route path="/workout-history"  element={<WorkoutHistory />} />
          <Route path="/profile"          element={<Profile />} />

          {/* Admin-only routes */}
          <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="/admin"       element={<AdminRoute><AdminPanel /></AdminRoute>} />
        </Route>

        {/* Default Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  );
}

export default App;