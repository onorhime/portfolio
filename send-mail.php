<?php
// kissmyapps.dev — form handler (contact + partnership forms post JSON here)
declare(strict_types=1);
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'method']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  $data = $_POST;
}

// honeypot filled → bot; pretend success
if (!empty($data['_gotcha'])) {
  echo json_encode(['ok' => true]);
  exit;
}

$clean = static function ($v): string {
  return str_replace(["\r", "\n"], ' ', trim((string) $v));
};

$name  = $clean($data['name'] ?? '');
$email = $clean($data['email'] ?? '');

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'validation']);
  exit;
}

$kind = (($data['_form'] ?? '') === 'partnership') ? 'Partnership enquiry' : 'Contact form';
$ref  = $clean($data['app_name'] ?? ($data['company_or_app'] ?? ''));
$subject = $kind . ($ref !== '' ? ' — ' . $ref : '') . ' · kissmyapps.dev';

$lines = [];
foreach ($data as $key => $value) {
  if (in_array($key, ['_gotcha', '_form'], true)) {
    continue;
  }
  $label = ucfirst(str_replace('_', ' ', (string) $key));
  $lines[] = $label . ': ' . trim((string) $value);
}
$body = implode("\n", $lines)
  . "\n\n— " . $kind . ', sent ' . gmdate('Y-m-d H:i \U\T\C')
  . ' from ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown IP');

$headers = implode("\r\n", [
  'From: KissMyApps Website <forms@kissmyapps.dev>',
  'Reply-To: ' . $email,
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
]);

if (mail('hello@kissmyapps.dev', $subject, $body, $headers)) {
  echo json_encode(['ok' => true]);
} else {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'send']);
}
