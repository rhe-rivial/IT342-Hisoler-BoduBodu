import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import InputField from "../../shared/components/InputField";
import Notification from "../../shared/components/Notification";
import Button from "../../shared/components/Button";
import "./AuthContainer.css";

const API_BASE = "http://localhost:8080/api";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!token) {
      return setNotification({ type: "error", message: "Password reset link is missing a token." });
    }

    if (newPassword.length < 6) {
      return setNotification({ type: "error", message: "Password must be at least 6 characters." });
    }

    if (newPassword !== confirmPassword) {
      return setNotification({ type: "error", message: "Passwords do not match." });
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          newPassword
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Password reset failed.");
      }

      setNotification({ type: "success", message: "Password reset successfully. Please sign in." });
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message === "Failed to fetch" ? "Unable to connect to server." : error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleResetPassword();
    }
  };

  return (
    <div className="auth-wrapper">
      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: "", message: "" })}
      />

      <div className="reset-password-card">
        <h2>Reset Password</h2>
        <p>Choose a new password for your BoduBodu account.</p>

        <InputField
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <InputField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <Button onClick={handleResetPassword} loading={loading}>
          Reset Password
        </Button>
      </div>
    </div>
  );
}

export default ResetPassword;
