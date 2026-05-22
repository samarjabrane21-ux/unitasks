/**
 * UniTasks — app.js partie js pour les pages html
 * Fichier JS central lié à toutes les pages HTML
 * Gère : thème, localStorage, tâches, calendrier, notes, stats, profil, notifications
 */

/* ═══════════════════════════════════════════════════════
   1. STORAGE HELPERS — lecture / écriture localStorage
═══════════════════════════════════════════════════════ */
const Store = {
  get: (key, fallback = null) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  remove: (key) => localStorage.removeItem(key),
};

/* ═══════════════════════════════════════════════════════
   2. THEME — dark/light persistant sur toutes les pages
═══════════════════════════════════════════════════════ */
const Theme = {
  KEY: 'unitasks_theme',
  init() {
    const saved = Store.get(Theme.KEY, 'light');
    if (saved === 'dark') document.body.classList.add('dark');
    this.sync();
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => this.toggle());
    });
    const cb = document.getElementById('theme-switch');
    if (cb) {
      cb.checked = saved === 'dark';
      cb.addEventListener('change', () => this.toggle());
    }
  },
  toggle() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    Store.set(Theme.KEY, isDark ? 'dark' : 'light');
    this.sync();
  },
  sync() {
    const isDark = document.body.classList.contains('dark');
    document.querySelectorAll('.moon').forEach(el => el.style.display = isDark ? 'none' : 'inline');
    document.querySelectorAll('.sun').forEach(el => el.style.display = isDark ? 'inline' : 'none');
  }
};

