import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";

function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  

  const handleReset = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await axios.post(`${API_URL}/api/reset-password`, {
        username,
        new_password: newPassword,
      });

      setMsg(res.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      setMsg(err.response?.data?.detail || "Reset failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Reset Password</h2>

        <form onSubmit={handleReset}>
          
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <span
              onClick={() => setShow(!show)}
              style={{ position: "absolute", right: 10, top: 8, cursor: "pointer" }}
            >
              {show ? "🙈" : "👁️"}
            </span>
          </div>

          <button type="submit">Reset Password</button>
        </form>

        {msg && (
          <p className={msg.includes("success") || msg.includes("successfully") ? "success" : "error"} style={{ marginTop: '10px' }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}


export default ForgotPassword;