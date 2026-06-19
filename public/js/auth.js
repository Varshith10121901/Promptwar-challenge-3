/**
 * Frontend login/register action handlers
 */
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  const loginAlert = document.getElementById('login-alert');
  const registerAlert = document.getElementById('register-alert');

  const showAlert = (container, message) => {
    container.textContent = message;
    container.style.display = 'block';
  };

  const hideAlerts = () => {
    if (loginAlert) loginAlert.style.display = 'none';
    if (registerAlert) registerAlert.style.display = 'none';
  };

  // Login handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlerts();

      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      try {
        const response = await API.auth.login(username, password);
        if (response.success) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          window.location.href = '/dashboard.html';
        }
      } catch (err) {
        showAlert(loginAlert, err.message || 'Login failed. Please check your credentials.');
      }
    });
  }

  // Registration handler
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlerts();

      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;

      try {
        const response = await API.auth.register(username, email, password);
        if (response.success) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          window.location.href = '/dashboard.html';
        }
      } catch (err) {
        if (err.errors) {
          const errorMsgs = err.errors.map(e => e.message).join(', ');
          showAlert(registerAlert, `Registration failed: ${errorMsgs}`);
        } else {
          showAlert(registerAlert, err.message || 'Registration failed.');
        }
      }
    });
  }
});