/* ═══════════════════════════════════════════════════════
   3. NOTIFICATIONS TOAST
═══════════════════════════════════════════════════════ */
const Toast = {
  container: null,
  init() {
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position:fixed; top:1.5rem; right:1.5rem; z-index:9999;
      display:flex; flex-direction:column; gap:0.6rem;
    `;
    document.body.appendChild(this.container);
  },
  show(msg, type = 'success', duration = 3000) {
    if (!this.container) this.init();
    const colors = { success: '#10b981', error: '#ef4444', info: '#6c63ff', warn: '#f59e0b' };
    const toast = document.createElement('div');
    toast.style.cssText = `
      background:${colors[type] || colors.info}; color:#fff;
      padding:0.9rem 1.6rem; border-radius:14px;
      box-shadow:0 8px 25px rgba(0,0,0,0.18);
      font-weight:600; font-size:1rem;
      animation:toastIn 0.35s ease;
      max-width:320px;
    `;
    toast.textContent = msg;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(120%)';
      toast.style.transition = 'all 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }
};

/* ═══════════════════════════════════════════════════════
   4. TÂCHES — CRUD complet + Kanban Drag & Drop
═══════════════════════════════════════════════════════ */
const TaskManager = {
  KEY: 'unitasks_tasks',

  getAll() { return Store.get(this.KEY, []); },
  save(tasks) {
    Store.set(this.KEY, tasks);
    // ✅ FIX : chaque fois qu'on sauvegarde les tâches,
    //          on met à jour le calendrier automatiquement
    Calendar.syncTasksToCalendar();
  },

  add(task) {
    const tasks = this.getAll();
    task.id = Date.now();
    task.createdAt = new Date().toISOString();
    tasks.push(task);
    this.save(tasks);
    return task;
  },

  update(id, changes) {
    const tasks = this.getAll().map(t => t.id === id ? { ...t, ...changes } : t);
    this.save(tasks);
  },

  delete(id) {
    this.save(this.getAll().filter(t => t.id !== id));
  },

  getStats() {
    const tasks = this.getAll();
    const done   = tasks.filter(t => t.status === 'done').length;
    const doing  = tasks.filter(t => t.status === 'doing').length;
    const todo   = tasks.filter(t => t.status === 'todo').length;
    const urgent = tasks.filter(t => t.priority === 'urgent').length;
    const pct    = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    return { total: tasks.length, done, doing, todo, urgent, pct };
  },

  /* --- Rendu Kanban (taches.html) --- */
  initKanban() {
    if (!document.querySelector('.kanban-board')) return;
    this.renderKanban();

    document.getElementById('openModal')?.addEventListener('click', () => {
      document.getElementById('modal').classList.add('active');
    });
    document.getElementById('closeModal')?.addEventListener('click', () => {
      document.getElementById('modal').classList.remove('active');
    });
    document.getElementById('modal')?.addEventListener('click', e => {
      if (e.target === document.getElementById('modal'))
        document.getElementById('modal').classList.remove('active');
    });

    document.getElementById('taskForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const task = {
        title:    document.getElementById('title').value.trim(),
        subject:  document.getElementById('subject').value,
        date:     document.getElementById('date').value,
        priority: document.getElementById('priority').value,
        status:   document.getElementById('status').value || 'todo',
        notes:    document.getElementById('taskNotes')?.value?.trim() || '',
      };
      if (!task.title) { Toast.show('Titre obligatoire !', 'error'); return; }
      this.add(task);
      this.renderKanban();
      document.getElementById('modal').classList.remove('active');
      e.target.reset();
      Toast.show('✅ Tâche ajoutée !', 'success');
    });

    document.getElementById('searchTasks')?.addEventListener('input', e => {
      this.renderKanban(e.target.value.toLowerCase());
    });
  },

  renderKanban(filter = '') {
    const board = document.querySelector('.kanban-board');
    if (!board) return;

    board.querySelectorAll('.kanban-column').forEach(col => {
      col.querySelectorAll('.task-card').forEach(c => c.remove());
      const h3 = col.querySelector('h3');
      if (h3) h3.querySelector('.col-count')?.remove();
    });

    const tasks    = this.getAll();
    const filtered = filter
      ? tasks.filter(t =>
          t.title.toLowerCase().includes(filter) ||
          (t.subject || '').toLowerCase().includes(filter))
      : tasks;

    const counts = { todo: 0, doing: 0, done: 0 };
    filtered.forEach(task => { if (counts[task.status] !== undefined) counts[task.status]++; });

    board.querySelectorAll('.kanban-column').forEach(col => {
      const status = col.dataset.status;
      const h3 = col.querySelector('h3');
      if (h3) {
        const badge = document.createElement('span');
        badge.className = 'col-count';
        badge.style.cssText = `background:var(--primary);color:white;border-radius:20px;padding:0.2rem 0.7rem;font-size:0.85rem;margin-left:0.5rem;`;
        badge.textContent = counts[status] || 0;
        h3.appendChild(badge);
      }
    });

    filtered.forEach(task => {
      const col = board.querySelector(`[data-status="${task.status}"]`);
      if (!col) return;
      col.appendChild(this.createCard(task));
    });

    const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
    if (urgentCount > 0 && !document.getElementById('urgent-alert')) {
      const alert = document.createElement('div');
      alert.id = 'urgent-alert';
      alert.style.cssText = `background:#fee2e2;border:1px solid #f87171;color:#991b1b;padding:1rem 1.5rem;border-radius:14px;margin-bottom:1.5rem;font-weight:600;display:flex;align-items:center;gap:0.5rem;`;
      alert.innerHTML = `🔥 <span>${urgentCount} tâche(s) urgente(s) en attente !</span>`;
      board.parentElement.insertBefore(alert, board);
    }

    this.initDragDrop();
  },

  createCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.id = task.id;

    const labels  = { low: '🟢 Basse', medium: '🟡 Moyenne', high: '🔴 Haute', urgent: '🔥 Urgente', normal: '🔵 Normal', faible: '🟢 Faible' };
    const dateStr = task.date
      ? new Date(task.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
      : 'Sans date';
    const isLate  = task.date && task.status !== 'done' && new Date(task.date) < new Date();
    const lateBadge = isLate ? '<span style="color:#ef4444;font-size:0.8rem;">⚠️ En retard</span>' : '';

    card.innerHTML = `
      <button class="delete-btn" title="Supprimer">🗑️</button>
      <h4>${task.title}</h4>
      <p>${task.subject || ''} • 📅 ${dateStr} ${lateBadge}</p>
      ${task.notes ? `<p style="font-size:0.82rem;color:var(--text-light);margin-top:0.3rem;">${task.notes}</p>` : ''}
      <span class="priority-badge ${task.priority}">${labels[task.priority] || task.priority}</span>
    `;

    card.querySelector('.delete-btn').addEventListener('click', e => {
      e.stopPropagation();
      if (confirm('Supprimer cette tâche ?')) {
        this.delete(task.id);
        this.renderKanban(document.getElementById('searchTasks')?.value || '');
        Toast.show('🗑️ Tâche supprimée', 'warn');
      }
    });

    return card;
  },

  initDragDrop() {
    let dragged = null;
    document.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('dragstart', () => {
        dragged = card;
        setTimeout(() => card.style.opacity = '0.4', 0);
      });
      card.addEventListener('dragend', () => { card.style.opacity = '1'; dragged = null; });
    });
    document.querySelectorAll('.kanban-column').forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); col.style.background = 'rgba(108,99,255,0.06)'; });
      col.addEventListener('dragleave', () => { col.style.background = ''; });
      col.addEventListener('drop', e => {
        e.preventDefault();
        col.style.background = '';
        if (dragged) {
          col.appendChild(dragged);
          const id = parseInt(dragged.dataset.id);
          this.update(id, { status: col.dataset.status });
          this.renderKanban(document.getElementById('searchTasks')?.value || '');
          Toast.show('📦 Tâche déplacée', 'info');
        }
      });
    });
  }
};

