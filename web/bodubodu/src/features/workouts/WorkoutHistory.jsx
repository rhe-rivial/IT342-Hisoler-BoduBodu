import { useEffect, useState, useMemo } from "react";
import "./WorkoutHistory.css";

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

function formatDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(mins) {
  if (!mins && mins !== 0) return "—";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const TYPE_LABELS = {
  DEFAULT: "Default",
  CUSTOM:  "Custom",
};

const TYPE_COLORS = {
  DEFAULT: { bg: "#fff7ed", color: "#ea6e00" },
  CUSTOM:  { bg: "#f0fdf4", color: "#16a34a" },
};

/* ─── HistoryRow ──────────────────────────────────────────────── */
function HistoryRow({ workout }) {
  const rawType  = (workout.type || workout.workoutType || "DEFAULT").toUpperCase();
  const typeKey  = rawType.includes("CUSTOM") ? "CUSTOM" : "DEFAULT";
  const typeStyle = TYPE_COLORS[typeKey];

  return (
    <div className="wh-row">
      <div className="wh-row-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 4v6a6 6 0 0 0 12 0V4" />
          <line x1="4" y1="20" x2="20" y2="20" />
        </svg>
      </div>

      <div className="wh-row-main">
        <span className="wh-row-name">
          {workout.workoutName || workout.name || "Workout"}
        </span>
        <span className="wh-row-date">{formatDate(workout.completedAt)}</span>
      </div>

      <div className="wh-row-meta">
        <span
          className="wh-type-badge"
          style={{ background: typeStyle.bg, color: typeStyle.color }}
        >
          {TYPE_LABELS[typeKey]}
        </span>
        <span className="wh-duration">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {formatDuration(workout.duration)}
        </span>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function WorkoutHistory() {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | DEFAULT | CUSTOM

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/workout-history`, { headers: authHeaders() });
        if (res.ok) setHistory(await res.json());
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return history.filter(w => {
      const name    = (w.workoutName || w.name || "").toLowerCase();
      const rawType = (w.type || w.workoutType || "DEFAULT").toUpperCase();
      const typeKey = rawType.includes("CUSTOM") ? "CUSTOM" : "DEFAULT";

      const matchSearch = !q || name.includes(q);
      const matchType   = typeFilter === "ALL" || typeKey === typeFilter;

      return matchSearch && matchType;
    });
  }, [history, search, typeFilter]);

  /* group by month */
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(w => {
      const d   = w.completedAt ? new Date(w.completedAt) : null;
      const key = d
        ? d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(w);
    });
    return groups;
  }, [filtered]);

  const totalWorkouts  = history.length;
  const totalMinutes   = history.reduce((s, w) => s + (w.duration || 0), 0);
  const customCount    = history.filter(w => {
    const t = (w.type || w.workoutType || "").toUpperCase();
    return t.includes("CUSTOM");
  }).length;
  const defaultCount   = totalWorkouts - customCount;

  return (
    <div className="wh-page">

      {/* Header */}
      <div className="wh-header">
        <div>
          <h1 className="wh-title">Workout History</h1>
          <p className="wh-sub">Every session you've completed.</p>
        </div>
      </div>

      {/* Summary pills */}
      {!loading && (
        <div className="wh-summary">
          <div className="wh-pill">
            <span className="wh-pill-val">{totalWorkouts}</span>
            <span className="wh-pill-label">Total</span>
          </div>
          <div className="wh-pill-divider" />
          <div className="wh-pill">
            <span className="wh-pill-val">{defaultCount}</span>
            <span className="wh-pill-label">Default</span>
          </div>
          <div className="wh-pill-divider" />
          <div className="wh-pill">
            <span className="wh-pill-val">{customCount}</span>
            <span className="wh-pill-label">Custom</span>
          </div>
          <div className="wh-pill-divider" />
          <div className="wh-pill">
            <span className="wh-pill-val">{totalMinutes}</span>
            <span className="wh-pill-label">Total mins</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="wh-toolbar">
        <div className="wh-search-wrap">
          <svg className="wh-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="wh-search"
            type="text"
            placeholder="Search workouts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="wh-search-clear" onClick={() => setSearch("")} aria-label="Clear">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="wh-type-tabs">
          {["ALL", "DEFAULT", "CUSTOM"].map(t => (
            <button
              key={t}
              className={`wh-type-tab${typeFilter === t ? " active" : ""}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === "ALL" ? "All" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="wh-loading"><div className="ap-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="wh-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M6 4v6a6 6 0 0 0 12 0V4" />
            <line x1="4" y1="20" x2="20" y2="20" />
          </svg>
          <p>{search || typeFilter !== "ALL" ? "No workouts match your filters." : "No workouts logged yet."}</p>
        </div>
      ) : (
        <div className="wh-list">
          {Object.entries(grouped).map(([month, workouts]) => (
            <div key={month} className="wh-group">
              <div className="wh-group-label">
                <span>{month}</span>
                <span className="wh-group-count">{workouts.length} session{workouts.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="wh-group-rows">
                {workouts.map((w, i) => (
                  <HistoryRow key={w.id || i} workout={w} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}