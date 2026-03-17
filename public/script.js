// ========================
// Constants & State
// ========================
const API_URL = "";
let currentFilter = "all";
let editingTodoId = null;
let allTodos = [];

// ========================
// DOM Helpers
// ========================
const $ = (id) => document.getElementById(id);

// ========================
// Toast
// ========================
let toastTimer = null;

function showToast(msg) {
    const toast = $("toast");
    toast.textContent = msg;
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("hidden"), 2500);
}

// ========================
// Auth Tab Switching
// ========================
function switchTab(tab) {
    const isSignin = tab === "signin";
    $("signin-form").classList.toggle("hidden", !isSignin);
    $("signup-form").classList.toggle("hidden", isSignin);
    $("tab-signin").classList.toggle("active", isSignin);
    $("tab-signup").classList.toggle("active", !isSignin);
    $("signin-error").textContent = "";
    $("signup-error").textContent = "";

    if (isSignin) {
        $("auth-title").textContent = "Welcome back";
        $("auth-subtitle").textContent = "Sign in to your account";
    } else {
        $("auth-title").textContent = "Create account";
        $("auth-subtitle").textContent = "It's free and takes seconds";
    }
}

function setLoading(btnId, loading) {
    const btn = $(btnId);
    const span = btn.querySelector("span");
    const loader = btn.querySelector(".btn-loader");
    btn.disabled = loading;
    if (span) span.classList.toggle("hidden", loading);
    if (loader) loader.classList.toggle("hidden", !loading);
}

// ========================
// Signup
// ========================
$("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("signup-name").value.trim();
    const username = $("signup-username").value.trim();
    const password = $("signup-password").value;

    setLoading("signup-btn", true);
    $("signup-error").textContent = "";

    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, username, password }),
        });
        const data = await res.json();

        if (res.ok) {
            showToast("Account created! Please sign in.");
            switchTab("signin");
            $("signin-username").value = username;
        } else {
            $("signup-error").textContent = data.msg || "Signup failed";
        }
    } catch {
        $("signup-error").textContent = "Could not connect to server";
    } finally {
        setLoading("signup-btn", false);
    }
});

// ========================
// Signin
// ========================
$("signin-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = $("signin-username").value.trim();
    const password = $("signin-password").value;

    setLoading("signin-btn", true);
    $("signin-error").textContent = "";

    try {
        const res = await fetch(`${API_URL}/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", username);
            showAppScreen(username);
        } else {
            $("signin-error").textContent = data.msg || "Invalid credentials";
        }
    } catch {
        $("signin-error").textContent = "Could not connect to server";
    } finally {
        setLoading("signin-btn", false);
    }
});

// ========================
// Logout
// ========================
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    allTodos = [];
    $("auth-screen").classList.remove("hidden");
    $("app-screen").classList.add("hidden");
    $("signin-username").value = "";
    $("signin-password").value = "";
}

// ========================
// Screen Switching
// ========================
function showAppScreen(username) {
    $("auth-screen").classList.add("hidden");
    $("app-screen").classList.remove("hidden");
    $("user-badge").textContent = username || "";
    fetchTodos();
}

// ========================
// Fetch Todos
// ========================
async function fetchTodos() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/todos`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) { logout(); return; }

        const data = await res.json();
        if (res.ok) {
            allTodos = data.tasks || [];
            renderTodos();
        }
    } catch {
        showToast("Failed to load todos");
    }
}