/* ═══════════════════════════════════════════════════════
   5. CALENDRIER — navigation + tâches + événements
═══════════════════════════════════════════════════════ */
const Calendar = {
  KEY:      'unitasks_calendar',
  current:  new Date(),
  selectedDay: null,

  getEvents() { return Store.get(this.KEY, {}); },
  saveEvents(ev) { Store.set(this.KEY, ev); },

  /* ✅ FIX PRINCIPAL : injecte toutes les tâches ayant une date
     dans le calendrier sous forme d'événements automatiques      */
  syncTasksToCalendar() {
    const events = this.getEvents();
    const tasks  = TaskManager.getAll();

    // Supprimer les anciens événements auto (générés par les tâches)
    Object.keys(events).forEach(key => {
      if (events[key]?.fromTask) delete events[key];
    });

    // Réinjecter toutes les tâches avec une date
    tasks.forEach(task => {
      if (!task.date) return;
      const d   = new Date(task.date + 'T00:00:00');
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

      // Si un événement manuel existe déjà ce jour, on ajoute la tâche en plus
      if (!events[key]) {
        events[key] = {
          name:     task.title,
          type:     task.priority === 'urgent' ? 'urgent' : 'web',
          fromTask: true,
          taskId:   task.id,
          status:   task.status,
        };
      } else if (!events[key].fromTask) {
        // Événement manuel existant : ajouter une note
        events[key].extraTask = task.title;
      }
    });

    this.saveEvents(events);

    // Re-rendre le calendrier si on est sur la page calendrier
    if (document.querySelector('.calendar-grid')) {
      this.render();
    }
  },

  init() {
    if (!document.querySelector('.calendar-grid')) return;
    this.current = new Date();
    // ✅ Synchroniser les tâches au chargement de la page calendrier
    this.syncTasksToCalendar();
    this.render();
    document.getElementById('prevBtn')?.addEventListener('click',       () => this.prev());
    document.getElementById('nextBtn')?.addEventListener('click',       () => this.next());
    document.getElementById('saveEvent')?.addEventListener('click',     () => this.save());
    document.getElementById('deleteEvent')?.addEventListener('click',   () => this.deleteEvent());
    document.getElementById('closeCalModal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('calModal')?.addEventListener('click', e => {
      if (e.target.id === 'calModal') this.closeModal();
    });
  },

  render() {
    const grid = document.querySelector('.calendar-grid');
    if (!grid) return;

    grid.querySelectorAll('.cal-day').forEach(d => d.remove());

    const year  = this.current.getFullYear();
    const month = this.current.getMonth();
    const months = ['Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

    const el = document.getElementById('monthTitle');
    if (el) el.textContent = `${months[month]} ${year}`;

    const firstDay     = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth  = new Date(year, month + 1, 0).getDate();
    const today        = new Date();
    const events       = this.getEvents();

    // Compter les tâches par jour pour ce mois
    const tasks      = TaskManager.getAll();
    const tasksByDay = {};
    tasks.forEach(task => {
      if (!task.date) return;
      const d = new Date(task.date + 'T00:00:00');
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!tasksByDay[day]) tasksByDay[day] = [];
        tasksByDay[day].push(task);
      }
    });

    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement('div');
      blank.className = 'cal-day empty';
      grid.appendChild(blank);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key     = `${year}-${month + 1}-${d}`;
      const ev      = events[key];
      const dayTasks = tasksByDay[d] || [];
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

      const div = document.createElement('div');
      div.className = 'cal-day day' + (isToday ? ' today' : '') + (dayTasks.length || ev ? ' has-event' : '');

      // Construire le contenu du jour
      let badges = '';

      // Badge événement manuel
      if (ev && !ev.fromTask) {
        badges += `<span class="badge ${ev.type}">${ev.name}</span>`;
      }

      // Badges tâches (max 2 affichées + compteur si plus)
      const shown = dayTasks.slice(0, 2);
      shown.forEach(t => {
        const color = t.status === 'done' ? '#10b981' : t.priority === 'urgent' ? '#ef4444' : '#6c63ff';
        badges += `<span style="
          display:block; font-size:0.68rem; font-weight:600;
          background:${color}22; color:${color};
          border-radius:6px; padding:1px 5px; margin-top:2px;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          max-width:100%;
        ">${t.status === 'done' ? '✅' : t.priority === 'urgent' ? '🔥' : '📋'} ${t.title}</span>`;
      });
      if (dayTasks.length > 2) {
        badges += `<span style="font-size:0.65rem;color:#9ca3af;margin-top:1px;display:block;">+${dayTasks.length - 2} autres</span>`;
      }

      div.innerHTML = `<span class="day-number">${d}</span>${badges}`;
      div.addEventListener('click', () => this.openModal(d, key, ev, dayTasks));
      grid.appendChild(div);
    }
  },

  openModal(day, key, ev, dayTasks = []) {
    this.selectedDay = { day, key };
    const modal = document.getElementById('calModal');
    if (!modal) return;
    modal.classList.add('active');
    document.getElementById('modalDayTitle').textContent = `📅 Jour ${day}`;

    // ✅ Afficher les tâches de ce jour dans la modale
    const tasksInfo = document.getElementById('modalTasksList');
    if (tasksInfo) {
      tasksInfo.remove();
    }
    if (dayTasks.length > 0) {
      const taskDiv = document.createElement('div');
      taskDiv.id = 'modalTasksList';
      taskDiv.style.cssText = 'margin-bottom:1rem;padding:0.8rem;background:#f4f3ff;border-radius:10px;';
      taskDiv.innerHTML = `
        <p style="font-size:0.8rem;font-weight:700;color:#6c63ff;margin:0 0 0.5rem;">📋 Tâches ce jour :</p>
        ${dayTasks.map(t => `
          <div style="font-size:0.85rem;padding:0.3rem 0;border-bottom:1px solid #e0d7ff;color:#374151;">
            ${t.status === 'done' ? '✅' : t.priority === 'urgent' ? '🔥' : '⏳'} ${t.title}
            <span style="color:#9ca3af;font-size:0.75rem;"> — ${t.subject || 'Sans matière'}</span>
          </div>
        `).join('')}
      `;
      modal.querySelector('.modal-content')?.insertBefore(taskDiv, modal.querySelector('#eventName')?.parentElement);
    }

    document.getElementById('eventName').value  = ev && !ev.fromTask ? ev.name : '';
    document.getElementById('eventType').value  = ev?.type || 'web';
    document.getElementById('deleteEvent').style.display = (ev && !ev.fromTask) ? 'inline-block' : 'none';
  },

  save() {
    if (!this.selectedDay) return;
    const name = document.getElementById('eventName').value.trim();
    if (!name) { Toast.show('Nom requis', 'error'); return; }
    const events = this.getEvents();
    events[this.selectedDay.key] = {
      name,
      type: document.getElementById('eventType').value,
      fromTask: false,
    };
    this.saveEvents(events);
    this.closeModal();
    this.render();
    Toast.show('📌 Événement enregistré', 'success');
  },

  deleteEvent() {
    if (!this.selectedDay) return;
    const events = this.getEvents();
    delete events[this.selectedDay.key];
    this.saveEvents(events);
    this.closeModal();
    this.render();
    Toast.show('🗑️ Événement supprimé', 'warn');
  },

  closeModal() {
    document.getElementById('calModal')?.classList.remove('active');
    document.getElementById('modalTasksList')?.remove();
    this.selectedDay = null;
  },

  prev() { this.current.setMonth(this.current.getMonth() - 1); this.render(); },
  next() { this.current.setMonth(this.current.getMonth() + 1); this.render(); }
};

