import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InputField from "../../shared/components/InputField";
import Notification from "../../shared/components/Notification";
import Button from "../../shared/components/Button";
import "./AuthContainer.css";

function AuthContainer() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === "/login";

  const API_BASE = "http://localhost:8080/api";
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  const loginGoogleButtonRef = useRef(null);
  const registerGoogleButtonRef = useRef(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notification, setNotification] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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

  const getEmailFromToken = useCallback((token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub || "";
    } catch (error) {
      console.warn("Could not decode JWT email:", error);
      return "";
    }
  }, []);

  const saveAuthSession = useCallback(async (token, fallbackEmail) => {
    localStorage.setItem("token", token);

    try {
      const profileResponse = await fetch(`${API_BASE}/user/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (profileResponse.ok) {
        const userProfile = await profileResponse.json();
        localStorage.setItem("user", JSON.stringify({
          email: userProfile.email,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          userId: userProfile.userId,
          role: userProfile.role
        }));
        return;
      }
    } catch (profileError) {
      console.warn("Could not fetch user profile:", profileError);
    }

    localStorage.setItem("user", JSON.stringify({
      email: fallbackEmail || getEmailFromToken(token),
      firstName: "User",
      role: ""
    }));
  }, [API_BASE, getEmailFromToken]);

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response?.credential) {
      return setNotification({
        type: "error",
        message: "Google sign-in did not return a credential."
      });
    }

    try {
      setLoading(true);

      const authResponse = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          credential: response.credential
        })
      });

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        throw new Error(errorText || "Google sign-in failed.");
      }

      const data = await authResponse.json();
      await saveAuthSession(data.token, "");

      setNotification({
        type: "success",
        message: "Google sign-in successful."
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 800);
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message === "Failed to fetch"
          ? "Unable to connect to server."
          : error.message
      });
    } finally {
      setLoading(false);
    }
  }, [API_BASE, navigate, saveAuthSession]);

  const handleMissingGoogleConfig = () => {
    setNotification({
      type: "error",
      message: "Set REACT_APP_GOOGLE_CLIENT_ID before using Google sign-in."
    });
  };

  const handleForgotPassword = async () => {
    if (!loginEmail.trim()) {
      return setNotification({ type: "error", message: "Enter your email first, then request a reset link." });
    }

    if (!isValidEmail(loginEmail)) {
      return setNotification({ type: "error", message: "Enter a valid email before requesting a reset link." });
    }

    try {
      setResetLoading(true);

      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: loginEmail.trim()
        })
      });

      if (!response.ok) {
        throw new Error("Could not send reset email. Please try again.");
      }

      setNotification({
        type: "success",
        message: "If that email is registered, a password reset link has been sent."
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message === "Failed to fetch" ? "Unable to connect to server." : error.message
      });
    } finally {
      setResetLoading(false);
    }
  };

  const GoogleLogo = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initializeGSI = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential
      });

      [loginGoogleButtonRef.current, registerGoogleButtonRef.current].forEach((button) => {
        if (!button) return;
        button.innerHTML = "";
        window.google.accounts.id.renderButton(button, {
          theme: "outline",
          size: "large",
          shape: "circle",
          type: "icon"
        });
      });
    };

    if (window.google?.accounts?.id) {
      initializeGSI();
      return;
    }

    const existingScript = document.querySelector("script[src='https://accounts.google.com/gsi/client']");
    if (existingScript) {
      existingScript.addEventListener("load", initializeGSI);
      return () => existingScript.removeEventListener("load", initializeGSI);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGSI;
    document.body.appendChild(script);
  }, [GOOGLE_CLIENT_ID, handleGoogleCredential, isLogin]);

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

      const data = await response.json(); // Backend returns { token: "..." }
      await saveAuthSession(data.token, loginEmail);

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

          <button
            type="button"
            className="forgot-password-link"
            onClick={handleForgotPassword}
            disabled={resetLoading || loading}
          >
            {resetLoading ? "Sending reset link..." : "Forgot password?"}
          </button>

          <Button onClick={handleLogin} loading={loading}>
            Sign In
          </Button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="google-auth-button">
            {GOOGLE_CLIENT_ID ? (
              <>
                <div className="google-auth-render-target" ref={loginGoogleButtonRef} />
                <div className="google-icon-overlay">
                  <GoogleLogo />
                </div>
              </>
            ) : (
              <button
                type="button"
                className="google-fallback-button"
                onClick={handleMissingGoogleConfig}
                aria-label="Sign in with Google"
              >
                <GoogleLogo />
              </button>
            )}
          </div>
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

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="google-auth-button">
            {GOOGLE_CLIENT_ID ? (
              <>
                <div className="google-auth-render-target" ref={registerGoogleButtonRef} />
                <div className="google-icon-overlay">
                  <GoogleLogo />
                </div>
              </>
            ) : (
              <button
                type="button"
                className="google-fallback-button"
                onClick={handleMissingGoogleConfig}
                aria-label="Sign in with Google"
              >
                <GoogleLogo />
              </button>
            )}
          </div>
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
