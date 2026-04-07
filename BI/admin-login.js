(function () {
  'use strict';

  var form = document.getElementById('loginForm');
  var errEl = document.getElementById('loginError');

  var AUTH_KEY = 'bi_admin_authed_v1';
  var AUTH_DEFAULT_USERNAME = 'admin';
  var AUTH_DEFAULT_PASSWORD = 'admin123';

  function isAuthed() {
    try {
      return localStorage.getItem(AUTH_KEY) === 'true';
    } catch (_) {
      return false;
    }
  }

  function setAuthed(val) {
    try {
      localStorage.setItem(AUTH_KEY, val ? 'true' : 'false');
    } catch (_) {}
  }

  function redirectIfLoggedIn() {
    if (isAuthed()) {
      window.location.href = 'admin.html';
    }
  }

  redirectIfLoggedIn();

  if (!form) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errEl.textContent = '';

    var fd = new FormData(form);
    var username = String(fd.get('username') || '').trim();
    var password = String(fd.get('password') || '');

    try {
      if (username !== AUTH_DEFAULT_USERNAME || password !== AUTH_DEFAULT_PASSWORD) {
        throw new Error('Invalid username or password');
      }
      setAuthed(true);
      window.location.href = 'admin.html';
    } catch (err) {
      errEl.textContent = err && err.message ? err.message : 'Login failed';
    }
  });
})();