/* ═══════════════════════════════════════════════════════
   6. NOTES — Post-its persistants
═══════════════════════════════════════════════════════ */
const Notes = {
  KEY: 'unitasks_notes',
  COLORS: ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'],

  getAll() { return Store.get(this.KEY, []); },
  save(notes) { Store.set(this.KEY, notes); },

  init() {
    if (!document.querySelector('.notes-grid')) return;
    this.render();
    document.getElementById('addNoteBtn')?.addEventListener('click', () => this.add());
  },

  add() {
    const notes = this.getAll();
    const color = this.COLORS[Math.floor(Math.random() * this.COLORS.length)];
    const note  = { id: Date.now(), text: '', color, createdAt: new Date().toISOString() };
    notes.push(note);
    this.save(notes);
    this.render();
    setTimeout(() => {
      const textareas = document.querySelectorAll('.postit textarea');
      textareas[textareas.length - 1]?.focus();
    }, 100);
  },

  delete(id) {
    this.save(this.getAll().filter(n => n.id !== id));
    this.render();
    Toast.show('🗑️ Note supprimée', 'warn');
  },

  updateText(id, text) {
    const notes = this.getAll().map(n => n.id === id ? { ...n, text } : n);
    this.save(notes);
  },

  render() {
    const grid = document.querySelector('.notes-grid');
    if (!grid) return;
    grid.querySelectorAll('.postit-dynamic').forEach(p => p.remove());
    this.getAll().forEach(note => {
      const div = document.createElement('div');
      div.className = `postit ${note.color} postit-dynamic`;
      div.style.animation = 'cardFadeUp 0.4s ease forwards';
      div.innerHTML = `
        <button class="note-delete-btn" style="position:absolute;top:0.5rem;right:0.5rem;background:none;border:none;font-size:1rem;cursor:pointer;opacity:0.5;">✕</button>
        <textarea placeholder="Écrivez ici...">${note.text}</textarea>
      `;
      div.querySelector('textarea').addEventListener('input', e => this.updateText(note.id, e.target.value));
      div.querySelector('.note-delete-btn').addEventListener('click', () => {
        if (confirm('Supprimer cette note ?')) this.delete(note.id);
      });
      grid.appendChild(div);
    });
  }
};

