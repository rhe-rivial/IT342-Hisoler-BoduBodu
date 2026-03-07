import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const Dashboard = () => {

  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  if (!user) return null;

  return (
    <div className="dashboard">

      {/* WELCOME */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user.firstName}. Let’s push your limits today.</p>
      </div>

      {/* STATS */}
      <div className="stats-grid">

        <div className="stat-card">
          <h4>Total Workouts Completed</h4>
          <h2>0</h2>
          <span>All time sessions</span>
        </div>

        <div className="stat-card">
          <h4>Total Training Time</h4>
          <h2>0 min</h2>
          <span>Lifetime duration</span>
        </div>

        <div className="stat-card">
          <h4>Workouts This Week</h4>
          <h2>0</h2>
          <span>Keep building consistency</span>
        </div>

      </div>

      {/* QUICK ACTIONS */}
      <h2 className="section-title">Quick Actions</h2>

      <div className="quick-actions">

        <div className="quick-card">
          <h3>Browse Workouts</h3>
          <p>Explore structured workout programs by difficulty.</p>
          <button onClick={() => navigate("/workouts")}>
            View Workouts
          </button>
        </div>

        <div className="quick-card">
          <h3>Create Custom Workout</h3>
          <p>Build and personalize your own workout routine.</p>
          <button onClick={() => navigate("/workout-plans")}>
            Create Workout
          </button>
        </div>

        <div className="quick-card">
          <h3>Exercise Library</h3>
          <p>Review all available bodyweight exercises.</p>
          <button onClick={() => navigate("/exercise-library")}>
            View Exercises
          </button>
        </div>

      </div>

      {/* RECENT WORKOUTS */}
      <h2 className="section-title">Recent Workouts</h2>

      <div className="recent-workouts">

        <div className="recent-header">
          <span>Workout</span>
          <span>Type</span>
          <span>Duration</span>
          <span>Date</span>
        </div>

        <div className="recent-empty">
          No workouts recorded yet.
        </div>

      </div>

    </div>
  );
};

export default Dashboard;