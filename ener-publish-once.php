<?php
declare(strict_types=1);

// Internal OVH cron only. No HTTP endpoint, shell command or user-supplied path.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

const SOURCE_REVISION = 'd7cc3e4d4d08280e9704cd1c476d6b25cc684c77';
// En ligne avant cette publication : 7a2f41ade, ou ae9d014fe si la publication de secours précédente est passée.
const EXPECTED_TARGET_REVISIONS = ['7a2f41adeea049830d1dee55a013326a686d9f76', 'ae9d014fec9bb0ce28dc7c809cfa6d1fbac73aab'];

function requireSafeParents(string $root, string $relative): void {
    if ($relative === '' || str_starts_with($relative, '/') || preg_match('/[\x00-\x1f\\\\]/', $relative)) {
        throw new RuntimeException('Unsafe relative path');
    }
    $parts = explode('/', $relative);
    $path = $root;
    foreach ($parts as $part) {
        if ($part === '' || $part === '.' || $part === '..' || $part === '.git') {
            throw new RuntimeException('Forbidden path component');
        }
        $path .= '/' . $part;
        if (is_link($path)) {
            throw new RuntimeException('Symbolic link refused: ' . $relative);
        }
        if ($part !== end($parts) && file_exists($path) && !is_dir($path)) {
            throw new RuntimeException('Parent is not a directory: ' . $relative);
        }
    }
}

function ensureDirectory(string $path, int $mode = 0700): void {
    if (!is_dir($path) && !mkdir($path, $mode, true) && !is_dir($path)) {
        throw new RuntimeException('Cannot create directory');
    }
}

function checkedCopy(string $from, string $to, string $hash): void {
    if (!copy($from, $to) || hash_file('sha256', $to) !== $hash) {
        throw new RuntimeException('Copy or checksum failed');
    }
}