/* ═══════════════════════════════════════════════════════
   7. STATS
═══════════════════════════════════════════════════════ */
const Stats = {
  init() {
    if (!document.getElementById('tasksChart')) return;
    this.renderCounters();
    this.renderChart();
    this.initFilters();
  },

  renderCounters() {
    const stats = TaskManager.getStats();
    const map = {
      'counter-global': stats.pct + '%',
      'counter-done':   stats.done,
      'counter-doing':  stats.doing,
      'counter-todo':   stats.todo,
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) this.animateCounter(el, String(val));
    });
    document.querySelectorAll('.counter[data-count]').forEach(el => {
      this.animateCounter(el, el.dataset.count + (el.dataset.percent ? '%' : ''));
    });
  },

  animateCounter(el, target) {
    const isPercent = target.endsWith('%');
    const num       = parseInt(target);
    let count       = 0;
    const step      = Math.max(1, Math.round(num / 60));
    const interval  = setInterval(() => {
      count = Math.min(count + step, num);
      el.textContent = count + (isPercent ? '%' : '');
      if (count >= num) clearInterval(interval);
    }, 20);
  },

  renderChart() {
    const canvas = document.getElementById('tasksChart');
    if (!canvas || !window.Chart) return;
    const tasks    = TaskManager.getAll();
    const subjects = [...new Set(tasks.map(t => t.subject).filter(Boolean))];

    if (!subjects.length) {
      new window.Chart(canvas, {
        type: 'bar',
        data: { labels: ['Linux','Dev Web','Réseaux'], datasets: [{ data: [92,78,65], backgroundColor: ['#b7e4c7','#cdb4db','#ffe5b4'], borderRadius: 12 }] },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }
      });
      return;
    }

    const percentages = subjects.map(s => {
      const sub = tasks.filter(t => t.subject === s);
      return sub.length ? Math.round((sub.filter(t => t.status === 'done').length / sub.length) * 100) : 0;
    });

    new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels: subjects,
        datasets: [{ label: '% Terminé', data: percentages,
          backgroundColor: subjects.map((_, i) => ['#b7e4c7','#cdb4db','#ffe5b4','#bfdbfe','#fecaca','#fde68a'][i % 6]),
          borderRadius: 14 }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } } }
    });
  },

  initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.stat-card').forEach(card => {
          card.style.display = filter === 'all' || card.dataset.category === filter ? 'block' : 'none';
        });
      });
    });
  }
};

