<?php
// Récepteur du formulaire de contact pour l'hébergement OVH (remplace Netlify Forms).
// Généré dans l'export par scripts/ovh/package.py : le destinataire est repris de
// contact.html au moment de l'export. Aucun message n'est conservé sur le serveur :
// si l'envoi échoue, la page affiche son message de secours (e-mail, WhatsApp).
declare(strict_types=1);

const RECIPIENT = 'contact@enertchad.com';
const RECEIPTS = ['fr' => '/contact-received', 'en' => '/contact-received-en', 'ar' => '/contact-received-ar'];
const FORMS = ['enertchad-contact-fr' => 'fr', 'enertchad-contact-en' => 'en', 'enertchad-contact-ar' => 'ar'];

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function refuse(int $code): void {
    http_response_code($code);
    header('Content-Type: text/plain; charset=utf-8');
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    refuse(405);
}
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 20000) {
    refuse(413);
}

$field = static function (string $name, int $max): string {
    $value = $_POST[$name] ?? '';
    if (!is_string($value)) {
        return '';
    }
    $value = trim(str_replace("\0", '', $value));
    return mb_substr($value, 0, $max, 'UTF-8');
};

$form = $field('form-name', 40);
$lang = FORMS[$form] ?? null;
if ($lang === null) {
    refuse(400);
}
// Champ piège : rempli uniquement par les robots. On répond comme un envoi réussi.
if ($field('website', 200) !== '') {
    header('Location: ' . RECEIPTS[$lang], true, 303);
    exit;
}

$name = $field('name', 120);
$email = $field('email', 160);
$type = $field('request_type', 80);
$organization = $field('organization', 160);
$message = $field('message', 5000);
if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    refuse(422);
}

$oneLine = static fn(string $s): string => trim(preg_replace('/[\r\n\t]+/', ' ', $s) ?? '');
$subject = 'Contact site EnerTchad [' . strtoupper($lang) . '] — ' . $oneLine($type !== '' ? $type : 'demande');
$body = implode("\n", [
    'Nouveau message reçu par le formulaire de contact de enertchad.com.',
    '',
    'Langue : ' . strtoupper($lang),
    'Type de demande : ' . $oneLine($type),
    'Nom : ' . $oneLine($name),
    'Organisation : ' . $oneLine($organization),
    'E-mail : ' . $oneLine($email),
    'Adresse IP : ' . ($_SERVER['REMOTE_ADDR'] ?? ''),
    'Date : ' . gmdate('Y-m-d H:i') . ' UTC',
    '',
    'Message :',
    $message,
    '',
    '— Répondre directement à ce courriel écrit à l’expéditeur.',
]);
$headers = [
    'Reply-To: ' . $oneLine($email),
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'MIME-Version: 1.0',
    'X-EnerTchad-Form: ' . $form,
];
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

if (!function_exists('mail') || !mail(RECIPIENT, $encodedSubject, $body, implode("\r\n", $headers))) {
    refuse(502);
}
header('Location: ' . RECEIPTS[$lang], true, 303);
