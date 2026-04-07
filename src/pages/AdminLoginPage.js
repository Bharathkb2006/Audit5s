import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppProvider';

export default function AdminLoginPage() {
  const { adminAuthed, loginAdmin } = useApp();
  const [err, setErr] = useState('');

  return (
    <main className="admin-login">
      <div className="admin-card">
        <h1>Admin Login</h1>
        <p className="admin-subtitle">Sign in to update website content and images.</p>
        {adminAuthed ? (
          <p className="admin-note" style={{ marginBottom: 12 }}>
            You&apos;re already logged in. You can open the dashboard at{' '}
            <code>/admin</code> or go back to the website below.
          </p>
        ) : (
          <p className="admin-note" style={{ marginBottom: 12 }}>
            Default admin credentials: username <strong>admin</strong>, password{' '}
            <strong>admin123</strong>.
          </p>
        )}
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
              setErr('Invalid username or password');
            }
          }}
        >
          <label className="admin-field">
            Username
            <input name="username" type="text" required />
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