/* ═══════════════════════════════════════════════════════
   8. PROFIL
═══════════════════════════════════════════════════════ */
const Profile = {
  init() {
    if (!document.querySelector('.profile-card')) return;
    const stats = TaskManager.getStats();
    const completionBadge = document.querySelector('[data-badge="completion"]');
    if (completionBadge) completionBadge.textContent = `${stats.pct}% de complétion`;
    const tasksBadge = document.querySelector('[data-badge="tasks"]');
    if (tasksBadge) tasksBadge.textContent = `${stats.done} tâche(s) terminée(s)`;
  }
};

/* ═══════════════════════════════════════════════════════
   9. DASHBOARD
═══════════════════════════════════════════════════════ */
const Dashboard = {
  init() {
    if (!document.querySelector('.features-grid') && !document.querySelector('.welcome-section') && !document.querySelector('.hero')) return;
    const stats = TaskManager.getStats();

    const circle = document.querySelector('.progress-circle');
    if (circle) {
      const circumference = 2 * Math.PI * 60;
      circle.style.strokeDashoffset = circumference * (1 - stats.pct / 100);
    }
    const graphText = document.querySelector('.graph-text');
    if (graphText) graphText.textContent = stats.pct + '%';

    document.querySelectorAll('[data-live="total"]').forEach(el => el.textContent = stats.total);
    document.querySelectorAll('[data-live="done"]').forEach(el  => el.textContent = stats.done);
    document.querySelectorAll('[data-live="doing"]').forEach(el => el.textContent = stats.doing);
    document.querySelectorAll('[data-live="urgent"]').forEach(el => el.textContent = stats.urgent);

    // Barre de progression index.html
    const pbFill = document.getElementById('pbFill');
    const pbPct  = document.getElementById('pbPct');
    if (pbFill) setTimeout(() => { pbFill.style.width = stats.pct + '%'; }, 300);
    if (pbPct)  pbPct.textContent = stats.pct + '%';
    const pcBadge = document.getElementById('pcBadge');
    if (pcBadge) pcBadge.textContent = stats.pct + '% complété';

    this.renderMiniCalendar();
    this.renderHeroTasks();
  },

  // ✅ Tâches récentes dans la hero card de l'index
  renderHeroTasks() {
    const list = document.getElementById('heroTaskList');
    if (!list) return;
    const tasks   = TaskManager.getAll();
    if (!tasks.length) return;
    const preview = tasks.slice(-4).reverse();
    list.innerHTML = preview.map(t => {
      const cc   = t.status === 'done' ? 'done' : t.status === 'doing' ? 'doing' : 'todo';
      const icon = t.status === 'done' ? '✓' : '';
      const subj = t.subject || '';
      return `
        <div class="task-mini">
          <div class="task-check ${cc}">${icon}</div>
          <div class="task-mini-text ${t.status === 'done' ? 'done' : ''}">${t.title}</div>
          ${subj ? `<span class="task-tag tag-v">${subj}</span>` : ''}
        </div>`;
    }).join('');
  },

  renderMiniCalendar() {
    const table = document.querySelector('.calendar-table tbody');
    if (!table) return;
    const now          = new Date();
    const year         = now.getFullYear();
    const month        = now.getMonth();
    const daysInMonth  = new Date(year, month + 1, 0).getDate();
    const firstDay     = (new Date(year, month, 1).getDay() + 6) % 7;
    const today        = now.getDate();
    const months       = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

    const header = document.querySelector('.calendar-header');
    if (header) header.textContent = `${months[month]} ${year}`;

    table.innerHTML = '';
    let day = 1;
    for (let row = 0; row < 6; row++) {
      const tr = document.createElement('tr');
      for (let col = 0; col < 7; col++) {
        const td = document.createElement('td');
        if ((row === 0 && col < firstDay) || day > daysInMonth) {
          td.textContent = '';
        } else {
          td.innerHTML = day === today ? `<div class="today">${day}</div>` : day;
          day++;
        }
        tr.appendChild(td);
      }
      table.appendChild(tr);
      if (day > daysInMonth) break;
    }
  }
};

