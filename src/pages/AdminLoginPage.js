import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppProvider';

export default function AdminLoginPage() {
  const { adminAuthed, loginAdmin } = useApp();
  const [err, setErr] = useState('');

  if (adminAuthed) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <main className="admin-login">
      <div className="admin-card">
        <h1>Admin Login</h1>
        <p className="admin-subtitle">Sign in to update website content and images.</p>
        <form
          id="loginForm"
          className="admin-form"
          autoComplete="off"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr('');
            const fd = new FormData(e.currentTarget);
            const username = String(fd.get('admin_user') || '').trim();
            const password = String(fd.get('admin_pass') || '');
            const ok = await loginAdmin(username, password);
            if (!ok) {
              setErr('Invalid username or password');
            }
          }}
        >
          {/* Trap browser/password-manager autofill */}
          <input
            type="text"
            name="fake_user"
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: 'absolute', left: -10000, top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
          />
          <input
            type="password"
            name="fake_pass"
            autoComplete="current-password"
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: 'absolute', left: -10000, top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
          />
          <label className="admin-field">
            Username
            <input
              name="admin_user"
              type="text"
              required
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="text"
            />
          </label>
          <label className="admin-field">
            Password
            <input name="admin_pass" type="password" required autoComplete="new-password" />
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
