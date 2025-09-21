import React, { useState } from "react";
import KashmirCollegeAI from "./KashmirCollegeAI"; // Adjust path if needed

type UserInfo = {
  name: string;
  education: "10th" | "12th";
};

export default function AppWrapper() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: "", education: "10th" });
  const [loginError, setLoginError] = useState("");

  const handleLogin = () => {
    if (!userInfo.name.trim()) {
      setLoginError("Please enter your name");
      return;
    }
    if (userInfo.education !== "10th" && userInfo.education !== "12th") {
      setLoginError("Please select education as 10th or 12th");
      return;
    }
    setLoginError("");
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <div
        style={{
          maxWidth: 400,
          margin: "auto",
          marginTop: 100,
          padding: 20,
          fontFamily: "Arial, sans-serif",
          border: "1px solid #ddd",
          borderRadius: 8,
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>Login to Access Chatbot</h2>
        <div style={{ marginBottom: 12 }}>
          <label>
            Name:
            <input
              type="text"
              placeholder="Enter your full name"
              value={userInfo.name}
              onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Education:
            <select
              value={userInfo.education}
              onChange={(e) =>
                setUserInfo({ ...userInfo, education: e.target.value as "10th" | "12th" })
              }
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            >
              <option value="10th">10th</option>
              <option value="12th">12th</option>
            </select>
          </label>
        </div>
        {loginError && (
          <div style={{ color: "red", marginBottom: 12, textAlign: "center" }}>{loginError}</div>
        )}
        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: 12,
            backgroundColor: "#0288d1",
            color: "#fff",
            fontWeight: "bold",
            borderRadius: 4,
            border: "none",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </div>
    );
  }

  return <KashmirCollegeAI userInfo={userInfo} />;
}