/* ═══════════════════════════════════════════════════════
   10. SEARCH GLOBAL
═══════════════════════════════════════════════════════ */
const GlobalSearch = {
  init() {
    const searchInput = document.getElementById('globalSearch');
    if (!searchInput) return;
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) window.location.href = `taches.html?q=${encodeURIComponent(query)}`;
      }
    });
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      searchInput.value = q;
      TaskManager.initKanban();
      TaskManager.renderKanban(q.toLowerCase());
    }
  }
};

/* ═══════════════════════════════════════════════════════
   11. FICHIERS
═══════════════════════════════════════════════════════ */
const FilesManager = {
  KEY: 'unitasks_files',
  getAll() { return Store.get(this.KEY, []); },
  save(files) { Store.set(this.KEY, files); },

  init() {
    const list = document.getElementById('filesList');
    if (!list) return;
    this.render();
    document.getElementById('addFileBtn')?.addEventListener('click', () => {
      const name = prompt('Nom du fichier (ex: TP_Linux.pdf) :');
      if (!name) return;
      const files = this.getAll();
      files.push({ id: Date.now(), name, date: new Date().toLocaleDateString('fr-FR'), size: '—' });
      this.save(files);
      this.render();
      Toast.show('📎 Fichier ajouté', 'success');
    });
  },

  render() {
    const list = document.getElementById('filesList');
    if (!list) return;
    const files = this.getAll();
    list.innerHTML = files.length === 0
      ? '<p style="text-align:center;color:var(--text-light);">Aucun fichier pour l\'instant</p>'
      : files.map(f => `
          <div class="file-item" style="display:flex;align-items:center;justify-content:space-between;background:var(--card-bg);padding:1rem 1.5rem;border-radius:16px;margin-bottom:0.8rem;box-shadow:var(--shadow-sm);">
            <span>📎 ${f.name}</span>
            <span style="color:var(--text-light);font-size:0.9rem;">${f.date}</span>
            <button onclick="FilesManager.deleteFile(${f.id})" style="background:none;border:none;cursor:pointer;font-size:1.1rem;">🗑️</button>
          </div>`).join('');
  },

  deleteFile(id) {
    this.save(this.getAll().filter(f => f.id !== id));
    this.render();
    Toast.show('🗑️ Fichier supprimé', 'warn');
  }
};

