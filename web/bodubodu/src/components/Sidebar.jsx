import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import ConfirmModal from "./ConfirmModal";
import "../styles/Sidebar.css";

function Sidebar() {

  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutConfirm = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="sidebar">

      <div className="sidebar-top">
        <h2 className="logo">BoduBodu</h2>

        <nav className="nav-links">

          <NavLink to="/dashboard">Dashboard</NavLink>

          <NavLink to="/workouts">Workouts</NavLink>

          <NavLink to="/exercise-library">Exercise Library</NavLink>

          <NavLink to="/workout-plans">Workout Plans</NavLink>

          <NavLink to="/progress">Progress</NavLink>

        </nav>
      </div>

      {/* Logout Bottom */}
      <div className="sidebar-bottom">
        <button
          className="logout-btn-sidebar"
          onClick={() => setShowLogoutModal(true)}
        >
          Logout
        </button>
      </div>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Leaving Already?"
        message="Are you sure you want to leave? Keep up the consistency!"
        confirmText="Logout"
        cancelText="Stay"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
      />

    </div>
  );
}

export default Sidebar;