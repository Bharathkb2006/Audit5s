import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';

export default function AdminLoginPage() {
  const { adminAuthed, loginAdmin, firebaseAuthEnabled } = useApp();
  const [err, setErr] = useState('');

  if (adminAuthed) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <main className="admin-login">
      <div className="admin-card">
        <h1>Admin Login</h1>
        <p className="admin-subtitle">Sign in to update website content and images.</p>
        {firebaseAuthEnabled ? (
          <p className="admin-note" style={{ marginBottom: 12 }}>
            Use the Firebase Auth email and password you created in the Firebase console.
          </p>
        ) : null}
        <form
          id="loginForm"
          className="admin-form"
          autoComplete="on"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr('');
            const fd = new FormData(e.currentTarget);
            const username = String(fd.get('username') || '').trim();
            const password = String(fd.get('password') || '');
            const ok = await loginAdmin(username, password);
            if (!ok) {
              setErr(
                firebaseAuthEnabled ? 'Invalid email or password' : 'Invalid username or password'
              );
            }
          }}
        >
          <label className="admin-field">
            {firebaseAuthEnabled ? 'Email' : 'Username'}
            <input name="username" type={firebaseAuthEnabled ? 'email' : 'text'} required />
          </label>
          <label className="admin-field">
            Password
            <input name="password" type="password" required />
          </label>
          <button className="admin-primary-btn" type="submit">
            Login
          </button>
          <div id="loginError" className="admin-error" aria-live="polite">
            {err}
          </div>
        </form>
        <Link className="admin-link" to="/">
          ← Back to website
        </Link>
      </div>
    </main>
  );
}