/* ═══════════════════════════════════════════════════════
   12. TIMELINE — ✅ lit les tâches de TaskManager
═══════════════════════════════════════════════════════ */
const Timeline = {
  init() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    const tasks = TaskManager.getAll()
      .filter(t => t.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!tasks.length) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-light);">Aucune tâche avec date définie</p>';
      return;
    }

    container.innerHTML = tasks.map((t, i) => {
      const d       = new Date(t.date + 'T00:00:00');
      const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
      const statusIcon = { done: '✅', doing: '⏳', todo: '📋' }[t.status] || '📋';
      const side    = i % 2 === 0 ? 'left' : 'right';
      return `
        <div class="timeline-item ${side}" style="display:flex;${side === 'right' ? 'flex-direction:row-reverse;' : ''}gap:2rem;margin-bottom:2rem;align-items:flex-start;">
          <div class="timeline-dot" style="width:18px;height:18px;border-radius:50%;background:var(--primary);flex-shrink:0;margin-top:0.3rem;box-shadow:0 0 0 4px rgba(108,99,255,0.2);"></div>
          <div style="background:var(--card-bg);padding:1.2rem 1.5rem;border-radius:18px;box-shadow:var(--shadow-sm);max-width:400px;flex:1;border-${side}:4px solid var(--primary);">
            <p style="font-size:0.85rem;color:var(--text-light);margin-bottom:0.3rem;">${dateStr}</p>
            <h4 style="margin:0 0 0.3rem;">${statusIcon} ${t.title}</h4>
            <p style="margin:0;font-size:0.9rem;color:var(--text-light);">${t.subject || ''}</p>
          </div>
        </div>`;
    }).join('');
  }
};

/* ═══════════════════════════════════════════════════════
   13. CONTACT
═══════════════════════════════════════════════════════ */
const Contact = {
  init() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name    = form.querySelector('[name="name"]')?.value.trim();
      const email   = form.querySelector('[name="email"]')?.value.trim();
      const message = form.querySelector('[name="message"]')?.value.trim();
      if (!name || !email || !message) { Toast.show('Tous les champs sont obligatoires', 'error'); return; }
      Toast.show(`✉️ Message envoyé, merci ${name} !`, 'success', 4000);
      form.reset();
    });
  }
};

/* ═══════════════════════════════════════════════════════
   INIT GLOBAL
═══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastIn { from { opacity:0; transform:translateX(120%); } to { opacity:1; transform:translateX(0); } }
    body.dark { background:#1b2430 !important; color:#ececec !important; }
    body.dark header { background:linear-gradient(135deg,#2d3544,#3a4457) !important; }
    body.dark nav a { color:#e0e0e0; }
    body.dark .feature-card, body.dark .stat-card, body.dark .kanban-column,
    body.dark .task-card, body.dark .modal-content, body.dark .day,
    body.dark .profile-card, body.dark .step-card, body.dark .kpi-card,
    body.dark .postit { background:#2e384d !important; color:#f1f1f1 !important; }
    body.dark .modern-footer { background:linear-gradient(135deg,#2d3544,#3a4457) !important; }
    body.dark .postit.pink   { background:#3a1e2c !important; }
    body.dark .postit.blue   { background:#1e2e3a !important; }
    body.dark .postit.green  { background:#1e3a2a !important; }
    body.dark .postit.purple { background:#2e1e3a !important; }
    body.dark .postit.orange { background:#3a2a1e !important; }
    body.dark .postit.yellow { background:#2d2a1e !important; }
    body.dark input, body.dark select, body.dark textarea {
      background:#1b2430 !important; color:#f1f1f1 !important; border-color:#4b5563 !important;
    }
    .theme-toggle { cursor:pointer; }
    #modalTasksList { margin-bottom:1rem; }
  `;
  document.head.appendChild(style);

  Toast.init();
  Theme.init();
  GlobalSearch.init();

  Dashboard.init();
  TaskManager.initKanban();
  Calendar.init();
  Notes.init();
  Stats.init();
  Profile.init();
  FilesManager.init();
  Timeline.init();
  Contact.init();
});