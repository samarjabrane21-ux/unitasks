<?php
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$data   = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? '';

// ── REGISTER ──────────────────────────────────────────
if ($method === 'POST' && $action === 'register') {
    $username = trim($data['username'] ?? '');
    $email    = trim($data['email']    ?? '');
    $password = $data['password']      ?? '';
    $role     = trim($data['role']     ?? 'etudiant');

    if (!$username || !$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Tous les champs sont requis.']);
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email invalide.']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    try {
        $stmt = $pdo->prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)');
        $stmt->execute([$username, $email, $hash, $role]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(409);
        echo json_encode(['error' => 'Email ou nom déjà utilisé.']);
    }
    exit;
}

// ── LOGIN ─────────────────────────────────────────────
if ($method === 'POST' && $action === 'login') {
    $email    = trim($data['email']    ?? '');
    $password = $data['password']      ?? '';

    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        unset($user['password']);
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Email ou mot de passe incorrect.']);
    }
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Action inconnue.']);
