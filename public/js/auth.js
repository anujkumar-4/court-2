const form = document.getElementById('loginForm');
const errorEl = document.getElementById('error');

if (localStorage.getItem('token')) {
  window.location.href = '/dashboard.html';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await resp.json();
    if (!resp.ok) {
      errorEl.textContent = data.message || 'Login failed';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = '/dashboard.html';
  } catch (err) {
    errorEl.textContent = 'Network/server error. Please retry.';
  }
});
