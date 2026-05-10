import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

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
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function Profile() {
  const navigate = useNavigate();

  /* ── state ── */
  const [user,        setUser]        = useState(null);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);

  const [firstName,   setFirstName]   = useState("");
  const [lastName,    setLastName]    = useState("");
  const [email,       setEmail]       = useState("");

  const [showPw,      setShowPw]      = useState(false);
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");

  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null); // { type: "success"|"error", msg }

  /* ── load ── */
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [userRes, statsRes] = await Promise.all([
          fetch(`${BASE_URL}/api/user/me`,          { headers: authHeaders() }),
          fetch(`${BASE_URL}/api/dashboard/stats`,  { headers: authHeaders() }),
        ]);
        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data);
          setFirstName(data.firstName || "");
          setLastName(data.lastName  || "");
          setEmail(data.email        || "");
          // keep localStorage fresh
          localStorage.setItem("user", JSON.stringify(data));
        }
        if (statsRes.ok) setStats(await statsRes.json());
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── toast helper ── */
  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── save account ── */
  async function handleSave(e) {
    e.preventDefault();

    // password validation
    if (showPw) {
      if (!currentPw) return showToast("error", "Please enter your current password.");
      if (newPw.length < 8) return showToast("error", "New password must be at least 8 characters.");
      if (newPw !== confirmPw) return showToast("error", "Passwords do not match.");
    }

    setSaving(true);
    try {
      const body = { firstName, lastName, email };
      if (showPw && newPw) {
        body.currentPassword = currentPw;
        body.newPassword     = newPw;
      }

      const res = await fetch(`${BASE_URL}/api/user/me`, {
        method:  "PUT",
        headers: authHeaders(),
        body:    JSON.stringify(body),
      });

      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        setShowPw(false);
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        showToast("success", "Account updated successfully.");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast("error", err.message || "Failed to update account.");
      }
    } catch {
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="pf-page">
        <div className="pf-loading"><div className="ap-spinner" /></div>
      </div>
    );
  }

  const fullName    = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "—";
  const memberSince = formatDate(user?.createdAt || user?.memberSince);

  return (
    <div className="pf-page">

      {/* Toast */}
      {toast && (
        <div className={`pf-toast pf-toast-${toast.type}`}>
          {toast.type === "success" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="pf-header">
        <h1 className="pf-title">My Profile</h1>
      </div>

      <div className="pf-grid">

        {/* ── Left: Account info ── */}
        <div className="pf-card">
          <div className="pf-card-heading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            Account information
          </div>

          <form className="pf-form" onSubmit={handleSave}>

            {/* Full name (read-only display row) */}
            <div className="pf-info-row">
              <div className="pf-info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="pf-info-body">
                <span className="pf-info-label">FULL NAME</span>
                <span className="pf-info-value">{fullName}</span>
              </div>
            </div>

            <div className="pf-divider" />

            {/* Email */}
            <div className="pf-info-row">
              <div className="pf-info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <polyline points="2,4 12,13 22,4" />
                </svg>
              </div>
              <div className="pf-info-body">
                <span className="pf-info-label">EMAIL ADDRESS</span>
                <input
                  className="pf-inline-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pf-divider" />

            {/* Member since */}
            <div className="pf-info-row">
              <div className="pf-info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8"  y1="2" x2="8"  y2="6" />
                  <line x1="3"  y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="pf-info-body">
                <span className="pf-info-label">MEMBER SINCE</span>
                <span className="pf-info-value">{memberSince}</span>
              </div>
            </div>

            <div className="pf-divider" />

            {/* Password section */}
            <div className="pf-pw-header">
              <span className="pf-pw-label">PASSWORD</span>
              {!showPw && (
                <button
                  type="button"
                  className="pf-pw-change-btn"
                  onClick={() => setShowPw(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5l3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Change
                </button>
              )}
            </div>

            {!showPw ? (
              <div className="pf-pw-dots-row">
                <input
                  className="pf-pw-dots"
                  type="password"
                  value="••••••••"
                  readOnly
                  tabIndex={-1}
                />
              </div>
            ) : (
              <div className="pf-pw-fields">
                <div className="pf-field">
                  <label className="pf-field-label">Current password</label>
                  <input
                    className="pf-input"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                  />
                </div>
                <div className="pf-field">
                  <label className="pf-field-label">New password</label>
                  <input
                    className="pf-input"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                  />
                </div>
                <div className="pf-field">
                  <label className="pf-field-label">Confirm new password</label>
                  <input
                    className="pf-input"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="pf-cancel-pw-btn"
                  onClick={() => { setShowPw(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
                >
                  Cancel
                </button>
              </div>
            )}

            {!showPw && (
              <p className="pf-pw-hint">Minimum 8 characters</p>
            )}

            <button
              type="submit"
              className="pf-save-btn"
              disabled={saving}
            >
              {saving ? (
                <span className="pf-btn-spinner" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {saving ? "Saving…" : "Update account"}
            </button>

          </form>
        </div>

        {/* ── Right: Fitness summary ── */}
        <div className="pf-right">
          <div className="pf-card">
            <div className="pf-card-heading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4"  />
                <line x1="6"  y1="20" x2="6"  y2="14" />
              </svg>
              Fitness summary
            </div>

            <div className="pf-summary-grid">
              <div className="pf-summary-stat">
                <span className="pf-summary-val">{stats?.totalWorkouts ?? 0}</span>
                <span className="pf-summary-label">total workouts</span>
              </div>
              <div className="pf-summary-stat">
                <span className="pf-summary-val">{stats?.totalMinutes ?? 0}</span>
                <span className="pf-summary-label">total minutes</span>
              </div>
              <div className="pf-summary-stat">
                <span className="pf-summary-val">{stats?.currentStreak ?? 0}<span className="pf-summary-unit">d</span></span>
                <span className="pf-summary-label">current streak</span>
              </div>
              <div className="pf-summary-stat">
                <span className="pf-summary-val">{stats?.workoutsThisWeek ?? 0}</span>
                <span className="pf-summary-label">this week</span>
              </div>
            </div>

            <div className="pf-divider" />

            <button
              className="pf-history-link"
              onClick={() => navigate("/workout-history")}
            >
              View full history
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}