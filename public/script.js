const API_URL = ""; // Or just "" if hosted on same domain

// DOM Elements
const authSection = document.getElementById('auth-section');
const todoSection = document.getElementById('todo-section');
const authMessage = document.getElementById('auth-message');
const todoList = document.getElementById('todo-list');

// Check if user is already logged in
const token = localStorage.getItem('token');
if (token) {
    showTodoSection();
}

// --- Auth Functions ---

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('signup-tab').classList.remove('active');
    authMessage.textContent = '';
}

function showSignup() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('signup-tab').classList.add('active');
    authMessage.textContent = '';
}

// Handle Signup
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;

    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            alert("Signup successful! Please login.");
            showLogin();
        } else {
            authMessage.textContent = data.msg || "Signup failed";
        }
    } catch (err) {
        authMessage.textContent = "Server error";
    }
});

// Handle Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token); // Save token
            showTodoSection();
        } else {
            authMessage.textContent = data.msg || "Login failed";
        }
    } catch (err) {
        authMessage.textContent = "Server error";
    }
});

function logout() {
    localStorage.removeItem('token');
    authSection.style.display = 'block';
    todoSection.style.display = 'none';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
}

// --- Todo Functions ---

function showTodoSection() {
    authSection.style.display = 'none';
    todoSection.style.display = 'block';
    fetchTodos();
}

async function fetchTodos() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/todos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
            renderTodos(data.tasks);
            // Optional: Display user name if your API returned it or you decode the token
        } else {
            // Token might be expired
            logout(); 
        }
    } catch (err) {
        console.error(err);
    }
}

function renderTodos(todos) {
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.textContent = todo.title;
        todoList.appendChild(li);
    });
}

async function addTodo() {
    const title = document.getElementById('todo-input').value;
    const token = localStorage.getItem('token');

    if (!title) return;

    try {
        const res = await fetch(`${API_URL}/todo`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ title })
        });

        if (res.ok) {
            document.getElementById('todo-input').value = '';
            fetchTodos(); // Refresh list
        } else {
            alert("Failed to add todo");
        }
    } catch (err) {
        console.error(err);
    }
}