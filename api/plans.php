<?php
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
$data   = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    switch ($method) {
        case 'GET':
            $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
            $role    = isset($_GET['role']) ? $_GET['role'] : 'etudiant';

            if ($role === 'enseignant') {
                // Un enseignant voit TOUTES les demandes d'étudiants
                $stmt = $pdo->query('
                    SELECT rp.*, u1.username as student_name, u2.username as teacher_name 
                    FROM revision_plans rp 
                    JOIN users u1 ON rp.student_id = u1.id 
                    LEFT JOIN users u2 ON rp.teacher_id = u2.id 
                    ORDER BY rp.created_at DESC
                ');
                echo json_encode($stmt->fetchAll());
            } else {
                // Un étudiant voit seulement ses propres demandes de plans
                if (!$user_id) {
                    http_response_code(400);
                    echo json_encode(['error' => 'User ID manquant']);
                    exit;
                }
                $stmt = $pdo->prepare('
                    SELECT rp.*, u.username as teacher_name 
                    FROM revision_plans rp 
                    LEFT JOIN users u ON rp.teacher_id = u.id 
                    WHERE rp.student_id = ? 
                    ORDER BY rp.created_at DESC
                ');
                $stmt->execute([$user_id]);
                echo json_encode($stmt->fetchAll());
            }
            break;

        case 'POST':
            // Étudiant demande un plan
            $student_id     = $data['student_id'] ?? null;
            $subject        = $data['subject'] ?? '';
            $timetable_path = $data['timetable_path'] ?? '';

            if (!$student_id || !$subject) {
                http_response_code(400);
                echo json_encode(['error' => 'Champs obligatoires manquants']);
                exit;
            }

            $stmt = $pdo->prepare('INSERT INTO revision_plans (student_id, subject, timetable_path, status) VALUES (?, ?, ?, "requested")');
            $stmt->execute([$student_id, $subject, $timetable_path]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;

        case 'PUT':
            // Enseignant répond avec un plan de révision
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de plan manquant']);
                exit;
            }

            $teacher_id = $data['teacher_id'] ?? null;
            $plan_path  = $data['plan_path'] ?? '';

            if (!$teacher_id || !$plan_path) {
                http_response_code(400);
                echo json_encode(['error' => 'Champs obligatoires manquants']);
                exit;
            }

            $stmt = $pdo->prepare('UPDATE revision_plans SET teacher_id = ?, plan_path = ?, status = "completed" WHERE id = ?');
            $stmt->execute([$teacher_id, $plan_path, $id]);
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de plan manquant']);
                exit;
            }

            $stmt = $pdo->prepare('DELETE FROM revision_plans WHERE id = ?');
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur de base de données : ' . $e->getMessage()
    ]);
}