$lock = null;
$installed = [];
$backups = [];
$target = '';
$stage = '';
$backupRoot = '';
try {
    $source = realpath(__DIR__);
    if ($source === false || basename($source) !== 'www' || is_link(__DIR__)) {
        throw new RuntimeException('Expected the www staging directory');
    }
    $home = dirname($source);
    $target = $home . '/www-git';
    if (is_link($target) || realpath($target) !== $target || !is_dir($target)) {
        throw new RuntimeException('Expected the existing www-git directory');
    }
    $private = $home . '/.enertchad-publication';
    if (is_link($private)) {
        throw new RuntimeException('Private directory cannot be a link');
    }
    ensureDirectory($private);
    chmod($private, 0700);
    $lock = fopen($private . '/publication.lock', 'c');
    if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB)) {
        throw new RuntimeException('Another publication is active');
    }
    $done = $private . '/' . SOURCE_REVISION . '.done.json';
    if (is_file($done)) {
        echo "ALREADY_COMPLETED " . SOURCE_REVISION . "\n";
        exit(0);
    }
    foreach ([$source, $target] as $root) {
        if (file_exists($root . '/.git/index.lock')) {
            throw new RuntimeException('An active Git lock prevents publication');
        }
    }
    $current = trim((string)file_get_contents($target . '/deploy-version.txt'));
    if (!in_array($current, EXPECTED_TARGET_REVISIONS, true)) {
        throw new RuntimeException('Target version changed; publication refused');
    }
    if (trim((string)file_get_contents($source . '/deploy-version.txt')) !== SOURCE_REVISION) {
        throw new RuntimeException('Unexpected source version');
    }
    $manifest = json_decode((string)file_get_contents($source . '/ener-publish-manifest.json'), true, 512, JSON_THROW_ON_ERROR);
    if (($manifest['revision'] ?? '') !== SOURCE_REVISION || !is_array($manifest['files'] ?? null) || count($manifest['files']) < 100) {
        throw new RuntimeException('Invalid release manifest');
    }
    $files = $manifest['files'];
    $imageCount = 0;
    foreach ($files as $relative => $hash) {
        requireSafeParents($source, $relative);
        requireSafeParents($target, $relative);
        if (!is_string($hash) || !preg_match('/^[a-f0-9]{64}$/', $hash) || !is_file($source . '/' . $relative) || hash_file('sha256', $source . '/' . $relative) !== $hash) {
            throw new RuntimeException('Source integrity check failed: ' . $relative);
        }
    }
    if (count($files) !== 692 || !isset($files['deploy-version.txt'], $files['.htaccess'], $files['index.html'], $files['ar.html'])) {
        throw new RuntimeException('Incomplete release');
    }
    // Assets first, then PHP/configuration, then pages, and the version marker last.
    $priority = static function(string $path): int {
        if ($path === 'deploy-version.txt') return 4;
        if ($path === '.htaccess') return 3;
        if (str_ends_with($path, '.html') || str_ends_with($path, '.txt')) return 2;
        return 1;
    };
    uksort($files, static fn(string $a, string $b): int => ($priority($a) <=> $priority($b)) ?: strcmp($a, $b));
    $run = SOURCE_REVISION . '-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(4));
    $backupRoot = $private . '/backups/' . $run;
    $stage = $private . '/staging/' . $run;
    ensureDirectory($backupRoot);
    ensureDirectory($stage);
    $changes = [];
    foreach ($files as $relative => $hash) {
        $destination = $target . '/' . $relative;
        if (is_file($destination) && hash_file('sha256', $destination) === $hash) continue;
        if (file_exists($destination) && !is_file($destination)) {
            throw new RuntimeException('Destination is not a regular file: ' . $relative);
        }
        $staged = $stage . '/' . $relative;
        ensureDirectory(dirname($staged));
        checkedCopy($source . '/' . $relative, $staged, $hash);
        chmod($staged, 0644);
        if (is_file($destination)) {
            $backup = $backupRoot . '/' . $relative;
            ensureDirectory(dirname($backup));
            $oldHash = hash_file('sha256', $destination);
            checkedCopy($destination, $backup, $oldHash);
            $backups[$relative] = $oldHash;
        }
        $changes[] = $relative;
    }
    // Nothing in the document root changes until every source and backup is verified.
    if (trim((string)file_get_contents($target . '/deploy-version.txt')) !== $current) {
        throw new RuntimeException('Target changed during preparation');
    }
    foreach ($changes as $relative) {
        requireSafeParents($target, $relative);
        $destination = $target . '/' . $relative;
        if (isset($backups[$relative])) {
            if (!is_file($destination) || hash_file('sha256', $destination) !== $backups[$relative]) {
                throw new RuntimeException('Destination changed after backup: ' . $relative);
            }
        } elseif (file_exists($destination)) {
            throw new RuntimeException('A new destination appeared during preparation: ' . $relative);
        }
        ensureDirectory(dirname($destination), 0755);
        if (!rename($stage . '/' . $relative, $destination)) {
            throw new RuntimeException('Atomic replacement failed: ' . $relative);
        }
        $installed[] = $relative;
        if (hash_file('sha256', $destination) !== $files[$relative]) {
            throw new RuntimeException('Installed checksum mismatch');
        }
    }
    foreach ($files as $relative => $hash) {
        if (hash_file('sha256', $target . '/' . $relative) !== $hash) {
            throw new RuntimeException('Final release verification failed: ' . $relative);
        }
    }
    $result = ['revision' => SOURCE_REVISION, 'verified_files' => count($files), 'replaced_files' => count($changes), 'completed_utc' => gmdate('c')];
    if (file_put_contents($done, json_encode($result, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR), LOCK_EX) === false) {
        throw new RuntimeException('Cannot save completion marker');
    }
    chmod($done, 0600);
    echo 'SUCCESS ' . json_encode($result, JSON_THROW_ON_ERROR) . "\n";
} catch (Throwable $error) {
    $rollbackErrors = [];
    foreach (array_reverse($installed) as $relative) {
        $destination = $target . '/' . $relative;
        if (isset($backups[$relative])) {
            $temporary = $stage . '/rollback-' . bin2hex(random_bytes(8));
            if (!copy($backupRoot . '/' . $relative, $temporary) || hash_file('sha256', $temporary) !== $backups[$relative] || !rename($temporary, $destination)) {
                $rollbackErrors[] = $relative;
            }
        } elseif (is_file($destination) && !unlink($destination)) {
            $rollbackErrors[] = $relative;
        }
    }
    fwrite(STDERR, 'REFUSED_OR_ROLLED_BACK: ' . $error->getMessage() . "\n");
    if ($rollbackErrors !== []) fwrite(STDERR, 'ROLLBACK_ERRORS: ' . implode(', ', $rollbackErrors) . "\n");
    exit(1);
} finally {
    if (is_resource($lock)) {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}
