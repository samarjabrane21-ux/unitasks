// ============================================================
//  UniTasks — api.js
//  Centralise tous les appels fetch() vers le backend PHP
//  Remplace localStorage dans app.js
// ============================================================

const API_BASE = 'api'; // chemin relatif vers le dossier /api

// Récupère l'utilisateur connecté depuis localStorage (mis là au login)
function getCurrentUser() {
    const u = localStorage.getItem('unitasks_user');
    return u ? JSON.parse(u) : { id: 1 };
}

// ── TASKS ──────────────────────────────────────────────────
const TasksAPI = {
    getAll: async () => {
        const uid = getCurrentUser().id;
        const res = await fetch(`${API_BASE}/tasks.php?user_id=${uid}`);
        return res.json();
    },
    create: async (task) => {
        const res = await fetch(`${API_BASE}/tasks.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...task, user_id: getCurrentUser().id })
        });
        return res.json();
    },
    update: async (id, task) => {
        const res = await fetch(`${API_BASE}/tasks.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...task, user_id: getCurrentUser().id })
        });
        return res.json();
    },
    delete: async (id) => {
        const uid = getCurrentUser().id;
        const res = await fetch(`${API_BASE}/tasks.php?id=${id}&user_id=${uid}`, {
            method: 'DELETE'
        });
        return res.json();
    }
};

// ── NOTES ──────────────────────────────────────────────────
const NotesAPI = {
    getAll: async () => {
        const uid = getCurrentUser().id;
        const res = await fetch(`${API_BASE}/notes.php?user_id=${uid}`);
        return res.json();
    },
    create: async (note) => {
        const res = await fetch(`${API_BASE}/notes.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...note, user_id: getCurrentUser().id })
        });
        return res.json();
    },
    update: async (id, note) => {
        const res = await fetch(`${API_BASE}/notes.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...note, user_id: getCurrentUser().id })
        });
        return res.json();
    },
    delete: async (id) => {
        const uid = getCurrentUser().id;
        const res = await fetch(`${API_BASE}/notes.php?id=${id}&user_id=${uid}`, {
            method: 'DELETE'
        });
        return res.json();
    }
};

// ── PROJECTS ────────────────────────────────────────────────
const ProjectsAPI = {
    getAll: async () => {
        const uid = getCurrentUser().id;
        const res = await fetch(`${API_BASE}/projects.php?user_id=${uid}`);
        return res.json();
    },
    create: async (project) => {
        const res = await fetch(`${API_BASE}/projects.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...project, user_id: getCurrentUser().id })
        });
        return res.json();
    },
    update: async (id, project) => {
        const res = await fetch(`${API_BASE}/projects.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...project, user_id: getCurrentUser().id })
        });
        return res.json();
    },
    delete: async (id) => {
        const uid = getCurrentUser().id;
        const res = await fetch(`${API_BASE}/projects.php?id=${id}&user_id=${uid}`, {
            method: 'DELETE'
        });
        return res.json();
    }
};

// ── AUTH ───────────────────────────────────────────────────
const AuthAPI = {
    login: async (email, password) => {
        const res = await fetch(`${API_BASE}/auth.php?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('unitasks_user', JSON.stringify(data.user));
        }
        return data;
    },
    register: async (username, email, password, role) => {
        const res = await fetch(`${API_BASE}/auth.php?action=register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role })
        });
        return res.json();
    },
    logout: () => {
        localStorage.removeItem('unitasks_user');
        window.location.href = 'login.html';
    },
    isLoggedIn: () => !!localStorage.getItem('unitasks_user'),
    getUser: getCurrentUser
};

// ── STATS ──────────────────────────────────────────────────
const StatsAPI = {
    get: async () => {
        const uid = getCurrentUser().id;
        const res = await fetch(`${API_BASE}/stats.php?user_id=${uid}`);
        return res.json();
    }
};

// ── CRENEAUX ───────────────────────────────────────────────
const CreneauxAPI = {
    getAll: async (userId = null, role = 'etudiant') => {
        let url = `${API_BASE}/creneaux.php`;
        if (userId) {
            url += `?user_id=${userId}&role=${role}`;
        }
        const res = await fetch(url);
        return res.json();
    },
    create: async (slot) => {
        const res = await fetch(`${API_BASE}/creneaux.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slot)
        });
        return res.json();
    },
    reserve: async (id, studentId, exercisePath) => {
        const res = await fetch(`${API_BASE}/creneaux.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reserve', student_id: studentId, exercise_path: exercisePath })
        });
        return res.json();
    },
    cancel: async (id) => {
        const res = await fetch(`${API_BASE}/creneaux.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'cancel' })
        });
        return res.json();
    },
    update: async (id, data) => {
        const res = await fetch(`${API_BASE}/creneaux.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    delete: async (id) => {
        const res = await fetch(`${API_BASE}/creneaux.php?id=${id}`, {
            method: 'DELETE'
        });
        return res.json();
    }
};

// ── PLANS ──────────────────────────────────────────────────
const PlansAPI = {
    getAll: async (userId = null, role = 'etudiant') => {
        let url = `${API_BASE}/plans.php?role=${role}`;
        if (userId) {
            url += `&user_id=${userId}`;
        }
        const res = await fetch(url);
        return res.json();
    },
    order: async (planRequest) => {
        const res = await fetch(`${API_BASE}/plans.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planRequest)
        });
        return res.json();
    },
    uploadPlan: async (id, teacherId, planPath) => {
        const res = await fetch(`${API_BASE}/plans.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacher_id: teacherId, plan_path: planPath })
        });
        return res.json();
    },
    delete: async (id) => {
        const res = await fetch(`${API_BASE}/plans.php?id=${id}`, {
            method: 'DELETE'
        });
        return res.json();
    }
};

// ── UPLOAD ─────────────────────────────────────────────────
const UploadAPI = {
    upload: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/upload.php`, {
            method: 'POST',
            body: formData
        });
        return res.json();
    }
};
