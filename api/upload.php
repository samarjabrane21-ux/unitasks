<?php
require 'headers.php';
$uploadDir = '../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Aucun fichier reçu']);
        exit;
    }
    $file = $_FILES['file'];
    $fileName = basename($file['name']);
    
    // Vérification par extension pour éviter les dépendances php-fileinfo
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowedExts = ['pdf', 'docx', 'jpg', 'jpeg', 'png', 'txt'];
    if (!in_array($ext, $allowedExts)) {
        http_response_code(400);
        echo json_encode(['error' => 'Format de fichier non autorisé. Utilisez PDF, Word ou Image.']);
        exit;
    }
    $targetPath = $uploadDir . time() . '_' . $fileName;
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        echo json_encode(['success' => true, 'fileName' => basename($targetPath)]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Échec du téléversement du fichier']);
    }
    exit;
}
http_response_code(400);
echo json_encode(['error' => 'Requête invalide']);
