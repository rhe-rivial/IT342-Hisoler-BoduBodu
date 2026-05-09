import { useEffect, useState, useCallback } from "react";
import "../admin/AdminPanel.css";

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

function diffClass(level = "") {
  const l = level.toLowerCase();
  if (l.includes("adv")) return "diff-advanced";
  if (l.includes("int")) return "diff-intermediate";
  return "diff-beginner";
}

// Notification Component
function Notification({ message, type, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className={`ap-notification ap-notification--${type}`}>
      {type === "success" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {message}
    </div>
  );
}

// Confirm Modal Component
function ConfirmModal({ title, message, confirmText = "Delete", onConfirm, onCancel }) {
  return (
    <div className="ap-overlay" onClick={onCancel}>
      <div className="ap-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ap-confirm-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="ap-confirm-btns">
          <button className="ap-btn ap-btn--outline" onClick={onCancel}>Cancel</button>
          <button className="ap-btn ap-btn--danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

// Exercise Modal (Add/Edit)
const MUSCLE_GROUPS = ["Chest", "Core", "Legs", "Back", "Arms", "Glutes", "Full Body", "Shoulders"];
const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

function ExerciseModal({ editData, onSave, onClose }) {
  const [form, setForm] = useState({
    name: editData?.name || "",
    description: editData?.description || "",
    difficultyLevel: editData?.difficultyLevel || "Beginner",
    targetMuscleGroup: editData?.targetMuscleGroup || "Core",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Exercise name is required.";
    if (form.name.trim().length > 100) e.name = "Name must be under 100 characters.";
    if (!form.description.trim()) e.description = "Description is required.";
    return e;
  }

  async function handleSave() {
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    setSaving(true);
    try {
      await onSave(form);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ap-overlay" onClick={onClose}>
      <div className="ap-modal" onClick={(ev) => ev.stopPropagation()}>
        <div className="ap-modal__header">
          <div className="ap-modal__header-left">
            <div className="ap-modal__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h2>{editData ? "Edit Exercise" : "Add Exercise"}</h2>
          </div>
          <button className="ap-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="ap-modal__body">
          <div className="ap-form-row">
            <label className="ap-label">Exercise Name <span className="ap-req">*</span></label>
            <input
              className={`ap-input${errors.name ? " ap-input--err" : ""}`}
              placeholder="e.g. Push Ups"
              value={form.name}
              onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((er) => ({ ...er, name: "" })); }}
            />
            {errors.name && <span className="ap-field-err">{errors.name}</span>}
          </div>

          <div className="ap-form-row ap-form-row--2col">
            <div>
              <label className="ap-label">Difficulty Level</label>
              <select className="ap-select" value={form.difficultyLevel} onChange={(e) => setForm((f) => ({ ...f, difficultyLevel: e.target.value }))}>
                {DIFFICULTY_LEVELS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="ap-label">Target Muscle Group</label>
              <select className="ap-select" value={form.targetMuscleGroup} onChange={(e) => setForm((f) => ({ ...f, targetMuscleGroup: e.target.value }))}>
                {MUSCLE_GROUPS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="ap-form-row">
            <label className="ap-label">Description <span className="ap-req">*</span></label>
            <textarea
              className={`ap-textarea${errors.description ? " ap-input--err" : ""}`}
              placeholder="Describe the exercise, technique, and tips…"
              rows={4}
              value={form.description}
              onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); setErrors((er) => ({ ...er, description: "" })); }}
            />
            {errors.description && <span className="ap-field-err">{errors.description}</span>}
          </div>
        </div>

        <div className="ap-modal__footer">
          <button className="ap-btn ap-btn--outline" onClick={onClose}>Cancel</button>
          <button className="ap-btn ap-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editData ? "Save Changes" : "Add Exercise"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main ExerciseLibrary Component
const FILTERS = ["All", ...MUSCLE_GROUPS];

function getAdminStatus() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const userRole = user?.role ? String(user.role).toUpperCase() : "";
    if (userRole.includes("ADMIN")) return true;
  } catch {}
  try {
    const token = localStorage.getItem("token") || "";
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const r = payload.role || payload.roles || payload.authorities || "";
      const rs = Array.isArray(r) ? r.join(",") : String(r);
      if (rs.toUpperCase().includes("ADMIN")) return true;
    }
  } catch {}
  return false;
}

function ExerciseLibrary() {
  const isAdmin = getAdminStatus();

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [notif, setNotif] = useState({ msg: "", type: "success" });

  const notify = useCallback((msg, type = "success") => setNotif({ msg, type }), []);

  // Fetch exercises from API
  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/exercises`);
      if (!res.ok) throw new Error("Failed to fetch exercises");
      const data = await res.json();
      setExercises(Array.isArray(data) ? data : data?.content || []);
    } catch (error) {
      notify("Failed to load exercises. Please try again.", "error");
      // Keep existing exercises if previously loaded
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  // Admin: Create or Update Exercise
  async function handleSaveExercise(form) {
    const url = editTarget
      ? `${BASE_URL}/api/admin/exercises/${editTarget.exerciseId}`
      : `${BASE_URL}/api/admin/exercises`;
    const method = editTarget ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to save exercise");
    }

    notify(editTarget ? "Exercise updated successfully!" : "Exercise created successfully!");
    setShowModal(false);
    setEditTarget(null);
    await fetchExercises();
  }

  // Admin: Delete Exercise
  async function handleDeleteExercise() {
    if (!delTarget) return;
    const id = delTarget.exerciseId;
    setDelTarget(null);

    try {
      const res = await fetch(`${BASE_URL}/api/admin/exercises/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete exercise");
      notify("Exercise deleted successfully.");
    } catch (error) {
      notify("Failed to delete exercise.", "error");
    }
    await fetchExercises();
  }

  const filteredExercises = exercises.filter((ex) => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || (ex.targetMuscleGroup || "").toLowerCase() === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  return (
    <div className="ap-page">
      <Notification
        message={notif.msg}
        type={notif.type}
        onClose={() => setNotif({ msg: "", type: "success" })}
      />

      {/* Header */}
      <div className="ap-page__header">
        <div>
          {isAdmin && (
            <div className="ap-admin-badge" style={{ marginBottom: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Admin
            </div>
          )}
          <h1 className="ap-page__title">Exercise Library</h1>
          <p className="ap-page__sub">
            {isAdmin
              ? "Manage exercises — add, edit, or remove from the library."
              : "Browse exercises and learn proper form."}
          </p>
        </div>

        {isAdmin && (
          <button
            className="ap-btn ap-btn--primary"
            onClick={() => { setEditTarget(null); setShowModal(true); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Exercise
          </button>
        )}
      </div>

      {/* Search */}
      <div className="ap-tab-toolbar">
        <div className="ap-search">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            placeholder="Search exercises…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="ap-filters">
        {FILTERS.slice(0, 8).map((f) => (
          <button
            key={f}
            className={`ap-filter-btn${filter === f ? " ap-filter-btn--active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="ap-loading"><div className="ap-spinner" /></div>
      ) : filteredExercises.length === 0 ? (
        <div className="ap-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <p>No exercises found.</p>
        </div>
      ) : (
        <div className="ap-card-grid">
          {filteredExercises.map((ex) => (
            <div key={ex.exerciseId} className="ap-card">
              <div className="ap-card__top">
                <div>
                  <div className="ap-card__name">{ex.name}</div>
                  <div className="ap-card__muscle">{ex.targetMuscleGroup || "—"}</div>
                </div>
                <span className={`ap-diff ${diffClass(ex.difficultyLevel)}`}>
                  {ex.difficultyLevel}
                </span>
              </div>

              {ex.description && (
                <div className="ap-card__desc">
                  {ex.description.length > 100
                    ? ex.description.slice(0, 100) + "…"
                    : ex.description}
                </div>
              )}

              {isAdmin && (
                <div className="ap-card__actions">
                  <button
                    className="ap-btn ap-btn--edit"
                    onClick={() => { setEditTarget(ex); setShowModal(true); }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5l3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    className="ap-btn ap-btn--delete"
                    onClick={() => setDelTarget(ex)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <ExerciseModal
          editData={editTarget}
          onSave={handleSaveExercise}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}
      {delTarget && (
        <ConfirmModal
          title="Delete Exercise"
          message={`Remove "${delTarget.name}" from the library? This cannot be undone.`}
          onConfirm={handleDeleteExercise}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}

export default ExerciseLibrary;