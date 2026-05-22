<?php
require 'db.php';
try {
    $stmt = $pdo->query('
        SELECT rp.*, u1.username as student_name, u2.username as teacher_name 
        FROM revision_plans rp 
        JOIN users u1 ON rp.student_id = u1.id 
        LEFT JOIN users u2 ON rp.teacher_id = u2.id 
        ORDER BY rp.created_at DESC
    ');
    var_dump($stmt->fetchAll());
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
