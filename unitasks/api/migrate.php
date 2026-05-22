<?php
require 'db.php';

try {
    // 1. Ajouter le champ role à la table users si non existant
    $checkRole = $pdo->query("SHOW COLUMNS FROM users LIKE 'role'");
    if ($checkRole->rowCount() === 0) {
        $pdo->exec("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'etudiant'");
        echo "Champ 'role' ajouté à la table 'users'.\n";
    } else {
        echo "Champ 'role' existe déjà dans la table 'users'.\n";
    }

    // 2. Créer la table tutoring_slots
    $pdo->exec("CREATE TABLE IF NOT EXISTS tutoring_slots (
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
    )");
    echo "Table 'tutoring_slots' créée ou déjà existante.\n";

    // 3. Créer la table revision_plans
    $pdo->exec("CREATE TABLE IF NOT EXISTS revision_plans (
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
    )");
    echo "Table 'revision_plans' créée ou déjà existante.\n";

    echo "Migration terminée avec succès !\n";
} catch (PDOException $e) {
    echo "Erreur de migration : " . $e->getMessage() . "\n";
}
