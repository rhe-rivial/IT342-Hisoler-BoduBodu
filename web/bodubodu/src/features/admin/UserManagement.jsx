import { useEffect, useState, useCallback } from "react";
import "./AdminPanel.css";

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

// User Detail/Edit Modal
function UserDetailModal({ user, onSave, onClose }) {
  const [role, setRole] = useState(user.role || "USER");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ ...user, role });
    } finally {
      setSaving(false);
    }
  }

  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
    user.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="ap-overlay" onClick={onClose}>
      <div className="ap-modal ap-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal__header">
          <div className="ap-modal__header-left">
            <div className="ap-modal__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2>User Details</h2>
          </div>
          <button className="ap-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="ap-modal__body">
          <div className="ap-user-info-block">
            <div className="ap-user-avatar-lg">{initials}</div>
            <div>
              <div className="ap-user-fullname">
                {user.firstName} {user.lastName}
              </div>
              <div className="ap-user-email-display">{user.email}</div>
              <div className="ap-user-joined">Member since {joined}</div>
            </div>
          </div>

          <div className="ap-form-row">
            <label className="ap-label">Role</label>
            <select
              className="ap-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {user.lastLogin && (
            <div className="ap-form-row">
              <label className="ap-label">Last Login</label>
              <input
                className="ap-input"
                value={new Date(user.lastLogin).toLocaleString()}
                readOnly
              />
            </div>
          )}

          {user.sessionCount !== undefined && (
            <div className="ap-form-row">
              <label className="ap-label">Total Sessions</label>
              <input
                className="ap-input"
                value={user.sessionCount || 0}
                readOnly
              />
            </div>
          )}
        </div>

        <div className="ap-modal__footer">
          <button className="ap-btn ap-btn--outline" onClick={onClose}>Cancel</button>
          <button
            className="ap-btn ap-btn--primary"
            onClick={handleSave}
            disabled={saving || role === user.role}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main UserManagement Component
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [notif, setNotif] = useState({ msg: "", type: "success" });

  const notify = useCallback((msg, type = "success") => setNotif({ msg, type }), []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        if (res.status === 403) {
          notify("Access denied. Admin privileges required.", "error");
          return;
        }
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data?.content || []);
    } catch (error) {
      notify("Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Update user role
  async function handleUpdateUser(updatedUser) {
    const userId = updatedUser.userId || updatedUser.id;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ role: updatedUser.role }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      
      setUsers((prev) =>
        prev.map((u) =>
          (u.userId || u.id) === userId ? { ...u, role: updatedUser.role } : u
        )
      );
      notify("User role updated successfully!");
      setSelectedUser(null);
    } catch {
      notify("Failed to update user.", "error");
    }
  }

  // Delete user
  async function handleDeleteUser() {
    if (!delTarget) return;
    const userId = delTarget.userId || delTarget.id;
    setDelTarget(null);

    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete user");
      
      setUsers((prev) => prev.filter((u) => (u.userId || u.id) !== userId));
      notify("User deleted successfully.");
    } catch {
      notify("Failed to delete user.", "error");
    }
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const nameMatch = `${u.firstName || ""} ${u.lastName || ""} ${u.email || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const roleMatch = roleFilter === "All" || u.role === roleFilter;
    return nameMatch && roleMatch;
  });

  function formatDate(str) {
    if (!str) return "—";
    return new Date(str).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Stats
  const adminCount = users.filter(
    (u) => u.role === "ROLE_ADMIN" || u.role === "ADMIN" || u.role === "admin"
  ).length;
  const userCount = users.length - adminCount;

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
          <div className="ap-admin-badge" style={{ marginBottom: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Admin
          </div>
          <h1 className="ap-page__title">User Management</h1>
          <p className="ap-page__sub">Manage user accounts, roles, and permissions.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="ap-stat-row">
        <div className="ap-stat-chip">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {users.length} total users
        </div>
        <div className="ap-stat-chip">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          {adminCount} admins
        </div>
        <div className="ap-stat-chip">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21a8 8 0 1 0-16 0" />
          </svg>
          {userCount} regular users
        </div>
      </div>

      {/* Toolbar */}
      <div className="ap-tab-toolbar">
        <div className="ap-search">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ap-role-filters">
          {["All", "USER", "ADMIN"].map((r) => (
            <button
              key={r}
              className={`ap-filter-btn${roleFilter === r ? " ap-filter-btn--active" : ""}`}
              onClick={() => setRoleFilter(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="ap-loading">
          <div className="ap-spinner" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="ap-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <p>No users found.</p>
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
          {filteredUsers.map((u) => {
            const userId = u.userId || u.id;
            const initials =
              `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() ||
              u.email?.[0]?.toUpperCase() ||
              "U";
            const role = u.role?.replace("ROLE_", "") || "USER";

            return (
              <div key={userId} className="ap-user-row">
                <div className="ap-user-row__name">
                  <div className="ap-user-avatar">{initials}</div>
                  <span>
                    {u.firstName} {u.lastName}
                  </span>
                </div>
                <span className="ap-user-row__email">{u.email}</span>
                <span>
                  <span className={`ap-role-badge ap-role-badge--${role.toLowerCase()}`}>
                    {role}
                  </span>
                </span>
                <span className="ap-user-row__date">{formatDate(u.createdAt)}</span>
                <div className="ap-card__actions">
                  <button
                    className="ap-btn ap-btn--edit"
                    onClick={() => setSelectedUser(u)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5l3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    className="ap-btn ap-btn--delete"
                    onClick={() => setDelTarget(u)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onSave={handleUpdateUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {delTarget && (
        <ConfirmModal
          title="Remove User"
          message={`Are you sure you want to remove ${delTarget.firstName} ${delTarget.lastName}? This action cannot be undone.`}
          confirmText="Remove"
          onConfirm={handleDeleteUser}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}

export default UserManagement;