<?php
require 'headers.php';
require 'db.php';

$method  = $_SERVER['REQUEST_METHOD'];
$id      = isset($_GET['id']) ? (int)$_GET['id'] : null;
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 1;
$data    = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$user_id]);
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        $stmt = $pdo->prepare('INSERT INTO notes (user_id, title, content, color) VALUES (?, ?, ?, ?)');
        $stmt->execute([$data['user_id'] ?? 1, $data['title'] ?? '', $data['content'] ?? '', $data['color'] ?? 'yellow']);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID manquant']); break; }
        $stmt = $pdo->prepare('UPDATE notes SET title=?, content=?, color=? WHERE id=? AND user_id=?');
        $stmt->execute([$data['title'] ?? '', $data['content'] ?? '', $data['color'] ?? 'yellow', $id, $data['user_id'] ?? 1]);
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID manquant']); break; }
        $stmt = $pdo->prepare('DELETE FROM notes WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user_id]);
        echo json_encode(['success' => true]);
        break;
}
