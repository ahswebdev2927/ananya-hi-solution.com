"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("ananya_admin_token");
    if (token === "ananya-secure-admin-token-2026") {
      router.push("/admin");
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("ananya_admin_token", data.token);
        router.push("/admin");
      } else {
        setError(data.error || "Invalid username or passcode.");
      }
    } catch (err) {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-body">
      <div className="admin-login-bg-decor bg-decor-1"></div>
      <div className="admin-login-bg-decor bg-decor-2"></div>
      
      <div className="admin-login-card">
        <div className="admin-login-header">
          <img
            src="/logo.png"
            alt="Ananya Hi Solutions"
            className="admin-login-logo"
          />
          <h2>Admin Control Panel</h2>
          <p>Sign in to manage services, job postings, and news updates</p>
        </div>

        {error && (
          <div className="admin-login-error">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-group-custom">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper-custom">
              <span className="input-icon-custom">👤</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group-custom">
            <label htmlFor="password">Passcode</label>
            <div className="input-wrapper-custom">
              <span className="input-icon-custom">🔒</span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin passcode"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`admin-submit-btn ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner-login"></span>
            ) : (
              "Secure Authorization"
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <Link href="/" className="back-to-home-link">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
