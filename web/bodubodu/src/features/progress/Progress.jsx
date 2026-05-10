import { useEffect, useState, useMemo } from "react";
import "./Progress.css";

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

/* ─── helpers ─────────────────────────────────────────────────── */
function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* ─── StatCard ────────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="pg-stat-card" style={{ "--accent": accent }}>
      <div className="pg-stat-icon">{icon}</div>
      <div className="pg-stat-body">
        <div className="pg-stat-value">{value ?? "—"}</div>
        <div className="pg-stat-label">{label}</div>
        {sub && <div className="pg-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

/* ─── WorkoutCalendar ─────────────────────────────────────────── */
function WorkoutCalendar({ workoutDates }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const workoutSet = useMemo(() => new Set(workoutDates), [workoutDates]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDayOfMonth(viewYear, viewMonth);
  const todayKey    = toDateKey(today);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="pg-calendar">
      <div className="pg-cal-nav-row">
        <button className="pg-cal-nav" onClick={prevMonth} aria-label="Previous month">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="pg-cal-title">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button className="pg-cal-nav" onClick={nextMonth} aria-label="Next month">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="pg-cal-grid">
        {DAY_LABELS.map(d => (
          <div key={d} className="pg-cal-day-label">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="pg-cal-cell pg-cal-empty" />;
          const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday    = key === todayKey;
          const hasWorkout = workoutSet.has(key);
          return (
            <div
              key={key}
              className={[
                "pg-cal-cell",
                isToday    ? "pg-cal-today"  : "",
                hasWorkout ? "pg-cal-worked" : "",
              ].filter(Boolean).join(" ")}
              title={hasWorkout ? "Workout completed" : ""}
            >
              <span>{day}</span>
            </div>
          );
        })}
      </div>

      <div className="pg-cal-legend">
        <span className="pg-cal-legend-item">
          <span className="pg-cal-legend-dot pg-ld-worked" />
          Workout completed
        </span>
        <span className="pg-cal-legend-item">
          <span className="pg-cal-legend-dot pg-ld-today" />
          Today
        </span>
      </div>
    </div>
  );
}

/* ─── BarChart ────────────────────────────────────────────────── */
function BarChart({ data, color }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="pg-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="pg-bar-col">
          <span className="pg-bar-val">{d.value > 0 ? d.value : ""}</span>
          <div className="pg-bar-track">
            <div
              className="pg-bar-fill"
              style={{
                height: `${(d.value / max) * 100}%`,
                background: color,
                animationDelay: `${i * 50}ms`,
              }}
            />
          </div>
          <span className="pg-bar-x">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── RecentRow ───────────────────────────────────────────────── */
function RecentRow({ workout }) {
  const date = workout.completedAt
    ? new Date(workout.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";
  return (
    <div className="pg-recent-row">
      <div className="pg-recent-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 4v6a6 6 0 0 0 12 0V4" />
          <line x1="4" y1="20" x2="20" y2="20" />
        </svg>
      </div>
      <div className="pg-recent-info">
        <span className="pg-recent-name">{workout.workoutName || workout.name || "Workout"}</span>
        <span className="pg-recent-meta">
          {workout.duration ? `${workout.duration} min` : ""}
          {workout.duration && workout.exercises ? " · " : ""}
          {workout.exercises ? `${workout.exercises} exercises` : ""}
        </span>
      </div>
      <span className="pg-recent-date">{date}</span>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function Progress() {
  const [stats,   setStats]   = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [statsRes, historyRes] = await Promise.all([
          fetch(`${BASE_URL}/api/dashboard/stats`, { headers: authHeaders() }),
          fetch(`${BASE_URL}/api/dashboard/recent-workouts?limit=100`, { headers: authHeaders() }),
        ]);
        if (statsRes.ok)   setStats(await statsRes.json());
        if (historyRes.ok) setHistory(await historyRes.json());
      } catch {
        // silently fail — empty states handle it
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* calendar: set of "YYYY-MM-DD" strings */
  const workoutDates = useMemo(() =>
    history
      .filter(w => w.completedAt)
      .map(w => toDateKey(new Date(w.completedAt))),
    [history]
  );

  /* helper: get monday-anchored week start */
  function getWeekBuckets() {
    const now = new Date();
    const buckets = [];
    for (let i = 7; i >= 0; i--) {
      const anchor = new Date(now);
      anchor.setDate(anchor.getDate() - i * 7);
      const ws = new Date(anchor);
      ws.setDate(anchor.getDate() - anchor.getDay());
      ws.setHours(0, 0, 0, 0);
      buckets.push({ label: `W${8 - i}`, value: 0, start: new Date(ws) });
    }
    return buckets;
  }

  /* weekly workout count chart (last 8 weeks) */
  const weeklyData = useMemo(() => {
    const buckets = getWeekBuckets();
    history.forEach(w => {
      if (!w.completedAt) return;
      const d = new Date(w.completedAt);
      for (let b = buckets.length - 1; b >= 0; b--) {
        if (d >= buckets[b].start) { buckets[b].value++; break; }
      }
    });
    return buckets.map(({ label, value }) => ({ label, value }));
  }, [history]);

  /* weekly duration chart (last 8 weeks) */
  const durationData = useMemo(() => {
    const buckets = getWeekBuckets();
    history.forEach(w => {
      if (!w.completedAt || !w.duration) return;
      const d = new Date(w.completedAt);
      for (let b = buckets.length - 1; b >= 0; b--) {
        if (d >= buckets[b].start) { buckets[b].value += w.duration; break; }
      }
    });
    return buckets.map(({ label, value }) => ({ label, value }));
  }, [history]);

  /* total exercises from history fallback */
  const totalExercises = stats?.totalExercises
    ?? history.reduce((sum, w) => sum + (w.exercises || 0), 0);

  return (
    <div className="pg-page">

      <div className="pg-header">
        <h1 className="pg-title">Progress Tracker</h1>
        <p className="pg-sub">Your fitness journey at a glance.</p>
      </div>

      {loading ? (
        <div className="pg-loading"><div className="ap-spinner" /></div>
      ) : (
        <>
          {/* ── Stat Cards ── */}
          <div className="pg-stat-grid">
            <StatCard
              accent="#f97316"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              }
              label="Current Streak"
              value={`${stats?.currentStreak ?? 0}d`}
              sub="consecutive days"
            />
            <StatCard
              accent="#10b981"
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
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              label="This Week"
              value={stats?.workoutsThisWeek ?? 0}
              sub="workouts completed"
            />
            <StatCard
              accent="#ec4899"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
                  <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
                  <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
                  <path d="M19 10H5v4h14v-4z"/>
                </svg>
              }
              label="Exercises Done"
              value={totalExercises}
              sub="total logged"
            />
            <StatCard
              accent="#f59e0b"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              }
              label="Longest Streak"
              value={`${stats?.longestStreak ?? 0}d`}
              sub="personal best"
            />
          </div>

          {/* ── Calendar + Recent ── */}
          <div className="pg-two-col">
            <div className="pg-section">
              <h2 className="pg-section-title">Workout Calendar</h2>
              <WorkoutCalendar workoutDates={workoutDates} />
            </div>

            <div className="pg-section">
              <h2 className="pg-section-title">Recent Workouts</h2>
              {history.length === 0 ? (
                <div className="pg-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M6 4v6a6 6 0 0 0 12 0V4" />
                    <line x1="4" y1="20" x2="20" y2="20" />
                  </svg>
                  <p>No workouts logged yet.</p>
                </div>
              ) : (
                <div className="pg-recent-list">
                  {history.slice(0, 8).map((w, i) => (
                    <RecentRow key={w.id || i} workout={w} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Charts ── */}
          <div className="pg-two-col">
            <div className="pg-section">
              <h2 className="pg-section-title">Workouts per Week</h2>
              <p className="pg-section-sub">Last 8 weeks</p>
              <BarChart data={weeklyData} color="var(--primary)" />
            </div>

            <div className="pg-section">
              <h2 className="pg-section-title">Minutes per Week</h2>
              <p className="pg-section-sub">Last 8 weeks</p>
              <BarChart data={durationData} color="#3b82f6" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}