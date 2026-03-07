import { useState } from "react";
import Button from "./Button";
import "../styles/Login.css";


function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="page-container">

      <div className="card auth-card">

        <h2 className="auth-title">Welcome Back</h2>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button>Login</Button>

        <p className="auth-switch">
          Don’t have an account? Register
        </p>

      </div>
    </div>
  );
}

export default Login;
