<?php
$host = 'localhost';
$db   = 'unitasks';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
        $user, $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    try {
        $sqlite_file = __DIR__ . '/unitasks.sqlite';
        $is_new = !file_exists($sqlite_file);
        $pdo = new PDO(
            "sqlite:" . $sqlite_file,
            null, null,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
        if ($is_new) {
            $pdo->exec("CREATE TABLE IF NOT EXISTS users (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                username   VARCHAR(50)  NOT NULL UNIQUE,
                email      VARCHAR(100) NOT NULL UNIQUE,
                password   VARCHAR(255) NOT NULL,
                avatar     VARCHAR(10)  DEFAULT '🎓',
                bio        TEXT         DEFAULT NULL,
                role       VARCHAR(20)  DEFAULT 'etudiant',
                created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
            )");
            $pdo->exec("CREATE TABLE IF NOT EXISTS tasks (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INT          NOT NULL,
                title      VARCHAR(255) NOT NULL,
                status     VARCHAR(20) DEFAULT 'todo',
                priority   VARCHAR(20) DEFAULT 'normal',
                subject    VARCHAR(100) DEFAULT NULL,
                date       DATE         DEFAULT NULL,
                created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
            )");
            $pdo->exec("CREATE TABLE IF NOT EXISTS notes (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INT          NOT NULL,
                title      VARCHAR(255) NOT NULL,
                content    TEXT         DEFAULT NULL,
                color      VARCHAR(20)  DEFAULT 'yellow',
                created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
            )");
            $pdo->exec("CREATE TABLE IF NOT EXISTS files (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INT          NOT NULL,
                name       VARCHAR(255) NOT NULL,
                type       VARCHAR(50)  DEFAULT NULL,
                size       INT          DEFAULT 0,
                path       VARCHAR(500) DEFAULT NULL,
                created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
            )");
            $pdo->exec("CREATE TABLE IF NOT EXISTS tutoring_slots (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                teacher_id    INT NOT NULL,
                student_id    INT DEFAULT NULL,
                subject       VARCHAR(100) NOT NULL,
                date_time     DATETIME NOT NULL,
                zoom_link     VARCHAR(255) DEFAULT NULL,
                exercise_path VARCHAR(255) DEFAULT NULL,
                plan_path     VARCHAR(255) DEFAULT NULL,
                status        VARCHAR(20) DEFAULT 'available',
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )");
            $pdo->exec("CREATE TABLE IF NOT EXISTS revision_plans (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id     INT NOT NULL,
                teacher_id     INT DEFAULT NULL,
                subject        VARCHAR(100) NOT NULL,
                timetable_path VARCHAR(255) DEFAULT NULL,
                plan_path      VARCHAR(255) DEFAULT NULL,
                status         VARCHAR(20) DEFAULT 'requested',
                created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )");
            
            // Seed
            $hash = password_hash('etudiant123', PASSWORD_BCRYPT);
            $pdo->exec("INSERT OR IGNORE INTO users (id, username, email, password, avatar, role) VALUES (1, 'etudiant', 'etudiant@unitasks.com', '$hash', '🎓', 'etudiant')");
            
            $hashTeacher = password_hash('enseignant123', PASSWORD_BCRYPT);
            $pdo->exec("INSERT OR IGNORE INTO users (id, username, email, password, avatar, role) VALUES (2, 'enseignant', 'enseignant@unitasks.com', '$hashTeacher', '👨‍🏫', 'enseignant')");
        }
    } catch (PDOException $ex) {
        http_response_code(500);
        echo json_encode(['error' => 'Connexion BDD échouée : ' . $e->getMessage() . ' | ' . $ex->getMessage()]);
        exit;
    }
}
