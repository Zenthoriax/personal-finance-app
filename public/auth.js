// Authentication JavaScript
const API_URL = 'http://localhost:3000/api';

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active form
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(`${tab}-form`).classList.add('active');
        
        // Clear error message
        document.getElementById('error-message').classList.remove('show');
    });
});

// Login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('error-message');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.textContent = data.error || 'Login failed';
            errorMsg.classList.add('show');
        }
    } catch (error) {
        errorMsg.textContent = 'Network error. Please try again.';
        errorMsg.classList.add('show');
    }
});

// Register form
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorMsg = document.getElementById('error-message');
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.textContent = data.error || 'Registration failed';
            errorMsg.classList.add('show');
        }
    } catch (error) {
        errorMsg.textContent = 'Network error. Please try again.';
        errorMsg.classList.add('show');
    }
});

// Check if already logged in
if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
}

