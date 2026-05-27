import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import "../admin/AdminPanel.css";
import "./CustomWorkouts.css";

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

// Workout Modal (Add/Edit)
const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

function WorkoutModal({ editData, allExercises, onSave, onClose }) {
  const [form, setForm] = useState({
    name: editData?.name || "",
    description: editData?.description || "",
    difficultyLevel: editData?.difficultyLevel || "Beginner",
  });
  const [selected, setSelected] = useState(
    editData
      ? (editData.exercises || []).map((e) => ({
          exerciseId: e.exerciseId,
          name: e.exerciseName || e.name || `Exercise ${e.exerciseId}`,
          sets: e.sets || 3,
          repetitions: e.repetitions || 10,
          restInterval: e.restInterval || 30,
        }))
      : []
  );
  const [exSearch, setExSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  const filteredEx = allExercises.filter((e) =>
    e.name.toLowerCase().includes(exSearch.toLowerCase()) ||
    (e.targetMuscleGroup || "").toLowerCase().includes(exSearch.toLowerCase())
  );

  function toggleExercise(ex) {
    const id = ex.exerciseId || ex.id;
    setSelected((prev) => {
      const exists = prev.findIndex((s) => s.exerciseId === id);
      if (exists !== -1) return prev.filter((s) => s.exerciseId !== id);
      return [...prev, { exerciseId: id, name: ex.name, sets: 3, repetitions: 10, restInterval: 30 }];
    });
  }

  function updateField(i, field, value) {
    const raw = value === "" ? "" : Number(value);
    setSelected((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: raw };
      return next;
    });
  }

  const FIELD_MAX = { sets: 8, repetitions: 100, restInterval: 420 };
  const FIELD_MIN = { sets: 1, repetitions: 1, restInterval: 0 };

  function clampField(i, field, value) {
    const raw = Number(value) || 0;
    const clamped = Math.min(FIELD_MAX[field] ?? Infinity, Math.max(FIELD_MIN[field] ?? 0, raw));
    setSelected((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: clamped };
      return next;
    });
  }

  function reorderSelected(from, to) {
    if (from === null || Number.isNaN(from) || from === to) return;
    setSelected((prev) => {
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function handleDragStart(e, index) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }

  function handleDrop(e, index) {
    e.preventDefault();
    const from = dragIndex ?? Number(e.dataTransfer.getData("text/plain"));
    reorderSelected(from, index);
    setDragIndex(null);
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Workout name is required.";
    if (selected.length === 0) e.exercises = "Select at least one exercise.";
    return e;
  }

  async function handleSave() {
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    setSaveError("");
    setSaving(true);
    try {
      await onSave({
        ...form,
        exercises: selected.map((s) => ({
          exerciseId: s.exerciseId,
          sets: s.sets || 3,
          repetitions: s.repetitions || 10,
          restInterval: s.restInterval || 30,
        })),
      });
    } catch (error) {
      setSaveError(error.message || "Failed to save workout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ap-overlay" onClick={onClose}>
      <div className="ap-modal ap-modal--wide" onClick={(ev) => ev.stopPropagation()}>
        <div className="ap-modal__header">
          <div className="ap-modal__header-left">
            <div className="ap-modal__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" y1="20" x2="20" y2="20" />
              </svg>
            </div>
            <h2>{editData ? "Edit Workout" : "Create Default Workout"}</h2>
          </div>
          <button className="ap-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="ap-modal__body">
          <div className="ap-form-row ap-form-row--2col">
            <div>
              {/* <label className="ap-label">Workout Name <span className="ap-req">*</span></label> */}
              <input
                className={`ap-input${errors.name ? " ap-input--err" : ""}`}
                placeholder="e.g. Full Body Beginner"
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((er) => ({ ...er, name: "" })); }}
              />
              {errors.name && <span className="ap-field-err">{errors.name}</span>}
            </div>
            <div>
              {/* <label className="ap-label">Difficulty Level</label> */}
              <select
                className="ap-select"
                value={form.difficultyLevel}
                onChange={(e) => setForm((f) => ({ ...f, difficultyLevel: e.target.value }))}
              >
                {DIFFICULTY_LEVELS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="ap-form-row">
            {/* <label className="ap-label">Description</label> */}
            <textarea
              className="ap-textarea"
              placeholder="Describe this workout program…"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="ap-workout-builder">
            <div className="ap-ex-picker">
              <div className="ap-section-label">Browse Exercises</div>
              <div className="ap-ex-search">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input placeholder="Search…" value={exSearch} onChange={(e) => setExSearch(e.target.value)} />
              </div>
              <div className="ap-ex-list">
                {filteredEx.map((ex) => {
                  const id = ex.exerciseId || ex.id;
                  const isSel = selected.some((s) => s.exerciseId === id);
                  return (
                    <div
                      key={id}
                      className={`ap-ex-item${isSel ? " ap-ex-item--selected" : ""}`}
                      onClick={() => toggleExercise(ex)}
                    >
                      <div className="ap-ex-item__check">
                        {isSel && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div className="ap-ex-item__info">
                        <span className="ap-ex-item__name">{ex.name}</span>
                        <span className={`ap-diff ${diffClass(ex.difficultyLevel)}`}>{ex.difficultyLevel || "Beginner"}</span>
                      </div>
                      <span className="ap-ex-item__muscle">{ex.targetMuscleGroup || ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="ap-sel-config">
              <div className="ap-section-label">
                Selected Exercises
                {errors.exercises && <span className="ap-field-err" style={{ marginLeft: 8 }}>{errors.exercises}</span>}
              </div>
              {selected.length === 0 ? (
                <div className="ap-sel-empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <p>Click exercises on the left to add them</p>
                </div>
              ) : (
                <div className="ap-sel-rows ap-sel-rows--draggable">
                  <div className="ap-sel-header-row ap-sel-header-row--draggable">
                    <span></span><span>Exercise</span><span>Sets</span><span>Reps</span><span>Rest (s)</span><span></span>
                  </div>
                  {selected.map((s, i) => (
                    <div
                      key={s.exerciseId}
                      className={`ap-sel-row ap-sel-row--draggable${dragIndex === i ? " ap-sel-row--dragging" : ""}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, i)}
                      onDragEnd={() => setDragIndex(null)}
                    >
                      <button
                        type="button"
                        className="ap-drag-handle"
                        draggable
                        onDragStart={(e) => handleDragStart(e, i)}
                        title="Drag to reorder"
                      >
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                          <circle cx="5" cy="4" r="1.2" /><circle cx="11" cy="4" r="1.2" />
                          <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
                          <circle cx="5" cy="12" r="1.2" /><circle cx="11" cy="12" r="1.2" />
                        </svg>
                      </button>
                      <span className="ap-sel-row__name">{s.name}</span>
                      <input type="number" min="1" max="8" value={s.sets} className="ap-sel-input" onChange={(e) => updateField(i, "sets", e.target.value)} onBlur={(e) => clampField(i, "sets", e.target.value)} />
                      <input type="number" min="1" max="100" value={s.repetitions} className="ap-sel-input" onChange={(e) => updateField(i, "repetitions", e.target.value)} onBlur={(e) => clampField(i, "repetitions", e.target.value)} />
                      <input type="number" min="0" max="420" value={s.restInterval} className="ap-sel-input" onChange={(e) => updateField(i, "restInterval", e.target.value)} onBlur={(e) => clampField(i, "restInterval", e.target.value)} />
                      <button className="ap-remove-btn" onClick={() => setSelected((prev) => prev.filter((_, idx) => idx !== i))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ap-modal__footer">
          {saveError && <span className="ap-field-err" style={{ marginRight: "auto" }}>{saveError}</span>}
          <button className="ap-btn ap-btn--outline" onClick={onClose}>Cancel</button>
          <button className="ap-btn ap-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editData ? "Save Changes" : "Create Workout"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Session Modal
const CIRCUM = 427.26;

function durationFromReps(reps) {
  if (reps <= 5) return 8;
  if (reps <= 12) return 16;
  if (reps <= 20) return 33;
  if (reps <= 30) return 50;
  if (reps <= 50) return 80;
  if (reps <= 75) return 125;
  return 175;
}

function MediaPanel({ src }) {
  function keepPlaying(event) {
    const video = event.currentTarget;
    if (!video || video.ended) return;
    video.play().catch(() => {});
  }

  return (
    <div className="cw-session-video">
      {src ? (
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          controlsList="nodownload noplaybackrate noremoteplayback"
          disablePictureInPicture
          onClick={keepPlaying}
          onPause={keepPlaying}
          onContextMenu={(event) => event.preventDefault()}
        />
      ) : (
        <span>No exercise video available</span>
      )}
    </div>
  );
}

function SessionModal({ workout, onClose }) {
  const exList = workout.exercises || [];
  const totalSets = exList[0]?.sets || 1;

  const [currentSet, setCurrentSet] = useState(1);
  const [exIdx, setExIdx] = useState(0);
  const [phase, setPhase] = useState("exercise");
  const [secs, setSecs] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const startTime = useRef(Date.now());

  const currentEx = exList[exIdx] || {};
  const exName = currentEx.exerciseName || currentEx.name || `Exercise ${exIdx + 1}`;
  const media = currentEx.video || currentEx.image || "";
  const exDuration = durationFromReps(currentEx.repetitions || 10);
  const configRest = currentEx.restInterval ?? 30;
  const isLastEx = exIdx === exList.length - 1;
  const isLastSet = currentSet === totalSets;

  useEffect(() => {
    if (phase === "exercise") setSecs(exDuration);
    else setSecs(configRest);
  }, [timerKey]);

  useEffect(() => {
    if (secs === null || secs <= 0) return;
    const t = setInterval(() => setSecs((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [secs !== null && secs > 0 ? timerKey : null, phase]);

  useEffect(() => {
    if (secs === 0) {
      const t = setTimeout(advancePhase, 600);
      return () => clearTimeout(t);
    }
  }, [secs]);

  function advancePhase() {
    if (phase === "exercise") {
      if (isLastEx && isLastSet) { handleFinish(); return; }
      setPhase("rest");
      setTimerKey((k) => k + 1);
    } else {
      if (isLastEx) { setCurrentSet((s) => s + 1); setExIdx(0); }
      else setExIdx((i) => i + 1);
      setPhase("exercise");
      setTimerKey((k) => k + 1);
    }
  }

  const timerTotal = phase === "exercise" ? exDuration : configRest;
  const safeSecs = secs ?? timerTotal;
  const offset = CIRCUM * (1 - safeSecs / (timerTotal || 1));
  const mm = String(Math.floor(safeSecs / 60)).padStart(2, "0");
  const ss = String(safeSecs % 60).padStart(2, "0");

  async function handleFinish() {
    const duration = Math.round((Date.now() - startTime.current) / 60000); // minutes
    try {
      await fetch(`${BASE_URL}/api/dashboard/log-workout`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          workoutName:      workout.name,
          defaultWorkoutId: workout.defaultWorkoutId,
          customWorkoutId:  null,
          duration:         duration < 1 ? 1 : duration,
          exercises:        (workout.exercises || []).length,
          completedAt:      new Date().toISOString(),
        }),
      });
    } catch {}
    onClose(`Workout complete! (${duration < 1 ? 1 : duration} min)`);
  }

  return (
    <div className="cw-overlay">
      <div className="cw-session-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cw-modal__header">
          <div>
            <div className="cw-session-subtitle">Workout Session</div>
            <h2>{workout.name}</h2>
          </div>
          <button className="cw-modal__close" onClick={() => onClose()}>✕</button>
        </div>

        <div className="cw-session-body">
          <MediaPanel src={media} />

          <div className="cw-session-content">
            {phase === "exercise" ? (
              <>
                <div className="cw-set-badge">Set {currentSet} / {totalSets}</div>
                <div className="cw-session-ex-name">{exName}</div>
                <div className="cw-session-sets">{currentEx.repetitions} reps</div>
                <div className="cw-timer-ring">
                  <svg viewBox="0 0 160 160" width="160" height="160">
                    <circle className="cw-circle-bg" cx="80" cy="80" r="68" />
                    <circle className="cw-circle-prog" cx="80" cy="80" r="68"
                      strokeDasharray={CIRCUM} strokeDashoffset={offset} />
                  </svg>
                  <div className="cw-timer-text">
                    <span className="cw-timer-time">{mm}:{ss}</span>
                    <span className="cw-timer-lbl">seconds left</span>
                  </div>
                </div>
                <button className="cw-btn cw-btn--primary cw-session-done-btn" onClick={advancePhase}>
                  {isLastEx && isLastSet ? "Finish Workout ✓" : "Done — Start Rest ▶"}
                </button>
              </>
            ) : (
              <>
                <div className="cw-set-badge">Set {currentSet} / {totalSets}</div>
                <div className="cw-session-phase-label cw-phase-rest">Rest</div>
                <div className="cw-timer-ring">
                  <svg viewBox="0 0 160 160" width="160" height="160">
                    <circle className="cw-circle-bg" cx="80" cy="80" r="68" />
                    <circle className="cw-circle-prog cw-circle-rest" cx="80" cy="80" r="68"
                      strokeDasharray={CIRCUM} strokeDashoffset={offset} />
                  </svg>
                  <div className="cw-timer-text">
                    <span className="cw-timer-time cw-timer-time--rest">{mm}:{ss}</span>
                    <span className="cw-timer-lbl">rest left</span>
                  </div>
                </div>
                <button className="cw-btn cw-btn--outline cw-session-done-btn" onClick={advancePhase}>
                  Skip Rest →
                </button>
              </>
            )}
          </div>
        </div>

        <div className="cw-session-footer">
          <button className="cw-btn cw-btn--outline" onClick={() => onClose()}>Cancel</button>
          <button className="cw-btn cw-btn--success" onClick={handleFinish}>Finish & Save</button>
        </div>
      </div>
    </div>
  );
}

// Main DefaultWorkouts Component
const DIFF_FILTERS = ["All", "Beginner", "Intermediate", "Advanced"];

function DefaultWorkouts() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const rawRole = storedUser?.role ? String(storedUser.role).toUpperCase() : "";
  const isAdmin = rawRole.includes("ADMIN");

  const [workouts, setWorkouts] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [session, setSession] = useState(null);
  const [notif, setNotif] = useState({ msg: "", type: "success" });

  const notify = useCallback((msg, type = "success") => setNotif({ msg, type }), []);

  // Fetch workouts
  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/default-workouts`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch workouts");
      const data = await res.json();
      setWorkouts(Array.isArray(data) ? data : data?.content || []);
    } catch {
      notify("Failed to load workouts.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  // Fetch exercises for the workout builder
  const fetchExercises = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/exercises`);
      const data = await res.json();
      setAllExercises(Array.isArray(data) ? data : data?.content || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchWorkouts();
    if (isAdmin) fetchExercises();
  }, [fetchWorkouts, fetchExercises, isAdmin]);

  // Admin: Create or Update Workout
  async function handleSaveWorkout(form) {
    const url = editTarget
      ? `${BASE_URL}/api/admin/default-workouts/${editTarget.defaultWorkoutId}`
      : `${BASE_URL}/api/admin/default-workouts`;
    const method = editTarget ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to save workout");
    }

    notify(editTarget ? "Workout updated successfully!" : "Workout created successfully!");
    setShowModal(false);
    setEditTarget(null);
    await fetchWorkouts();
  }

  // Admin: Delete Workout
  async function handleDeleteWorkout() {
    if (!delTarget) return;
    const id = delTarget.defaultWorkoutId;
    setDelTarget(null);

    try {
      const res = await fetch(`${BASE_URL}/api/admin/default-workouts/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete workout");
      notify("Workout deleted successfully.");
    } catch {
      notify("Failed to delete workout.", "error");
    }
    await fetchWorkouts();
  }

  const filtered = useMemo(() => (
    workouts
      .filter((w) => {
        const matchSearch = w.name.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "All" || (w.difficultyLevel || "").toLowerCase() === filter.toLowerCase();
        return matchSearch && matchFilter;
      })
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }))
  ), [workouts, search, filter]);

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
          <h1 className="ap-page__title">Predefined Workouts</h1>
          <p className="ap-page__sub">
            {isAdmin
              ? "Manage the default workout library — create, edit, or remove workouts."
              : "Browse and start structured workouts."}
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
            Add Workout
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
            placeholder="Search workouts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Difficulty filters */}
      <div className="ap-filters">
        {DIFF_FILTERS.map((f) => (
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
      ) : filtered.length === 0 ? (
        <div className="ap-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" y1="20" x2="20" y2="20" />
          </svg>
          <p>No workouts found.</p>
        </div>
      ) : (
        <div className="ap-card-grid">
          {filtered.map((wk) => {
            const exList = wk.exercises || [];
            return (
              <div key={wk.defaultWorkoutId} className="ap-card">
                <div className="ap-card__top">
                  <div>
                    <div className="ap-card__name">{wk.name}</div>
                    <div className="ap-card__muscle" style={{ marginTop: 2 }}>
                      {exList.length} exercise{exList.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  {wk.difficultyLevel && (
                    <span className={`ap-diff ${diffClass(wk.difficultyLevel)}`}>{wk.difficultyLevel}</span>
                  )}
                </div>

                {wk.description && (
                  <div className="ap-card__desc">
                    {wk.description.length > 90 ? wk.description.slice(0, 90) + "…" : wk.description}
                  </div>
                )}

                <div className="ap-card__exercises">
                  {exList.slice(0, 3).map((e, i) => (
                    <div key={i} className="ap-card__ex-chip">
                      {e.exerciseName || e.name || `Exercise ${e.exerciseId}`}
                    </div>
                  ))}
                  {exList.length > 3 && (
                    <div className="ap-card__ex-chip ap-card__ex-chip--more">+{exList.length - 3} more</div>
                  )}
                </div>

                <div className="ap-card__actions">
                  <button
                    className="ap-btn ap-btn--primary"
                    style={{ flex: 1 }}
                    onClick={() => setSession(wk)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Start
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        className="ap-btn ap-btn--edit"
                        onClick={() => { setEditTarget(wk); setShowModal(true); }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5l3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        className="ap-btn ap-btn--delete"
                        onClick={() => setDelTarget(wk)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <WorkoutModal
          editData={editTarget}
          allExercises={allExercises}
          onSave={handleSaveWorkout}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}

      {session && (
        <SessionModal
          workout={session}
          onClose={(msg) => {
            setSession(null);
            if (msg) notify(msg);
          }}
        />
      )}

      {delTarget && (
        <ConfirmModal
          title="Delete Workout"
          message={`Remove "${delTarget.name}"? This cannot be undone.`}
          onConfirm={handleDeleteWorkout}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}

export default DefaultWorkouts;
