import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InputField from "./InputField";
import Notification from "./Notification";
import Button from "./Button";
import "../styles/AuthContainer.css";

function AuthContainer() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === "/login";

  const API_BASE = "http://localhost:8080/api";

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notification, setNotification] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ========================
  // Autofill email after register
  // ========================
  useEffect(() => {
    const prefill = localStorage.getItem("prefillEmail");
    if (prefill) {
      setLoginEmail(prefill);
      localStorage.removeItem("prefillEmail");
    }
  }, []);

  // ========================
  // ENTER KEY SUPPORT
  // ========================
  const handleLoginKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const handleRegisterKeyDown = (e) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  // ========================
  // LOGIN
  // ========================
  const handleLogin = async () => {

    if (!loginEmail.trim()) {
      return setNotification({ type: "error", message: "Email is required." });
    }

    if (!isValidEmail(loginEmail)) {
      return setNotification({ type: "error", message: "Invalid email format." });
    }

    if (!loginPassword.trim()) {
      return setNotification({ type: "error", message: "Password is required." });
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword
        })
      });

      if (response.status === 401) {
        throw new Error("Incorrect email or password.");
      }

      if (!response.ok) {
        throw new Error("Login failed. Please try again.");
      }

      const data = await response.json();
      // Save token separately
      localStorage.setItem("token", data.token);

      // OPTIONAL: decode user later OR fetch profile
      localStorage.setItem("user", JSON.stringify({
        email: loginEmail
      }));

      setNotification({
        type: "success",
        message: "Login successful."
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 800);

    } catch (error) {

      if (error.message === "Failed to fetch") {
        setNotification({
          type: "error",
          message: "Unable to connect to server."
        });
      } else {
        setNotification({
          type: "error",
          message: error.message
        });
      }

    } finally {
      setLoading(false);
    }
  };

  // ========================
  // REGISTER
  // ========================
  const handleRegister = async () => {

    if (!firstName.trim()) {
      return setNotification({ type: "error", message: "First name is required." });
    }

    if (!lastName.trim()) {
      return setNotification({ type: "error", message: "Last name is required." });
    }

    if (!registerEmail.trim()) {
      return setNotification({ type: "error", message: "Email is required." });
    }

    if (!isValidEmail(registerEmail)) {
      return setNotification({ type: "error", message: "Invalid email format." });
    }

    if (!registerPassword.trim()) {
      return setNotification({ type: "error", message: "Password is required." });
    }

    if (registerPassword.length < 6) {
      return setNotification({ type: "error", message: "Password must be at least 6 characters." });
    }

    if (registerPassword !== confirmPassword) {
      return setNotification({ type: "error", message: "Passwords do not match." });
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: registerEmail.trim(),
          password: registerPassword
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Registration failed.");
      }

      // Save email for login autofill
      localStorage.setItem("prefillEmail", registerEmail.trim());

      // Clear fields
      setFirstName("");
      setLastName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");

      setNotification({
        type: "success",
        message: "Account created successfully."
      });

      setTimeout(() => {
        navigate("/login");
      }, 1000);

    } catch (error) {
      setNotification({
        type: "error",
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">

      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: "", message: "" })}
      />

      <div className={`auth-container ${!isLogin ? "active" : ""}`}>

        {/* LOGIN */}
        <div className="form-container login-container">
          <h2>Sign In</h2>

          <InputField
            label="Email"
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            onKeyDown={handleLoginKeyDown}
          />

          <InputField
            label="Password"
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            onKeyDown={handleLoginKeyDown}
          />

          <Button onClick={handleLogin} loading={loading}>
            Sign In
          </Button>
        </div>

        {/* REGISTER */}
        <div className="form-container register-container">
          <h2>Create Account</h2>

          <InputField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onKeyDown={handleRegisterKeyDown}
          />

          <InputField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onKeyDown={handleRegisterKeyDown}
          />

          <InputField
            label="Email"
            type="email"
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
            onKeyDown={handleRegisterKeyDown}
          />

          <InputField
            label="Password"
            type="password"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            onKeyDown={handleRegisterKeyDown}
          />

          <InputField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={handleRegisterKeyDown}
          />

          <Button onClick={handleRegister} loading={loading}>
            Create Account
          </Button>
        </div>

        {/* OVERLAY */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h2>Welcome Back!</h2>
              <p>Continue your training journey.</p>
              <button
                className="ghost"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
            </div>

            <div className="overlay-panel overlay-right">
              <h2>Start Training</h2>
              <p>Create your account and build strength.</p>
              <button
                className="ghost"
                onClick={() => navigate("/register")}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AuthContainer;
