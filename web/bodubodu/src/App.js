import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AuthContainer from "./components/AuthContainer";
import DashboardLayout from "./components/DashboardLayout";

// Temporary placeholder pages 
const DashboardHome = () => <div><h2>Dashboard Overview</h2></div>;
const Workouts = () => <div><h2>Workouts</h2></div>;
const ExerciseLibrary = () => <div><h2>Exercise Library</h2></div>;
const WorkoutPlans = () => <div><h2>Workout Plans</h2></div>;
const Progress = () => <div><h2>Progress Tracker</h2></div>;

// 🔒 Protect routes (must be logged in)
function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");
  return user ? children : <Navigate to="/login" replace />;
}

// 🚪 Prevent logged-in users from going back to login/register
function PublicRoute({ children }) {
  const user = localStorage.getItem("user");
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthContainer />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthContainer />
            </PublicRoute>
          }
        />

        {/* Protected Layout */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/exercise-library" element={<ExerciseLibrary />} />
          <Route path="/workout-plans" element={<WorkoutPlans />} />
          <Route path="/progress" element={<Progress />} />
        </Route>

        {/* Default Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
