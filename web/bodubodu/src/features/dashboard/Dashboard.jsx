import { useEffect, useState } from "react";
import "./Dashboard.css";

const BASE_URL = "http://localhost:8080";

function getToken() {
  return localStorage.getItem("token") || "";
}
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="db-stat-card" style={{ "--accent": accent }}>
      <div className="db-stat-icon">{icon}</div>
      <div className="db-stat-body">
        <div className="db-stat-value">{value ?? "—"}</div>
        <div className="db-stat-label">{label}</div>
        {sub && <div className="db-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function RecentWorkout({ workout }) {
  const date = workout.completedAt
    ? new Date(workout.completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <div className="db-recent-row">
      <div className="db-recent-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 4v6a6 6 0 0 0 12 0V4" />
          <line x1="4" y1="20" x2="20" y2="20" />
        </svg>
      </div>
      <div className="db-recent-info">
        <span className="db-recent-name">{workout.workoutName || workout.name || "Workout"}</span>
        <span className="db-recent-meta">
          {workout.duration ? `${workout.duration} min` : ""}{workout.duration && workout.exercises ? " · " : ""}
          {workout.exercises ? `${workout.exercises} exercises` : ""}
        </span>
      </div>
      <span className="db-recent-date">{date}</span>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const firstName = user?.firstName || "there";

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [statsRes, recentRes] = await Promise.all([
          fetch(`${BASE_URL}/api/dashboard/stats`, { headers: authHeaders() }),
          fetch(`${BASE_URL}/api/dashboard/recent-workouts`, { headers: authHeaders() }),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (recentRes.ok) setRecent(await recentRes.json());
      } catch {
        // silently fail — empty state handles it
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="db-page">

      {/* Header */}
      <div className="db-header">
        <div>
          <h1 className="db-title">Dashboard</h1>
          <p className="db-sub">Here's your fitness overview, {firstName}.</p>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="db-loading">
          <div className="ap-spinner" />
        </div>
      ) : (
        <>
          <div className="db-stat-grid">
            <StatCard
              accent="#f97316"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 4v6a6 6 0 0 0 12 0V4" />
                  <line x1="4" y1="20" x2="20" y2="20" />
                </svg>
              }
              label="Total Workouts"
              value={stats?.totalWorkouts ?? 0}
              sub="all time"
            />
            <StatCard
              accent="#10b981"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              label="This Week"
              value={stats?.workoutsThisWeek ?? 0}
              sub="workouts completed"
            />
            <StatCard
              accent="#3b82f6"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              label="Total Minutes"
              value={stats?.totalMinutes ?? 0}
              sub="time exercising"
            />
            <StatCard
              accent="#a855f7"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              }
              label="Current Streak"
              value={`${stats?.currentStreak ?? 0}d`}
              sub="keep it up!"
            />
          </div>

          {/* Recent Workouts */}
          <div className="db-section">
            <div className="db-section-header">
              <h2 className="db-section-title">Recent Workouts</h2>
            </div>

            {recent.length === 0 ? (
              <div className="db-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M6 4v6a6 6 0 0 0 12 0V4" />
                  <line x1="4" y1="20" x2="20" y2="20" />
                </svg>
                <p>No workouts logged yet. Start your first workout!</p>
              </div>
            ) : (
              <div className="db-recent-list">
                {recent.slice(0, 5).map((w, i) => (
                  <RecentWorkout key={w.id || i} workout={w} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="db-section">
            <h2 className="db-section-title">Quick Actions</h2>
            <div className="db-actions-grid">
              <a href="/workouts" className="db-action-card">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 4v6a6 6 0 0 0 12 0V4" />
                  <line x1="4" y1="20" x2="20" y2="20" />
                </svg>
                <span>Browse Workouts</span>
              </a>
              <a href="/exercise-library" className="db-action-card">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>Exercise Library</span>
              </a>
              <a href="/workout-plans" className="db-action-card">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5l3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Custom Workouts</span>
              </a>
              <a href="/progress" className="db-action-card">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span>View Progress</span>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}