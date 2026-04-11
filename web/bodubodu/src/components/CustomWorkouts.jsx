import React, { useState, useEffect, useCallback } from 'react';
import '../styles/CustomWorkouts.css';

const BASE_URL = 'http://localhost:8080';

// ─── helpers ──────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('bb_token') || '';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

function diffClass(level = '') {
  const l = level.toLowerCase();
  if (l.includes('adv')) return 'diff-advanced';
  if (l.includes('int')) return 'diff-intermediate';
  return 'diff-beginner';
}

// ─── NOTIFICATION ─────────────────────────────────────────────────
function Notification({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  if (!message) return null;
  return (
    <div className={`cw-notification cw-notification--${type}`}>
      {message}
    </div>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="cw-overlay" onClick={onCancel}>
      <div className="cw-confirm-modal" onClick={e => e.stopPropagation()}>
        <h3>Confirm Delete</h3>
        <p>{message}</p>
        <div className="cw-confirm-btns">
          <button className="cw-btn cw-btn--outline" onClick={onCancel}>Cancel</button>
          <button className="cw-btn cw-btn--danger"  onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── BUILD MODAL ──────────────────────────────────────────────────
function BuildModal({ exercises, editData, onSave, onClose }) {
  const [name, setName]               = useState(editData ? editData.name : '');
  const [nameErr, setNameErr]         = useState('');
  const [exSearch, setExSearch]       = useState('');
  const [selected, setSelected]       = useState(
    editData
      ? editData.exercises.map(e => ({
          exerciseId:   e.exerciseId,
          name:         e.exerciseName || e.name || `Exercise ${e.exerciseId}`,
          sets:         e.sets,
          repetitions:  e.repetitions,
          restInterval: e.restInterval,
        }))
      : []
  );
  const [selErr, setSelErr]           = useState('');
  const [saving, setSaving]           = useState(false);

  const filteredExercises = exercises.filter(e =>
    e.name.toLowerCase().includes(exSearch.toLowerCase()) ||
    (e.targetMuscleGroup || '').toLowerCase().includes(exSearch.toLowerCase())
  );

  function toggleExercise(ex) {
    const id = ex.exerciseId || ex.id;
    setSelected(prev => {
      const exists = prev.findIndex(s => s.exerciseId === id);
      if (exists !== -1) {
        return prev.filter(s => s.exerciseId !== id);
      }
      return [...prev, { exerciseId: id, name: ex.name, sets: 3, repetitions: 10, restInterval: 30 }];
    });
    setSelErr('');
  }

  const FIELD_MAX = { sets: 8, repetitions: 100, restInterval: 420 };
  const FIELD_MIN = { sets: 1, repetitions: 1,   restInterval: 0   };

  // onChange: allow free typing, no clamp
  function updateField(i, field, value) {
    const raw = value === '' ? '' : Number(value);
    setSelected(prev => {
      const next = [...prev];
      if (field === 'sets') {
        return next.map(ex => ({ ...ex, sets: raw }));
      }
      next[i] = { ...next[i], [field]: raw };
      return next;
    });
  }

  // onBlur: clamp to min/max
  function clampField(i, field, value) {
    const raw = Number(value) || 0;
    const max = FIELD_MAX[field] ?? Infinity;
    const min = FIELD_MIN[field] ?? 0;
    const clamped = Math.min(max, Math.max(min, raw));
    setSelected(prev => {
      const next = [...prev];
      if (field === 'sets') {
        return next.map(ex => ({ ...ex, sets: clamped }));
      }
      next[i] = { ...next[i], [field]: clamped };
      return next;
    });
  }

  function removeSelected(i) {
    setSelected(prev => prev.filter((_, idx) => idx !== i));
  }

  function moveSelected(i, dir) {
    setSelected(prev => {
      const next = [...prev];
      const swapIdx = i + dir;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[i], next[swapIdx]] = [next[swapIdx], next[i]];
      return next;
    });
  }

  async function handleSave() {
    setNameErr(''); setSelErr('');
    let ok = true;
    if (!name.trim())         { setNameErr('Workout name is required.'); ok = false; }
    if (name.trim().length > 100) { setNameErr('Name must be under 100 characters.'); ok = false; }
    if (selected.length === 0){ setSelErr('Please select at least one exercise.'); ok = false; }
    let rowOk = true;
    selected.forEach(s => {
      if (s.sets < 1 || s.repetitions < 1 || s.restInterval < 0) rowOk = false;
    });
    if (!rowOk) { setSelErr('Sets/Reps must be ≥ 1 and Rest must be ≥ 0.'); ok = false; }
    if (!ok) return;

    setSaving(true);
    await onSave({
      name: name.trim(),
      exercises: selected.map(s => ({
        exerciseId:   s.exerciseId,
        sets:         s.sets,
        repetitions:  s.repetitions,
        restInterval: s.restInterval,
      })),
    });
    setSaving(false);
  }

  return (
    <div className="cw-overlay" onClick={onClose}>
      <div className="cw-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="cw-modal__header">
          <h2>{editData ? 'Edit Routine' : 'Build your Routine'}</h2>
          <button className="cw-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="cw-modal__body">

          {/* Workout Name */}
          <div className="cw-field">
            <input
              className={`cw-name-input${nameErr ? ' cw-input--err' : ''}`}
              placeholder="Workout Name"
              value={name}
              onChange={e => { setName(e.target.value); setNameErr(''); }}
            />
            {nameErr && <span className="cw-field-err">{nameErr}</span>}
          </div>

          {/* Exercise Browse */}
          <div className="cw-section-label">Browse Exercises</div>
          <div className="cw-ex-search">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search exercises…"
              value={exSearch}
              onChange={e => setExSearch(e.target.value)}
            />
          </div>

          <div className="cw-ex-grid">
            {filteredExercises.length === 0 && (
              <p className="cw-no-results">No exercises found.</p>
            )}
            {filteredExercises.map(ex => {
              const id = ex.exerciseId || ex.id;
              const isSelected = selected.some(s => s.exerciseId === id);
              return (
                <div
                  key={id}
                  className={`cw-ex-card${isSelected ? ' cw-ex-card--selected' : ''}`}
                  onClick={() => toggleExercise(ex)}
                >
                  <div className="cw-ex-card__name">{ex.name}</div>
                  <span className={`cw-diff ${diffClass(ex.difficultyLevel)}`}>
                    {ex.difficultyLevel || 'Beginner'}
                  </span>
                  <div className="cw-ex-card__muscle">{ex.targetMuscleGroup || ''}</div>
                </div>
              );
            })}
          </div>

          {/* Selected Exercises */}
          {selected.length > 0 && (
            <div className="cw-selected-section">
              <div className="cw-section-label">Configure Exercises</div>
              {selErr && <span className="cw-field-err">{selErr}</span>}
              {/* Column Headers */}
              <div className="cw-sel-header">
                <div className="cw-sel-header__spacer" />
                <div className="cw-sel-header__name" />
                <div className="cw-sel-header__col">Sets<span className="cw-col-max">max 8</span></div>
                <div className="cw-sel-header__col">Reps<span className="cw-col-max">max 100</span></div>
                <div className="cw-sel-header__col">Rest (Sec)<span className="cw-col-max">max 420</span></div>
                <div className="cw-sel-header__spacer" />
              </div>
              <div className="cw-selected-list">
                {selected.map((s, i) => (
                  <div key={i} className="cw-sel-row">
                    <div className="cw-sel-row__order">
                      <button
                        className="cw-order-btn"
                        onClick={() => moveSelected(i, -1)}
                        disabled={i === 0}
                        title="Move up"
                      >▲</button>
                      <span className="cw-order-num">{i + 1}</span>
                      <button
                        className="cw-order-btn"
                        onClick={() => moveSelected(i, 1)}
                        disabled={i === selected.length - 1}
                        title="Move down"
                      >▼</button>
                    </div>
                    <div className="cw-sel-row__name">{s.name}</div>
                    <input
                      type="number" min="1" max="8"
                      value={s.sets}
                      className={`cw-sel-input${Number(s.sets) < 1 ? ' cw-input--err' : ''}`}
                      onChange={e => updateField(i, 'sets', e.target.value)}
                      onBlur={e => clampField(i, 'sets', e.target.value)}
                    />
                    <input
                      type="number" min="1" max="100"
                      value={s.repetitions}
                      className={`cw-sel-input${Number(s.repetitions) < 1 ? ' cw-input--err' : ''}`}
                      onChange={e => updateField(i, 'repetitions', e.target.value)}
                      onBlur={e => clampField(i, 'repetitions', e.target.value)}
                    />
                    <input
                      type="number" min="0" max="420"
                      value={s.restInterval}
                      className={`cw-sel-input${Number(s.restInterval) < 0 ? ' cw-input--err' : ''}`}
                      onChange={e => updateField(i, 'restInterval', e.target.value)}
                      onBlur={e => clampField(i, 'restInterval', e.target.value)}
                    />
                    <button className="cw-remove-btn" onClick={() => removeSelected(i)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save */}
          <button
            className="cw-btn cw-btn--primary cw-btn--full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Workout'}
          </button>

        </div>
      </div>
    </div>
  );
}

// ─── EXERCISE DURATION FROM REPS TABLE ────────────────────────────
// Based on approximate set duration per rep range (image reference)
function durationFromReps(reps) {
  if (reps <= 5)  return 8;   // 5–10s avg
  if (reps <= 12) return 16;  // 12–20s avg
  if (reps <= 20) return 33;  // 25–40s avg
  if (reps <= 30) return 50;  // 40–60s avg
  if (reps <= 50) return 80;  // 60–100s avg
  if (reps <= 75) return 125; // 100–150s avg
  return 175;                 // 76–100: 150–200s avg
}

// ─── SESSION MODAL ────────────────────────────────────────────────
// Correct flow:
//   Set 1: ex1 → rest → ex2 → rest → ... → last ex → rest
//   Set 2: ex1 → rest → ex2 → rest → ... → last ex → (finish if last set)
// Set counter increments only AFTER completing ALL exercises in a set.
const CIRCUM = 427.26; // 2 * π * 68

function SessionModal({ workout, onClose }) {
  const exList    = workout.exercises || [];
  // All exercises share the same set count; use first exercise's sets value
  const totalSets = exList[0]?.sets || 1;

  // currentSet: which set we're currently on (1-indexed)
  // exIdx:      which exercise within the current set (0-indexed)
  // phase:      'exercise' | 'rest'
  const [currentSet, setCurrentSet] = useState(1);
  const [exIdx,      setExIdx]      = useState(0);
  const [phase,      setPhase]      = useState('exercise');
  const [secs,       setSecs]       = useState(null);
  const [timerKey,   setTimerKey]   = useState(0);
  const startTime = React.useRef(Date.now());

  const currentEx  = exList[exIdx] || {};
  const exName     = currentEx.exerciseName || currentEx.name || `Exercise ${exIdx + 1}`;
  const exDuration = durationFromReps(currentEx.repetitions || 10);
  const configRest = currentEx.restInterval ?? 30;

  const isLastEx  = exIdx === exList.length - 1;
  const isLastSet = currentSet === totalSets;

  // Reset timer whenever timerKey changes
  useEffect(() => {
    if (phase === 'exercise') setSecs(exDuration);
    else                      setSecs(configRest);
  }, [timerKey]); // eslint-disable-line

  // Countdown tick
  useEffect(() => {
    if (secs === null || secs <= 0) return;
    const t = setInterval(() => setSecs(s => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [secs !== null && secs > 0 ? timerKey : null, phase]); // eslint-disable-line

  // Auto-advance when timer reaches 0
  useEffect(() => {
    if (secs === 0) {
      const t = setTimeout(advancePhase, 600);
      return () => clearTimeout(t);
    }
  }, [secs]); // eslint-disable-line

  // ── Advance to next step in the flow ──────────────────────────
  function advancePhase() {
    if (phase === 'exercise') {
      // After exercise → always go to rest
      // Exception: very last exercise of very last set → finish
      if (isLastEx && isLastSet) {
        handleFinish();
        return;
      }
      setPhase('rest');
      setTimerKey(k => k + 1);
    } else {
      // After rest → move to next exercise
      if (isLastEx) {
        // Completed all exercises in this set → move to next set, restart exercises
        setCurrentSet(s => s + 1);
        setExIdx(0);
      } else {
        setExIdx(i => i + 1);
      }
      setPhase('exercise');
      setTimerKey(k => k + 1);
    }
  }

  // ── Manual nav: jump to a different exercise in current set ───
  function goToExercise(newIdx) {
    if (newIdx < 0 || newIdx >= exList.length) return;
    setExIdx(newIdx);
    setPhase('exercise');
    setTimerKey(k => k + 1);
  }

  // ── Timer display ──────────────────────────────────────────────
  const timerTotal = phase === 'exercise' ? exDuration : configRest;
  const safeSecs   = secs ?? timerTotal;
  const offset     = CIRCUM * (1 - safeSecs / (timerTotal || 1));
  const mm = String(Math.floor(safeSecs / 60)).padStart(2, '0');
  const ss = String(safeSecs % 60).padStart(2, '0');

  // Neighbour exercise names for nav labels
  const prevExName = exIdx > 0
    ? (exList[exIdx - 1]?.exerciseName || exList[exIdx - 1]?.name || '') : '';
  const nextExName = !isLastEx
    ? (exList[exIdx + 1]?.exerciseName || exList[exIdx + 1]?.name || '') : '';

  // What's coming up after the current rest
  const upNextName = isLastEx
    ? (isLastSet ? null : (exList[0]?.exerciseName || exList[0]?.name || ''))
    : (exList[exIdx + 1]?.exerciseName || exList[exIdx + 1]?.name || '');

  async function handleFinish() {
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    try {
      await fetch(`${BASE_URL}/api/user/sessions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          customWorkoutId: workout.customWorkoutId,
          completedAt: new Date().toISOString(),
          duration,
        }),
      });
    } catch (_) {}
    onClose(`Workout complete! (${Math.round(duration / 60)} min)`);
  }

  return (
    <div className="cw-overlay">
      <div className="cw-session-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="cw-modal__header">
          <div>
            <div className="cw-session-subtitle">Workout Session</div>
            <h2>{workout.name}</h2>
          </div>
          <button className="cw-modal__close" onClick={() => onClose()}>✕</button>
        </div>

        {/* ── Body ── */}
        <div className="cw-session-body">

          <div className="cw-session-video">
            <span>Exercise Video</span>
          </div>

          <div className="cw-session-content">

            {phase === 'exercise' ? (
              <>
                {/* Current set badge */}
                <div className="cw-set-badge">
                  Set {currentSet} / {totalSets}
                </div>

                {/* Exercise name */}
                <div className="cw-session-ex-name">{exName}</div>

                {/* Reps */}
                <div className="cw-session-sets">{currentEx.repetitions} reps</div>

                {/* Timer ring */}
                <div className="cw-timer-ring">
                  <svg viewBox="0 0 160 160" width="160" height="160">
                    <circle className="cw-circle-bg"   cx="80" cy="80" r="68" />
                    <circle className="cw-circle-prog" cx="80" cy="80" r="68"
                      strokeDasharray={CIRCUM} strokeDashoffset={offset} />
                  </svg>
                  <div className="cw-timer-text">
                    <span className="cw-timer-time">{mm}:{ss}</span>
                    <span className="cw-timer-lbl">seconds left</span>
                  </div>
                </div>

                {/* Done early button */}
                <button
                  className="cw-btn cw-btn--primary cw-session-done-btn"
                  onClick={advancePhase}
                >
                  {isLastEx && isLastSet ? 'Finish Workout ✓' : 'Done — Start Rest ▶'}
                </button>

                {/* Prev / progress / Next nav */}
                <div className="cw-nav-controls">
                  <div className="cw-nav-item">
                    <button className="cw-nav-btn"
                      onClick={() => goToExercise(exIdx - 1)}
                      disabled={exIdx === 0} title="Previous exercise">←</button>
                    <span className="cw-nav-label">{prevExName}</span>
                  </div>

                  <div className="cw-nav-center">
                    <div className="cw-session-progress">
                      {exIdx + 1}/{exList.length} Exercise
                    </div>
                  </div>

                  <div className="cw-nav-item">
                    <button className="cw-nav-btn"
                      onClick={() => goToExercise(exIdx + 1)}
                      disabled={isLastEx} title="Next exercise">→</button>
                    <span className="cw-nav-label">{nextExName}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* REST phase */}
                {/* Current set badge */}
                <div className="cw-set-badge">
                  Set {currentSet} / {totalSets}
                </div>

                <div className="cw-session-phase-label cw-phase-rest">Rest</div>

                {upNextName ? (
                  <div className="cw-session-rest-next">
                    Up next: <strong>{upNextName}</strong>
                    {isLastEx && !isLastSet && (
                      <span className="cw-next-set-hint"> (Set {currentSet + 1})</span>
                    )}
                  </div>
                ) : null}

                {/* Timer ring */}
                <div className="cw-timer-ring">
                  <svg viewBox="0 0 160 160" width="160" height="160">
                    <circle className="cw-circle-bg"              cx="80" cy="80" r="68" />
                    <circle className="cw-circle-prog cw-circle-rest" cx="80" cy="80" r="68"
                      strokeDasharray={CIRCUM} strokeDashoffset={offset} />
                  </svg>
                  <div className="cw-timer-text">
                    <span className="cw-timer-time cw-timer-time--rest">{mm}:{ss}</span>
                    <span className="cw-timer-lbl">rest left</span>
                  </div>
                </div>

                <button className="cw-btn cw-btn--outline cw-session-done-btn"
                  onClick={advancePhase}>
                  Skip Rest →
                </button>
              </>
            )}

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="cw-session-footer">
          <button className="cw-btn cw-btn--outline" onClick={() => onClose()}>Cancel</button>
          <button className="cw-btn cw-btn--success" onClick={handleFinish}>
            Finish &amp; Save
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── WORKOUT CARD ─────────────────────────────────────────────────
function WorkoutCard({ workout, onStart, onEdit, onDelete }) {
  const exList = workout.exercises || [];
  const created = workout.createdAt
    ? new Date(workout.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '–';

  return (
    <div className="cw-card">
      <div className="cw-card__name">{workout.name}</div>
      <div className="cw-card__meta">
        <span>{exList.length} exercise{exList.length !== 1 ? 's' : ''}</span>
        <span className="cw-card__dot" />
        <span>Created {created}</span>
      </div>
      <div className="cw-card__exercises">
        {exList.length === 0 && <span className="cw-card__empty">No exercises added</span>}
        {exList.slice(0, 3).map((e, i) => (
          <div key={i} className="cw-card__ex-item">
            {e.exerciseName || e.name || `Exercise ${e.exerciseId}`}
          </div>
        ))}
        {exList.length > 3 && (
          <span className="cw-card__more">+{exList.length - 3} more</span>
        )}
      </div>
      <div className="cw-card__actions">
        <button className="cw-btn cw-btn--start"  onClick={() => onStart(workout)}>Start</button>
        <button className="cw-btn cw-btn--edit"   onClick={() => onEdit(workout)}>Edit</button>
        <button className="cw-btn cw-btn--delete" onClick={() => onDelete(workout)}>Delete</button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function CustomWorkouts() {
  const [workouts,   setWorkouts]   = useState([]);
  const [exercises,  setExercises]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [showBuild,  setShowBuild]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);   // workout being edited
  const [session,    setSession]    = useState(null);   // workout in session
  const [delTarget,  setDelTarget]  = useState(null);   // workout pending delete
  const [notif,      setNotif]      = useState({ msg: '', type: 'success' });

  const notify = useCallback((msg, type = 'success') => {
    setNotif({ msg, type });
  }, []);

  // ── Load exercises (public) ──────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE_URL}/api/v1/exercises`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || data?.content || []);
        setExercises(list);
      })
      .catch(() => {
        // fallback exercises so UI can be demonstrated
        setExercises([
          { exerciseId: 1, name: 'Push Ups',            difficultyLevel: 'Beginner',     targetMuscleGroup: 'Chest' },
          { exerciseId: 2, name: 'Plank',               difficultyLevel: 'Beginner',     targetMuscleGroup: 'Core' },
          { exerciseId: 3, name: 'Squats',              difficultyLevel: 'Beginner',     targetMuscleGroup: 'Legs' },
          { exerciseId: 4, name: 'Mountain Climbers',   difficultyLevel: 'Intermediate', targetMuscleGroup: 'Core' },
          { exerciseId: 5, name: 'Lunges',              difficultyLevel: 'Beginner',     targetMuscleGroup: 'Legs' },
          { exerciseId: 6, name: 'Burpees',             difficultyLevel: 'Advanced',     targetMuscleGroup: 'Full Body' },
          { exerciseId: 7, name: 'Wide Push Up',        difficultyLevel: 'Intermediate', targetMuscleGroup: 'Chest' },
          { exerciseId: 8, name: 'Jump Squat',          difficultyLevel: 'Intermediate', targetMuscleGroup: 'Legs' },
          { exerciseId: 9, name: 'Bicycle Crunch',      difficultyLevel: 'Intermediate', targetMuscleGroup: 'Core' },
          { exerciseId: 10, name: 'Glute Bridges',      difficultyLevel: 'Beginner',     targetMuscleGroup: 'Glutes' },
          { exerciseId: 11, name: 'Tricep Dips',        difficultyLevel: 'Intermediate', targetMuscleGroup: 'Arms' },
          { exerciseId: 12, name: 'High Knees',         difficultyLevel: 'Beginner',     targetMuscleGroup: 'Full Body' },
        ]);
      });
  }, []);

  // ── Load custom workouts (protected) ────────────────────────────
  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/user/custom-workouts`, {
        headers: authHeaders(),
      });
      if (res.status === 401) {
        notify('Session expired. Please log in again.', 'error');
        setLoading(false);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.data || data?.content || []);
      setWorkouts(list);
    } catch {
      // offline: use localStorage
      const local = JSON.parse(localStorage.getItem('bb_local_workouts') || '[]');
      setWorkouts(local);
      notify('Backend unreachable – showing local data', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { loadWorkouts(); }, [loadWorkouts]);

  // ── Create / Update ──────────────────────────────────────────────
  async function handleSave(payload) {
    try {
      const url    = editTarget
        ? `${BASE_URL}/api/user/custom-workouts/${editTarget.customWorkoutId}`
        : `${BASE_URL}/api/user/custom-workouts`;
      const method = editTarget ? 'PUT' : 'POST';

      const res  = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();

      if (!res.ok) {
        notify(data?.message || 'Save failed', 'error');
        return;
      }
      notify(editTarget ? 'Workout updated!' : 'Workout created!');
      setShowBuild(false);
      setEditTarget(null);
      await loadWorkouts();
    } catch {
      // local fallback
      localSave(payload);
    }
  }

  function localSave(payload) {
    const local = JSON.parse(localStorage.getItem('bb_local_workouts') || '[]');
    if (editTarget) {
      const i = local.findIndex(w => w.customWorkoutId === editTarget.customWorkoutId);
      if (i !== -1) local[i] = { ...local[i], name: payload.name, exercises: payload.exercises };
    } else {
      local.push({
        customWorkoutId: Date.now(),
        name: payload.name,
        createdAt: new Date().toISOString(),
        exercises: payload.exercises.map(e => {
          const ex = exercises.find(x => (x.exerciseId || x.id) === e.exerciseId);
          return { ...e, exerciseName: ex ? ex.name : `Exercise ${e.exerciseId}` };
        }),
      });
    }
    localStorage.setItem('bb_local_workouts', JSON.stringify(local));
    setWorkouts(local);
    notify(editTarget ? 'Workout updated (local)!' : 'Workout saved locally!');
    setShowBuild(false);
    setEditTarget(null);
  }

  // ── Delete ───────────────────────────────────────────────────────
  async function handleDelete() {
    const id = delTarget.customWorkoutId;
    setDelTarget(null);
    try {
      const res = await fetch(`${BASE_URL}/api/user/custom-workouts/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      notify('Workout deleted.');
    } catch {
      const local = JSON.parse(localStorage.getItem('bb_local_workouts') || '[]')
        .filter(w => w.customWorkoutId !== id);
      localStorage.setItem('bb_local_workouts', JSON.stringify(local));
      notify('Workout deleted.');
    }
    await loadWorkouts();
  }

  // ── Filtered list ────────────────────────────────────────────────
  const filtered = workouts.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="cw-page">

      <Notification
        message={notif.msg}
        type={notif.type}
        onClose={() => setNotif({ msg: '', type: 'success' })}
      />

      {/* Page Header */}
      <div className="cw-page__header">
        <h1 className="cw-page__title">Custom Workouts</h1>
        <button className="cw-btn cw-btn--primary" onClick={() => { setEditTarget(null); setShowBuild(true); }}>
          + Create new
        </button>
      </div>

      {/* Search */}
      <div className="cw-toolbar">
        <div className="cw-search">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder="Search workouts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="cw-loading"><div className="cw-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="cw-empty">
          <svg width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <h3>{search ? 'No workouts found' : 'No custom workouts yet'}</h3>
          <p>{search ? 'Try a different search.' : 'Click "+ Create new" to build your first routine!'}</p>
        </div>
      ) : (
        <div className="cw-grid">
          {filtered.map(w => (
            <WorkoutCard
              key={w.customWorkoutId || w.id}
              workout={w}
              onStart={wk => setSession(wk)}
              onEdit={wk => { setEditTarget(wk); setShowBuild(true); }}
              onDelete={wk => setDelTarget(wk)}
            />
          ))}
        </div>
      )}

      {/* Build / Edit Modal */}
      {showBuild && (
        <BuildModal
          exercises={exercises}
          editData={editTarget}
          onSave={handleSave}
          onClose={() => { setShowBuild(false); setEditTarget(null); }}
        />
      )}

      {/* Session Modal */}
      {session && (
        <SessionModal
          workout={session}
          onClose={(msg) => {
            setSession(null);
            if (msg) notify(msg);
          }}
        />
      )}

      {/* Confirm Delete */}
      {delTarget && (
        <ConfirmModal
          message={`Delete "${delTarget.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}

    </div>
  );
}