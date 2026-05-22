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

            if (!$user_id) {
                // Retourner tous les créneaux disponibles
                $stmt = $pdo->query('SELECT ts.*, u.username as teacher_name FROM tutoring_slots ts JOIN users u ON ts.teacher_id = u.id ORDER BY ts.date_time ASC');
                echo json_encode($stmt->fetchAll());
                break;
            }

            if ($role === 'enseignant') {
                // Créneaux de cet enseignant, avec les infos de l'étudiant s'il y en a un
                $stmt = $pdo->prepare('SELECT ts.*, u.username as student_name FROM tutoring_slots ts LEFT JOIN users u ON ts.student_id = u.id WHERE ts.teacher_id = ? ORDER BY ts.date_time ASC');
                $stmt->execute([$user_id]);
                echo json_encode($stmt->fetchAll());
            } else {
                // Étudiant : Tous les créneaux disponibles + les créneaux qu'il a réservés
                $stmt = $pdo->prepare('SELECT ts.*, u.username as teacher_name FROM tutoring_slots ts JOIN users u ON ts.teacher_id = u.id WHERE ts.status = "available" OR ts.student_id = ? ORDER BY ts.date_time ASC');
                $stmt->execute([$user_id]);
                echo json_encode($stmt->fetchAll());
            }
            break;

        case 'POST':
            // Enseignant crée un créneau
            $teacher_id = $data['teacher_id'] ?? null;
            $subject    = $data['subject'] ?? '';
            $date_time  = $data['date_time'] ?? '';
            $zoom_link  = $data['zoom_link'] ?? '';

            if (!$teacher_id || !$subject || !$date_time) {
                http_response_code(400);
                echo json_encode(['error' => 'Champs obligatoires manquants']);
                exit;
            }

            $stmt = $pdo->prepare('INSERT INTO tutoring_slots (teacher_id, subject, date_time, zoom_link, status) VALUES (?, ?, ?, ?, "available")');
            $stmt->execute([$teacher_id, $subject, $date_time, $zoom_link]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de créneau manquant']);
                exit;
            }

            // Action : réserver par un étudiant
            if (isset($data['action']) && $data['action'] === 'reserve') {
                $student_id    = $data['student_id'] ?? null;
                $exercise_path = $data['exercise_path'] ?? null;

                if (!$student_id) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID d\'étudiant manquant']);
                    exit;
                }

                $stmt = $pdo->prepare('UPDATE tutoring_slots SET student_id = ?, exercise_path = ?, status = "reserved" WHERE id = ?');
                $stmt->execute([$student_id, $exercise_path, $id]);
                echo json_encode(['success' => true]);
                break;
            }

            // Action : libérer/annuler par un étudiant ou enseignant
            if (isset($data['action']) && $data['action'] === 'cancel') {
                $stmt = $pdo->prepare('UPDATE tutoring_slots SET student_id = NULL, exercise_path = NULL, plan_path = NULL, status = "available" WHERE id = ?');
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
            }

            // Action : ajouter plan / modifier par l'enseignant
            $zoom_link = $data['zoom_link'] ?? null;
            $plan_path = $data['plan_path'] ?? null;
            $status    = $data['status'] ?? null;

            $fields = [];
            $params = [];
            if ($zoom_link !== null) { $fields[] = 'zoom_link = ?'; $params[] = $zoom_link; }
            if ($plan_path !== null) { $fields[] = 'plan_path = ?'; $params[] = $plan_path; }
            if ($status !== null)    { $fields[] = 'status = ?';    $params[] = $status; }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['error' => 'Aucune donnée à modifier']);
                exit;
            }

            $params[] = $id;
            $stmt = $pdo->prepare('UPDATE tutoring_slots SET ' . implode(', ', $fields) . ' WHERE id = ?');
            $stmt->execute($params);
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de créneau manquant']);
                exit;
            }

            $stmt = $pdo->prepare('DELETE FROM tutoring_slots WHERE id = ?');
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
