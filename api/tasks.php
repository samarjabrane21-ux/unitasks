<?php
require 'headers.php';
require 'db.php';

$method  = $_SERVER['REQUEST_METHOD'];
$id      = isset($_GET['id']) ? (int)$_GET['id'] : null;
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 1;
$data    = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($method) {

    // ── GET : toutes les tâches de l'utilisateur
    case 'GET':
        $stmt = $pdo->prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$user_id]);
        echo json_encode($stmt->fetchAll());
        break;

    // ── POST : créer une tâche
    case 'POST':
        $stmt = $pdo->prepare(
            'INSERT INTO tasks (user_id, title, status, priority, subject, date)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['user_id']  ?? 1,
            $data['title']    ?? 'Sans titre',
            $data['status']   ?? 'todo',
            $data['priority'] ?? 'normal',
            $data['subject']  ?? null,
            $data['date']     ?? null,
        ]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;

    // ── PUT : modifier une tâche
    case 'PUT':
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID manquant']); break; }
        $stmt = $pdo->prepare(
            'UPDATE tasks SET title=?, status=?, priority=?, subject=?, date=?
             WHERE id=? AND user_id=?'
        );
        $stmt->execute([
            $data['title']    ?? 'Sans titre',
            $data['status']   ?? 'todo',
            $data['priority'] ?? 'normal',
            $data['subject']  ?? null,
            $data['date']     ?? null,
            $id,
            $data['user_id']  ?? 1,
        ]);
        echo json_encode(['success' => true]);
        break;

    // ── DELETE : supprimer une tâche
    case 'DELETE':
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID manquant']); break; }
        $stmt = $pdo->prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user_id]);
        echo json_encode(['success' => true]);
        break;
}
