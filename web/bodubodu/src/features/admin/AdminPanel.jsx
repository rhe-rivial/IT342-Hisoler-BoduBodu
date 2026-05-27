import React, { useState, useEffect, useCallback } from 'react';
import './AdminPanel.css';

const BASE_URL = 'http://localhost:8080';
const SUPABASE_URL = (process.env.REACT_APP_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const SUPABASE_EXERCISE_BUCKET = process.env.REACT_APP_SUPABASE_EXERCISE_BUCKET || 'exercise-media';
const MAX_MEDIA_SIZE_MB = 100;

function getToken() {
  return localStorage.getItem('token') || '';
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

function sanitizeFileName(name = 'exercise-media') {
  const cleaned = name
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return cleaned || 'exercise-media';
}

async function uploadExerciseMedia(file, exerciseName) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase Storage is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const safeName = sanitizeFileName(exerciseName);
  const filePath = `exercises/${safeName}-${Date.now()}.${extension}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_EXERCISE_BUCKET}/${filePath}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: file,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload media to Supabase Storage.');
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_EXERCISE_BUCKET}/${filePath}`;
}

// ─── NOTIFICATION ─────────────────────────────────────────────────
function Notification({ message, type, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className={`ap-notification ap-notification--${type}`}>
      {type === 'success' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      )}
      {message}
    </div>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmText = 'Delete', onConfirm, onCancel }) {
  return (
    <div className="ap-overlay" onClick={onCancel}>
      <div className="ap-confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="ap-confirm-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
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

// ─── EXERCISE MODAL ───────────────────────────────────────────────
const MUSCLE_GROUPS = ['Chest', 'Core', 'Legs', 'Back', 'Arms', 'Glutes', 'Full Body', 'Shoulders'];
const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

function ExerciseModal({ editData, onSave, onClose }) {
  const mediaInputId = `admin-exercise-video-${editData?.exerciseId || editData?.id || 'new'}`;
  const [form, setForm] = useState({
    name: editData?.name || '',
    description: editData?.description || '',
    difficultyLevel: editData?.difficultyLevel || 'Beginner',
    targetMuscleGroup: editData?.targetMuscleGroup || 'Core',
    video: editData?.video || '',
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Exercise name is required.';
    if (form.name.trim().length > 100) e.name = 'Name must be under 100 characters.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (mediaFile) {
      const allowedTypes = ['video/mp4', 'image/gif'];
      const allowedExtensions = /\.(mp4|gif)$/i;
      const sizeMb = mediaFile.size / (1024 * 1024);

      if (!allowedTypes.includes(mediaFile.type) && !allowedExtensions.test(mediaFile.name)) {
        e.media = 'Upload an MP4 video or GIF file.';
      } else if (sizeMb > MAX_MEDIA_SIZE_MB) {
        e.media = `Media must be ${MAX_MEDIA_SIZE_MB}MB or smaller.`;
      }
    }
    return e;
  }

  function handleMediaFileChange(event) {
    const file = event.target.files?.[0] || null;
    setMediaFile(file);
    setErrors(er => ({ ...er, media: '' }));
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      let videoUrl = form.video;

      if (mediaFile) {
        videoUrl = await uploadExerciseMedia(mediaFile, form.name);
      }

      await onSave({ ...form, video: videoUrl });
    } catch (error) {
      setErrors(er => ({ ...er, media: error.message || 'Failed to save exercise.' }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ap-overlay" onClick={onClose}>
      <div className="ap-modal" onClick={ev => ev.stopPropagation()}>
        <div className="ap-modal__header">
          <div className="ap-modal__header-left">
            <div className="ap-modal__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h2>{editData ? 'Edit Exercise' : 'Add Exercise'}</h2>
          </div>
          <button className="ap-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="ap-modal__body">
          <div className="ap-form-row">
            <label className="ap-label">Exercise Name <span className="ap-req">*</span></label>
            <input
              className={`ap-input${errors.name ? ' ap-input--err' : ''}`}
              placeholder="e.g. Push Ups"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
            />
            {errors.name && <span className="ap-field-err">{errors.name}</span>}
          </div>

          <div className="ap-form-row ap-form-row--2col">
            <div>
              <label className="ap-label">Difficulty Level</label>
              <select
                className="ap-select"
                value={form.difficultyLevel}
                onChange={e => setForm(f => ({ ...f, difficultyLevel: e.target.value }))}
              >
                {DIFFICULTY_LEVELS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="ap-label">Target Muscle Group</label>
              <select
                className="ap-select"
                value={form.targetMuscleGroup}
                onChange={e => setForm(f => ({ ...f, targetMuscleGroup: e.target.value }))}
              >
                {MUSCLE_GROUPS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="ap-form-row">
            <label className="ap-label">Description <span className="ap-req">*</span></label>
            <textarea
              className={`ap-textarea${errors.description ? ' ap-input--err' : ''}`}
              placeholder="Describe the exercise, technique, and tips…"
              rows={4}
              value={form.description}
              onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(er => ({ ...er, description: '' })); }}
            />
            {errors.description && <span className="ap-field-err">{errors.description}</span>}
          </div>

          <div className="ap-form-row">
            <label className="ap-label">Exercise Video</label>
            <label className={`ap-file-upload${errors.media ? ' ap-input--err' : ''}`} htmlFor={mediaInputId}>
              <input
                id={mediaInputId}
                type="file"
                accept="video/mp4,image/gif,.mp4,.gif"
                onChange={handleMediaFileChange}
              />
              <span className="ap-file-upload__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M17 8l-5-5-5 5" />
                  <path d="M12 3v12" />
                </svg>
              </span>
              <span className="ap-file-upload__text">
                {mediaFile ? mediaFile.name : 'Choose MP4 or GIF file'}
              </span>
            </label>
            {mediaFile && (
              <span className="ap-field-hint">
                This file will upload to Supabase Storage when you save.
              </span>
            )}
            {!mediaFile && form.video && (
              <span className="ap-field-hint">
                Current uploaded video will stay saved unless you choose a new file.
              </span>
            )}
            {errors.media && <span className="ap-field-err">{errors.media}</span>}
          </div>
        </div>

        <div className="ap-modal__footer">
          <button className="ap-btn ap-btn--outline" onClick={onClose}>Cancel</button>
          <button className="ap-btn ap-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editData ? 'Save Changes' : 'Add Exercise'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WORKOUT MODAL ────────────────────────────────────────────────
function WorkoutModal({ editData, exercises, onSave, onClose }) {
  const [form, setForm] = useState({
    name: editData?.name || '',
    description: editData?.description || '',
    difficultyLevel: editData?.difficultyLevel || 'Beginner',
  });
  const [selected, setSelected] = useState(
    editData
      ? (editData.exercises || []).map(e => ({
          exerciseId: e.exerciseId,
          name: e.exerciseName || e.name || `Exercise ${e.exerciseId}`,
          sets: e.sets || 3,
          repetitions: e.repetitions || 10,
          restInterval: e.restInterval || 30,
        }))
      : []
  );
  const [exSearch, setExSearch] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const filteredEx = exercises.filter(e =>
    e.name.toLowerCase().includes(exSearch.toLowerCase()) ||
    (e.targetMuscleGroup || '').toLowerCase().includes(exSearch.toLowerCase())
  );

  function toggleExercise(ex) {
    const id = ex.exerciseId || ex.id;
    setSelected(prev => {
      const exists = prev.findIndex(s => s.exerciseId === id);
      if (exists !== -1) return prev.filter(s => s.exerciseId !== id);
      return [...prev, { exerciseId: id, name: ex.name, sets: 3, repetitions: 10, restInterval: 30 }];
    });
  }

  function updateField(i, field, value) {
    setSelected(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value === '' ? '' : Number(value) };
      return next;
    });
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Workout name is required.';
    if (selected.length === 0) e.exercises = 'Select at least one exercise.';
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    await onSave({
      ...form,
      exercises: selected.map(s => ({
        exerciseId: s.exerciseId,
        sets: s.sets || 3,
        repetitions: s.repetitions || 10,
        restInterval: s.restInterval || 30,
      })),
    });
    setSaving(false);
  }

  return (
    <div className="ap-overlay" onClick={onClose}>
      <div className="ap-modal ap-modal--wide" onClick={ev => ev.stopPropagation()}>
        <div className="ap-modal__header">
          <div className="ap-modal__header-left">
            <div className="ap-modal__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/>
              </svg>
            </div>
            <h2>{editData ? 'Edit Workout' : 'Create Workout'}</h2>
          </div>
          <button className="ap-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="ap-modal__body">
          <div className="ap-form-row ap-form-row--2col">
            <div>
              <label className="ap-label">Workout Name <span className="ap-req">*</span></label>
              <input
                className={`ap-input${errors.name ? ' ap-input--err' : ''}`}
                placeholder="e.g. Full Body Beginner"
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
              />
              {errors.name && <span className="ap-field-err">{errors.name}</span>}
            </div>
            <div>
              <label className="ap-label">Difficulty Level</label>
              <select
                className="ap-select"
                value={form.difficultyLevel}
                onChange={e => setForm(f => ({ ...f, difficultyLevel: e.target.value }))}
              >
                {DIFFICULTY_LEVELS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="ap-form-row">
            <label className="ap-label">Description</label>
            <textarea
              className="ap-textarea"
              placeholder="Describe this workout program…"
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="ap-workout-builder">
            {/* Left: exercise picker */}
            <div className="ap-ex-picker">
              <div className="ap-section-label">Browse Exercises</div>
              <div className="ap-ex-search">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input placeholder="Search…" value={exSearch} onChange={e => setExSearch(e.target.value)} />
              </div>
              <div className="ap-ex-list">
                {filteredEx.map(ex => {
                  const id = ex.exerciseId || ex.id;
                  const isSelected = selected.some(s => s.exerciseId === id);
                  return (
                    <div
                      key={id}
                      className={`ap-ex-item${isSelected ? ' ap-ex-item--selected' : ''}`}
                      onClick={() => toggleExercise(ex)}
                    >
                      <div className="ap-ex-item__check">
                        {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div className="ap-ex-item__info">
                        <span className="ap-ex-item__name">{ex.name}</span>
                        <span className={`ap-diff ${diffClass(ex.difficultyLevel)}`}>{ex.difficultyLevel || 'Beginner'}</span>
                      </div>
                      <span className="ap-ex-item__muscle">{ex.targetMuscleGroup || ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: configure selected */}
            <div className="ap-sel-config">
              <div className="ap-section-label">
                Selected Exercises
                {errors.exercises && <span className="ap-field-err" style={{ marginLeft: 8 }}>{errors.exercises}</span>}
              </div>
              {selected.length === 0 ? (
                <div className="ap-sel-empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  <p>Click exercises on the left to add them</p>
                </div>
              ) : (
                <div className="ap-sel-rows">
                  <div className="ap-sel-header-row">
                    <span>Exercise</span><span>Sets</span><span>Reps</span><span>Rest (s)</span><span></span>
                  </div>
                  {selected.map((s, i) => (
                    <div key={i} className="ap-sel-row">
                      <span className="ap-sel-row__name">{s.name}</span>
                      <input type="number" min="1" max="8"   value={s.sets}        className="ap-sel-input" onChange={e => updateField(i, 'sets', e.target.value)} />
                      <input type="number" min="1" max="100" value={s.repetitions} className="ap-sel-input" onChange={e => updateField(i, 'repetitions', e.target.value)} />
                      <input type="number" min="0" max="420" value={s.restInterval}className="ap-sel-input" onChange={e => updateField(i, 'restInterval', e.target.value)} />
                      <button className="ap-remove-btn" onClick={() => setSelected(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ap-modal__footer">
          <button className="ap-btn ap-btn--outline" onClick={onClose}>Cancel</button>
          <button className="ap-btn ap-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editData ? 'Save Changes' : 'Create Workout'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── USER MODAL (Edit role / view) ────────────────────────────────
function UserModal({ user, onSave, onClose }) {
  const [role, setRole] = useState(user.role || 'USER');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({ ...user, role });
    setSaving(false);
  }

  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div className="ap-overlay" onClick={onClose}>
      <div className="ap-modal ap-modal--sm" onClick={ev => ev.stopPropagation()}>
        <div className="ap-modal__header">
          <div className="ap-modal__header-left">
            <div className="ap-modal__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h2>Edit User</h2>
          </div>
          <button className="ap-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="ap-modal__body">
          <div className="ap-user-info-block">
            <div className="ap-user-avatar-lg">
              {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <div className="ap-user-fullname">{user.firstName} {user.lastName}</div>
              <div className="ap-user-email-display">{user.email}</div>
              <div className="ap-user-joined">Member since {joined}</div>
            </div>
          </div>

          <div className="ap-form-row">
            <label className="ap-label">Role</label>
            <select className="ap-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        <div className="ap-modal__footer">
          <button className="ap-btn ap-btn--outline" onClick={onClose}>Cancel</button>
          <button className="ap-btn ap-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EXERCISES TAB ────────────────────────────────────────────────
function ExercisesTab({ notify }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [delTarget, setDelTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/exercises`, { headers: authHeaders() });
      const data = await res.json();
      setExercises(Array.isArray(data) ? data : (data?.data || data?.content || FALLBACK_EXERCISES));
    } catch {
      setExercises(FALLBACK_EXERCISES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(form) {
    try {
      const url = editTarget
        ? `${BASE_URL}/api/admin/exercises/${editTarget.exerciseId}`
        : `${BASE_URL}/api/admin/exercises`;
      const method = editTarget ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      notify(editTarget ? 'Exercise updated!' : 'Exercise added!', 'success');
    } catch {
      notify(editTarget ? 'Exercise updated (local).' : 'Exercise added (local).', 'success');
      if (editTarget) {
        setExercises(prev => prev.map(e => e.exerciseId === editTarget.exerciseId ? { ...e, ...form } : e));
      } else {
        setExercises(prev => [...prev, { ...form, exerciseId: Date.now() }]);
      }
    }
    setShowModal(false);
    setEditTarget(null);
    await load();
  }

  async function handleDelete() {
    const id = delTarget.exerciseId;
    setDelTarget(null);
    try {
      await fetch(`${BASE_URL}/api/admin/exercises/${id}`, { method: 'DELETE', headers: authHeaders() });
    } catch {}
    setExercises(prev => prev.filter(e => e.exerciseId !== id));
    notify('Exercise deleted.', 'success');
  }

  const FILTERS = ['All', ...MUSCLE_GROUPS];
  const filtered = exercises.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || (e.targetMuscleGroup || '').toLowerCase() === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  return (
    <div className="ap-tab-content">
      <div className="ap-tab-toolbar">
        <div className="ap-search">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input placeholder="Search exercises…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="ap-btn ap-btn--primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Exercise
        </button>
      </div>

      <div className="ap-filters">
        {FILTERS.slice(0, 7).map(f => (
          <button
            key={f}
            className={`ap-filter-btn${filter === f ? ' ap-filter-btn--active' : ''}`}
            onClick={() => setFilter(f)}
          >{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="ap-loading"><div className="ap-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="ap-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <p>No exercises found</p>
        </div>
      ) : (
        <div className="ap-card-grid">
          {filtered.map(ex => (
            <div key={ex.exerciseId} className="ap-card">
              <div className="ap-card__top">
                <div className="ap-card__name">{ex.name}</div>
                <span className={`ap-diff ${diffClass(ex.difficultyLevel)}`}>{ex.difficultyLevel || 'Beginner'}</span>
              </div>
              <div className="ap-card__muscle">{ex.targetMuscleGroup || '—'}</div>
              {ex.description && (
                <div className="ap-card__desc">{ex.description.length > 80 ? ex.description.slice(0, 80) + '…' : ex.description}</div>
              )}
              <div className="ap-card__actions">
                <button className="ap-btn ap-btn--edit" onClick={() => { setEditTarget(ex); setShowModal(true); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5l3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button className="ap-btn ap-btn--delete" onClick={() => setDelTarget(ex)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ExerciseModal
          editData={editTarget}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}
      {delTarget && (
        <ConfirmModal
          title="Delete Exercise"
          message={`Remove "${delTarget.name}" from the library? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}

// ─── WORKOUTS TAB ─────────────────────────────────────────────────
function WorkoutsTab({ notify }) {
  const [workouts, setWorkouts]   = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [delTarget, setDelTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, eRes] = await Promise.all([
        fetch(`${BASE_URL}/api/v1/workouts`, { headers: authHeaders() }),
        fetch(`${BASE_URL}/api/v1/exercises`),
      ]);
      const wData = await wRes.json();
      const eData = await eRes.json();
      setWorkouts(Array.isArray(wData) ? wData : (wData?.data || wData?.content || FALLBACK_WORKOUTS));
      setExercises(Array.isArray(eData) ? eData : (eData?.data || eData?.content || FALLBACK_EXERCISES));
    } catch {
      setWorkouts(FALLBACK_WORKOUTS);
      setExercises(FALLBACK_EXERCISES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(form) {
    try {
      const url = editTarget
        ? `${BASE_URL}/api/admin/workouts/${editTarget.workoutId}`
        : `${BASE_URL}/api/admin/workouts`;
      const method = editTarget ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      notify(editTarget ? 'Workout updated!' : 'Workout created!', 'success');
    } catch {
      notify(editTarget ? 'Workout updated (local).' : 'Workout created (local).', 'success');
      if (editTarget) {
        setWorkouts(prev => prev.map(w => w.workoutId === editTarget.workoutId ? { ...w, ...form } : w));
      } else {
        setWorkouts(prev => [...prev, { ...form, workoutId: Date.now() }]);
      }
    }
    setShowModal(false);
    setEditTarget(null);
    await load();
  }

  async function handleDelete() {
    const id = delTarget.workoutId;
    setDelTarget(null);
    try {
      await fetch(`${BASE_URL}/api/admin/workouts/${id}`, { method: 'DELETE', headers: authHeaders() });
    } catch {}
    setWorkouts(prev => prev.filter(w => w.workoutId !== id));
    notify('Workout deleted.', 'success');
  }

  const DIFF_FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const filtered = workouts.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || (w.difficultyLevel || '').toLowerCase() === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  return (
    <div className="ap-tab-content">
      <div className="ap-tab-toolbar">
        <div className="ap-search">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input placeholder="Search workouts…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="ap-btn ap-btn--primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Create Workout
        </button>
      </div>

      <div className="ap-filters">
        {DIFF_FILTERS.map(f => (
          <button
            key={f}
            className={`ap-filter-btn${filter === f ? ' ap-filter-btn--active' : ''}`}
            onClick={() => setFilter(f)}
          >{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="ap-loading"><div className="ap-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="ap-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/>
          </svg>
          <p>No workouts found</p>
        </div>
      ) : (
        <div className="ap-card-grid">
          {filtered.map(wk => {
            const exList = wk.exercises || [];
            return (
              <div key={wk.workoutId} className="ap-card">
                <div className="ap-card__top">
                  <div className="ap-card__name">{wk.name}</div>
                  <span className={`ap-diff ${diffClass(wk.difficultyLevel)}`}>{wk.difficultyLevel || 'Beginner'}</span>
                </div>
                {wk.description && (
                  <div className="ap-card__desc">{wk.description.length > 80 ? wk.description.slice(0, 80) + '…' : wk.description}</div>
                )}
                <div className="ap-card__exercises">
                  {exList.slice(0, 3).map((e, i) => (
                    <div key={i} className="ap-card__ex-chip">
                      {e.exerciseName || e.name || `Exercise ${e.exerciseId}`}
                    </div>
                  ))}
                  {exList.length > 3 && <div className="ap-card__ex-chip ap-card__ex-chip--more">+{exList.length - 3} more</div>}
                  {exList.length === 0 && <span className="ap-card__empty">No exercises added</span>}
                </div>
                <div className="ap-card__actions">
                  <button className="ap-btn ap-btn--edit" onClick={() => { setEditTarget(wk); setShowModal(true); }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5l3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button className="ap-btn ap-btn--delete" onClick={() => setDelTarget(wk)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <WorkoutModal
          editData={editTarget}
          exercises={exercises}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}
      {delTarget && (
        <ConfirmModal
          title="Delete Workout"
          message={`Remove "${delTarget.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────────
function UsersTab({ notify }) {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [editTarget, setEditTarget] = useState(null);
  const [delTarget, setDelTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : (data?.data || data?.content || FALLBACK_USERS));
    } catch {
      setUsers(FALLBACK_USERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSaveUser(updated) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${updated.userId || updated.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ role: updated.role }),
      });
      if (!res.ok) throw new Error();
    } catch {}
    setUsers(prev => prev.map(u => (u.userId || u.id) === (updated.userId || updated.id) ? { ...u, role: updated.role } : u));
    notify('User updated!', 'success');
    setEditTarget(null);
  }

  async function handleDelete() {
    const id = delTarget.userId || delTarget.id;
    setDelTarget(null);
    try {
      await fetch(`${BASE_URL}/api/admin/users/${id}`, { method: 'DELETE', headers: authHeaders() });
    } catch {}
    setUsers(prev => prev.filter(u => (u.userId || u.id) !== id));
    notify('User removed.', 'success');
  }

  const filtered = users.filter(u => {
    const name = `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  function formatDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="ap-tab-content">
      <div className="ap-tab-toolbar">
        <div className="ap-search">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="ap-role-filters">
          {['All', 'USER', 'ROLE_ADMIN'].map(r => (
            <button
              key={r}
              className={`ap-filter-btn${roleFilter === r ? ' ap-filter-btn--active' : ''}`}
              onClick={() => setRoleFilter(r)}
            >{r}</button>
          ))}
        </div>
      </div>

      <div className="ap-stat-row">
        <div className="ap-stat-chip">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {users.length} total users
        </div>
        <div className="ap-stat-chip">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
          </svg>
          {users.filter(u => u.role === 'ADMIN').length} admins
        </div>
      </div>

      {loading ? (
        <div className="ap-loading"><div className="ap-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="ap-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <p>No users found</p>
        </div>
      ) : (
        <div className="ap-user-table">
          <div className="ap-user-table__header">
            <span>User</span>
            <span>Email</span>
            <span>Role</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>
          {filtered.map(u => {
            const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || u.email?.[0]?.toUpperCase() || 'U';
            return (
              <div key={u.userId || u.id} className="ap-user-row">
                <div className="ap-user-row__name">
                  <div className="ap-user-avatar">{initials}</div>
                  <span>{u.firstName} {u.lastName}</span>
                </div>
                <span className="ap-user-row__email">{u.email}</span>
                <span>
                  <span className={`ap-role-badge ap-role-badge--${(u.role || 'USER').toLowerCase()}`}>
                    {u.role || 'USER'}
                  </span>
                </span>
                <span className="ap-user-row__date">{formatDate(u.createdAt)}</span>
                <div className="ap-card__actions">
                  <button className="ap-btn ap-btn--edit" onClick={() => setEditTarget(u)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5l3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button className="ap-btn ap-btn--delete" onClick={() => setDelTarget(u)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editTarget && (
        <UserModal user={editTarget} onSave={handleSaveUser} onClose={() => setEditTarget(null)} />
      )}
      {delTarget && (
        <ConfirmModal
          title="Remove User"
          message={`Remove ${delTarget.firstName} ${delTarget.lastName} from the platform? This cannot be undone.`}
          confirmText="Remove"
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}

// ─── FALLBACK DATA ────────────────────────────────────────────────
const FALLBACK_EXERCISES = [
  { exerciseId: 1, name: 'Push Ups',          difficultyLevel: 'Beginner',     targetMuscleGroup: 'Chest',     description: 'Classic upper body push exercise.' },
  { exerciseId: 2, name: 'Plank',             difficultyLevel: 'Intermediate', targetMuscleGroup: 'Core',      description: 'Core stability isometric hold.' },
  { exerciseId: 3, name: 'Squats',            difficultyLevel: 'Beginner',     targetMuscleGroup: 'Legs',      description: 'Fundamental lower body compound movement.' },
  { exerciseId: 4, name: 'Mountain Climbers', difficultyLevel: 'Intermediate', targetMuscleGroup: 'Core',      description: 'Dynamic full body cardio exercise.' },
  { exerciseId: 5, name: 'Burpees',           difficultyLevel: 'Advanced',     targetMuscleGroup: 'Full Body', description: 'High intensity full body exercise.' },
  { exerciseId: 6, name: 'Lunges',            difficultyLevel: 'Beginner',     targetMuscleGroup: 'Legs',      description: 'Unilateral lower body strengthening.' },
];
const FALLBACK_WORKOUTS = [
  { workoutId: 1, name: 'Full Body Beginner', difficultyLevel: 'Beginner',     description: 'Great starting point for new users.', exercises: [{ exerciseName: 'Push Ups' }, { exerciseName: 'Squats' }, { exerciseName: 'Plank' }] },
  { workoutId: 2, name: 'Core Builder',       difficultyLevel: 'Intermediate', description: 'Focused on core strength and stability.', exercises: [{ exerciseName: 'Plank' }, { exerciseName: 'Mountain Climbers' }] },
];
const FALLBACK_USERS = [
  { userId: 1, firstName: 'Leighlane', lastName: 'Hisoler', email: 'leighlane@bodu.app', role: 'ADMIN',  createdAt: '2026-02-01' },
  { userId: 2, firstName: 'John',      lastName: 'Doe',     email: 'john@bodu.app',      role: 'USER',   createdAt: '2026-03-10' },
  { userId: 3, firstName: 'Jane',      lastName: 'Smith',   email: 'jane@bodu.app',      role: 'USER',   createdAt: '2026-03-15' },
  { userId: 4, firstName: 'Mark',      lastName: 'Reyes',   email: 'mark@bodu.app',      role: 'USER',   createdAt: '2026-04-02' },
];

// ─── MAIN ADMIN PANEL ─────────────────────────────────────────────
const TABS = [
  {
    id: 'exercises', label: 'Exercises',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
  },
  {
    id: 'workouts', label: 'Workouts',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/></svg>
  },
  {
    id: 'users', label: 'Users',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('exercises');
  const [notif, setNotif] = useState({ msg: '', type: 'success' });

  const notify = useCallback((msg, type = 'success') => {
    setNotif({ msg, type });
  }, []);

  return (
    <div className="ap-page">
      <Notification
        message={notif.msg}
        type={notif.type}
        onClose={() => setNotif({ msg: '', type: 'success' })}
      />

      {/* Page heading */}
      <div className="ap-page__header">
        <div className="ap-page__header-left">
          <div className="ap-admin-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Admin
          </div>
          <h1 className="ap-page__title">Admin Panel</h1>
        </div>
        <p className="ap-page__sub">Manage exercises, workouts, and users across the platform.</p>
      </div>

      {/* Tabs */}
      <div className="ap-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`ap-tab-btn${activeTab === tab.id ? ' ap-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="ap-tab-btn__icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'exercises' && <ExercisesTab notify={notify} />}
      {activeTab === 'workouts'  && <WorkoutsTab  notify={notify} />}
      {activeTab === 'users'     && <UsersTab     notify={notify} />}
    </div>
  );
}
