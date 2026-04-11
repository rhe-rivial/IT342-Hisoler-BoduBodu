import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:8080/api/user/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, []);

  if (!user) return null;

  return (
    <div className="dashboard">

      {/* ── Stats ── */}
      <p className="section-heading">Overview</p>
      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-card-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Total Workouts
          </div>
          <div className="stat-card-value">0</div>
          <div className="stat-card-sub">All-time sessions</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Training Time
          </div>
          <div className="stat-card-value">
            0 <span>min</span>
          </div>
          <div className="stat-card-sub">Lifetime duration</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            This Week
          </div>
          <div className="stat-card-value">
            0 <span>sessions</span>
          </div>
          <div className="stat-card-sub">Keep building consistency</div>
        </div>

      </div>

      {/* ── Quick Actions ── */}
      <p className="section-heading">Quick Actions</p>
      <div className="quick-actions">

        <div className="quick-card" onClick={() => navigate("/workouts")}>
          <div className="quick-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3>Browse Workouts</h3>
          <p>Explore structured workout programs by difficulty and goal.</p>
          <div className="quick-card-cta">
            View Workouts
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>

        <div className="quick-card" onClick={() => navigate("/workout-plans")}>
          <div className="quick-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <h3>Create Custom Workout</h3>
          <p>Build and personalize your own routine from scratch.</p>
          <div className="quick-card-cta">
            Create Workout
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>

        <div className="quick-card" onClick={() => navigate("/exercise-library")}>
          <div className="quick-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h3>Exercise Library</h3>
          <p>Review all available bodyweight and equipment exercises.</p>
          <div className="quick-card-cta">
            View Exercises
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>

      </div>

      {/* ── Recent Workouts ── */}
      <p className="section-heading">Recent Workouts</p>
      <div className="recent-workouts">
        <div className="recent-header">
          <span>Workout</span>
          <span>Type</span>
          <span>Duration</span>
          <span>Date Completed</span>
        </div>

        <div className="recent-empty">
          <div className="recent-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4v6a6 6 0 0 0 12 0V4" />
              <line x1="4" y1="20" x2="20" y2="20" />
            </svg>
          </div>
          <div className="recent-empty-title">No workouts recorded yet</div>
          <div className="recent-empty-sub">
            Complete your first workout to see your history here.
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;