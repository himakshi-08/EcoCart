// detect if we are running locally (localhost or file protocol)
if (typeof window.isLocal === 'undefined') {
  window.isLocal = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:';
}
const AUTH_API_BASE_URL = (window.isLocal ? 'http://localhost:5001' : 'https://ecocart-backend-lcos.onrender.com') + '/api/auth';

// Login form
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Show success and redirect
        window.location.href = '../items/browse.html';
      } else {
        alert(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      alert('Network error');
    }
  });
}

// Register form
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '../items/browse.html';
      } else {
        alert(data.error || 'Registration failed. Try a different email.');
      }
    } catch (err) {
      alert('Network error');
    }
  });
}

// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    window.location.href = '../auth/login.html';
  }

  return { token, user };
}

// Initial UI check
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (token && user) {
    document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');

    // Admin only elements
    if (user.role === 'admin') {
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    } else {
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
  } else {
    document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }
});

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Check if we are in items folder or root
  const isSubFolder = window.location.pathname.includes('/items/') || window.location.pathname.includes('/auth/');
  window.location.href = isSubFolder ? '../auth/login.html' : 'auth/login.html';
}