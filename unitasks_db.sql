-- ============================================================
--  UniTasks — Script SQL complet
--  À exécuter dans phpMyAdmin ou MySQL Workbench
-- ============================================================

CREATE DATABASE IF NOT EXISTS unitasks
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE unitasks;

-- ── TABLE : users ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    avatar     VARCHAR(10)  DEFAULT '🎓',
    bio        TEXT         DEFAULT NULL,
    role       VARCHAR(20)  DEFAULT 'etudiant',
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ── TABLE : tasks ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    title      VARCHAR(255) NOT NULL,
    status     ENUM('todo','doing','done') DEFAULT 'todo',
    priority   ENUM('normal','urgent','faible') DEFAULT 'normal',
    subject    VARCHAR(100) DEFAULT NULL,
    date       DATE         DEFAULT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── TABLE : notes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    title      VARCHAR(255) NOT NULL,
    content    TEXT         DEFAULT NULL,
    color      VARCHAR(20)  DEFAULT 'yellow',
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── TABLE : files ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS files (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    name       VARCHAR(255) NOT NULL,
    type       VARCHAR(50)  DEFAULT NULL,
    size       INT          DEFAULT 0,
    path       VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── TABLE : events (calendrier) ──────────────────────────────
CREATE TABLE IF NOT EXISTS events (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    title      VARCHAR(255) NOT NULL,
    date       DATE         NOT NULL,
    color      VARCHAR(20)  DEFAULT '#6c63ff',
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── TABLE : tutoring_slots ───────────────────────────────────
CREATE TABLE IF NOT EXISTS tutoring_slots (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id    INT NOT NULL,
    student_id    INT DEFAULT NULL,
    subject       VARCHAR(100) NOT NULL,
    date_time     DATETIME NOT NULL,
    zoom_link     VARCHAR(255) DEFAULT NULL,
    exercise_path VARCHAR(255) DEFAULT NULL,
    plan_path     VARCHAR(255) DEFAULT NULL,
    status        VARCHAR(20) DEFAULT 'available',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── TABLE : revision_plans ───────────────────────────────────
CREATE TABLE IF NOT EXISTS revision_plans (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    student_id     INT NOT NULL,
    teacher_id     INT DEFAULT NULL,
    subject        VARCHAR(100) NOT NULL,
    timetable_path VARCHAR(255) DEFAULT NULL,
    plan_path      VARCHAR(255) DEFAULT NULL,
    status         VARCHAR(20) DEFAULT 'requested',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── DONNÉES DE TEST ──────────────────────────────────────────
-- Mot de passe : "etudiant123" (hashé avec bcrypt)
INSERT INTO users (username, email, password, avatar) VALUES
('etudiant', 'etudiant@unitasks.com',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 '🎓');

-- Quelques tâches de test
INSERT INTO tasks (user_id, title, status, priority, subject, date) VALUES
(1, 'Réviser les chapitres 1 à 5',    'todo',  'urgent', 'Maths',   '2025-06-10'),
(1, 'Rendre le TP Linux',             'doing', 'urgent', 'Linux',   '2025-06-08'),
(1, 'Lire le cours de réseau',        'todo',  'normal', 'Réseau',  '2025-06-12'),
(1, 'Préparer la soutenance',         'doing', 'normal', 'Projet',  '2025-06-20'),
(1, 'Exercices de maths chapitre 6',  'done',  'faible', 'Maths',   '2025-06-01');

-- Quelques notes de test
INSERT INTO notes (user_id, title, content, color) VALUES
(1, 'Examen Linux',    'Revoir : systemd, LVM, SELinux. TP Docker avant le 10.',           'yellow'),
(1, 'Réunion groupe',  'Vendredi 10h — salle B204. Apporter le rapport.',                   'blue'),
(1, 'Rendu rapport',   'À soumettre avant 23h59. Format PDF + Word.',                       'rose');

-- Quelques projets de test
INSERT INTO projects (user_id, name, description, progress, color) VALUES
(1, 'Application Web 2025', 'Projet de fin d''année en groupe de 4',    72, '#6c63ff'),
(1, 'Mémoire S2',           'Mémoire sur la sécurité des réseaux',       45, '#ff8fa3'),
(1, 'TP Réseau',            'Configuration VLANs et routage inter-VLAN', 90, '#ffd93d');

