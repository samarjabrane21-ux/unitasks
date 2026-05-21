<?php
require 'headers.php';
require 'db.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 1;

$tasks    = $pdo->prepare('SELECT status, priority FROM tasks WHERE user_id = ?');
$tasks->execute([$user_id]);
$all      = $tasks->fetchAll();

$total  = count($all);
$done   = count(array_filter($all, fn($t) => $t['status'] === 'done'));
$doing  = count(array_filter($all, fn($t) => $t['status'] === 'doing'));
$todo   = count(array_filter($all, fn($t) => $t['status'] === 'todo'));
$urgent = count(array_filter($all, fn($t) => $t['priority'] === 'urgent'));
$pct    = $total > 0 ? round(($done / $total) * 100) : 0;

$notes_count = $pdo->prepare('SELECT COUNT(*) FROM notes WHERE user_id = ?');
$notes_count->execute([$user_id]);
$notes = (int)$notes_count->fetchColumn();

$proj_count = $pdo->prepare('SELECT COUNT(*) FROM projects WHERE user_id = ?');
$proj_count->execute([$user_id]);
$projects = (int)$proj_count->fetchColumn();

echo json_encode([
    'total'    => $total,
    'done'     => $done,
    'doing'    => $doing,
    'todo'     => $todo,
    'urgent'   => $urgent,
    'percent'  => $pct,
    'notes'    => $notes,
    'projects' => $projects,
]);
