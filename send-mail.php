<?php
// kissmyapps.dev — form handler (contact + partnership forms post JSON here)
// Delivers via SMTP to localhost: the same path external mail takes, which is
// verified to reach the hello@ mailbox (PHP mail()'s sendmail submission
// routes through MX lookups and is unreliable on this host).
declare(strict_types=1);
header('Content-Type: application/json');

const MAILBOX = 'hello@kissmyapps.dev';

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

$formKind = (string) ($data['_form'] ?? '');
if ($formKind === 'partnership') {
  $kind = 'Partnership enquiry';
} elseif ($formKind === 'coin-partner') {
  $kind = 'Coin Flip partner application';
} else {
  $kind = 'Contact form';
}
$ref = $clean($data['app_name'] ?? ($data['company_or_app'] ?? ($data['channel_name'] ?? '')));
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

function smtp_send(string $to, string $subject, string $body, string $replyTo): bool
{
  $fp = @fsockopen('localhost', 25, $errno, $errstr, 10);
  if (!$fp) {
    return false;
  }

  $read = static function () use ($fp): string {
    $r = '';
    while (($l = fgets($fp, 512)) !== false) {
      $r .= $l;
      if (strlen($l) < 4 || $l[3] !== '-') {
        break;
      }
    }
    return $r;
  };
  $cmd = static function (string $c, array $okCodes) use ($fp, $read): bool {
    fwrite($fp, $c . "\r\n");
    return in_array((int) substr($read(), 0, 3), $okCodes, true);
  };

  $read(); // banner
  $helo = gethostname() ?: 'localhost.localdomain'; // exim requires an FQDN here
  $ok = $cmd('EHLO ' . $helo, [250])
    && $cmd('MAIL FROM:<' . MAILBOX . '>', [250])
    && $cmd('RCPT TO:<' . $to . '>', [250, 251])
    && $cmd('DATA', [354]);

  if ($ok) {
    $headers = 'From: KissMyApps Website <' . MAILBOX . '>' . "\r\n"
      . 'To: <' . $to . '>' . "\r\n"
      . 'Reply-To: ' . $replyTo . "\r\n"
      . 'Subject: ' . $subject . "\r\n"
      . 'Date: ' . date('r') . "\r\n"
      . 'MIME-Version: 1.0' . "\r\n"
      . 'Content-Type: text/plain; charset=UTF-8' . "\r\n";
    // normalize newlines for SMTP and dot-stuff leading periods
    $payload = str_replace("\n", "\r\n", str_replace(["\r\n", "\r"], "\n", $body));
    $payload = preg_replace('/^\./m', '..', $payload);
    $ok = $cmd($headers . "\r\n" . $payload . "\r\n.", [250]);
  }

  $cmd('QUIT', [221]);
  fclose($fp);
  return $ok;
}

if (smtp_send(MAILBOX, $subject, $body, $email)) {
  echo json_encode(['ok' => true]);
} else {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'send']);
}