// ========================
// Render Todos
// ========================
function renderTodos() {
    const list = $("todo-list");
    const empty = $("empty-state");
    const emptyText = $("empty-text");

    let filtered = allTodos;
    if (currentFilter === "active") filtered = allTodos.filter(t => !t.done);
    if (currentFilter === "done")   filtered = allTodos.filter(t => t.done);

    // Stats
    const total   = allTodos.length;
    const done    = allTodos.filter(t => t.done).length;
    const active  = total - done;
    $("stats-text").textContent = total === 0 ? "" : `${active} remaining · ${done} done`;

    list.innerHTML = "";

    if (filtered.length === 0) {
        empty.classList.remove("hidden");
        const msgs = {
            all:    "No tasks yet. Add one above!",
            active: "No active tasks. You're all caught up!",
            done:   "No completed tasks yet.",
        };
        emptyText.textContent = msgs[currentFilter];
        return;
    }

    empty.classList.add("hidden");

    filtered.forEach(todo => {
        const item = document.createElement("div");
        item.className = `todo-item${todo.done ? " done-item" : ""}`;
        item.dataset.id = todo._id;

        item.innerHTML = `
            <button class="todo-check${todo.done ? " checked" : ""}" 
                    onclick="toggleDone('${todo._id}', ${todo.done})"
                    title="${todo.done ? "Mark as active" : "Mark as done"}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </button>
            <span class="todo-title">${escapeHtml(todo.title)}</span>
            <div class="todo-actions">
                <button class="icon-btn edit-btn" onclick="openEditModal('${todo._id}', '${escapeHtml(todo.title).replace(/'/g, "&#39;")}')" title="Edit">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="icon-btn delete-btn" onclick="deleteTodo('${todo._id}')" title="Delete">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/>
                        <path d="M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                    </svg>
                </button>
            </div>
        `;

        list.appendChild(item);
    });
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// ========================
// Add Todo
// ========================
async function addTodo() {
    const input = $("todo-input");
    const title = input.value.trim();
    if (!title) { input.focus(); return; }

    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${API_URL}/todo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title }),
        });

        if (res.ok) {
            input.value = "";
            await fetchTodos();
        } else {
            const data = await res.json();
            showToast(data.msg || "Failed to add task");
        }
    } catch {
        showToast("Could not connect to server");
    }
}

// Enter key on add input
$("todo-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTodo();
});

// ========================
// Toggle Done
// ========================
async function toggleDone(id, currentDone) {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${API_URL}/todo/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ done: !currentDone }),
        });

        if (res.ok) {
            // Optimistic local update
            const todo = allTodos.find(t => t._id === id);
            if (todo) todo.done = !currentDone;
            renderTodos();
        } else {
            showToast("Failed to update task");
        }
    } catch {
        showToast("Could not connect to server");
    }
}

// ========================
// Delete Todo
// ========================
async function deleteTodo(id) {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${API_URL}/todo/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            allTodos = allTodos.filter(t => t._id !== id);
            renderTodos();
            showToast("Task deleted");
        } else {
            showToast("Failed to delete task");
        }
    } catch {
        showToast("Could not connect to server");
    }
}

// ========================
// Edit Modal
// ========================
function openEditModal(id, title) {
    editingTodoId = id;
    $("edit-input").value = title;
    $("edit-modal").classList.remove("hidden");
    setTimeout(() => $("edit-input").focus(), 50);
}

function closeEditModal() {
    editingTodoId = null;
    $("edit-modal").classList.add("hidden");
}

function closeModal(e) {
    if (e.target === $("edit-modal")) closeEditModal();
}

// Close on Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEditModal();
});

// Enter in edit modal
$("edit-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveEdit();
});

async function saveEdit() {
    const title = $("edit-input").value.trim();
    if (!title || !editingTodoId) return;

    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${API_URL}/todo/${editingTodoId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title }),
        });

        if (res.ok) {
            const todo = allTodos.find(t => t._id === editingTodoId);
            if (todo) todo.title = title;
            closeEditModal();
            renderTodos();
            showToast("Task updated");
        } else {
            showToast("Failed to update task");
        }
    } catch {
        showToast("Could not connect to server");
    }
}

// ========================
// Filter
// ========================
function setFilter(btn) {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderTodos();
}

// ========================
// Init
// ========================
(function init() {
    const token = localStorage.getItem("token");
    if (token) {
        const username = localStorage.getItem("username") || "";
        showAppScreen(username);
    }
})();