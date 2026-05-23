import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const isWindows = process.platform === 'win32';

function run(command, args, options = {}) {
  const pretty = [command, ...args].join(' ');
  console.log(`\n> ${pretty}`);

  const baseOptions = {
    cwd: options.cwd ?? repoRoot,
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, ...options.env },
  };
  const result = isWindows
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', [command, ...args].join(' ')], baseOptions)
    : spawnSync(command, args, baseOptions);

  if (result.status !== 0) {
    throw new Error(`Command failed: ${pretty}`);
  }
}

function dockerCompose(args, options = {}) {
  run('docker', ['compose', ...args], options);
}

function npmPrefix(prefix, script, extraArgs = []) {
  run('npm', ['run', script, ...extraArgs], { cwd: path.resolve(repoRoot, prefix) });
}

function ensureDockerAvailable() {
  const result = isWindows
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', 'docker version'], {
        cwd: repoRoot,
        stdio: 'ignore',
        shell: false,
        env: process.env,
      })
    : spawnSync('docker', ['version'], {
        cwd: repoRoot,
        stdio: 'ignore',
        shell: false,
        env: process.env,
      });

  if (result.status !== 0) {
    throw new Error('Docker is required for backend, integration, and E2E suites. Start Docker Desktop or target frontend-only scripts.');
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 120_000;
  const intervalMs = options.intervalMs ?? 2_000;
  const requestTimeoutMs = options.requestTimeoutMs ?? 5_000;
  const allowedStatuses = new Set(options.allowedStatuses ?? [200, 304]);
  const requestInit = options.requestInit ?? { redirect: 'manual' };
  const deadline = Date.now() + timeoutMs;
  let lastError = 'No response received yet.';
  let lastStatus = null;

  console.log(`Waiting for ${url}...`);

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        ...requestInit,
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      if (allowedStatuses.has(response.status)) {
        console.log(`Ready: ${url} (${response.status})`);
        return;
      }
      lastStatus = response.status;
      lastError = `Unexpected status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await sleep(intervalMs);
  }

  const statusSummary = lastStatus === null ? 'no HTTP status observed' : `last status ${lastStatus}`;
  throw new Error(`Timed out waiting for ${url}. Observed ${statusSummary}. Last error: ${lastError}`);
}

function printDockerDiagnostics(services = []) {
  try {
    dockerCompose(['ps']);
  } catch {}

  if (services.length === 0) {
    return;
  }

  try {
    dockerCompose(['logs', '--tail=200', ...services]);
  } catch {}
}

async function withDockerStack(services, callback) {
  ensureDockerAvailable();
  dockerCompose(['up', '-d', '--build', ...services]);
  try {
    await callback();
  } catch (error) {
    console.error(`Docker stack callback failed for services: ${services.join(', ')}`);
    printDockerDiagnostics(services);
    throw error;
  } finally {
    dockerCompose(['down', '--remove-orphans']);
  }
}

const suites = {
  async lint() {
    npmPrefix('app/frontend/backoffice-app', 'lint');
    npmPrefix('app/frontend/client-app', 'lint');
  },
  async typecheck() {
    npmPrefix('app/frontend/backoffice-app', 'typecheck');
    npmPrefix('app/frontend/client-app', 'typecheck');
  },
  async build() {
    npmPrefix('app/frontend/backoffice-app', 'build');
    npmPrefix('app/frontend/client-app', 'build');
    ensureDockerAvailable();
    run('docker', ['compose', 'build', 'backend']);
  },
  async unit() {
    npmPrefix('app/frontend/backoffice-app', 'test:unit');
    npmPrefix('app/frontend/client-app', 'test:unit');
  },
  async integration() {
    await withDockerStack(['db', 'redis', 'backend'], async () => {
      dockerCompose(['exec', '-T', 'backend', 'python', 'manage.py', 'check']);
      dockerCompose(['exec', '-T', 'backend', 'python', 'manage.py', 'makemigrations', '--check', '--dry-run']);
      dockerCompose([
        'exec',
        '-T',
        '-e',
        'DJANGO_SETTINGS_MODULE=tastify_backend.settings.test',
        'backend',
        'python',
        '-m',
        'pytest',
        '-q',
      ]);
    });
  },
  async e2e() {
    await withDockerStack(['db', 'redis', 'backend', 'backoffice-app'], async () => {
      await waitForHttp('http://127.0.0.1:3000/login');
      npmPrefix('app/frontend/backoffice-app', 'test:e2e');
    });

    await withDockerStack(['db', 'redis', 'backend', 'client-app'], async () => {
      await waitForHttp('http://127.0.0.1:3003');
      npmPrefix('app/frontend/client-app', 'test:e2e');
    });
  },
  async 'e2e:ui'() {
    const target = process.env.PLAYWRIGHT_APP === 'client' ? 'client-app' : 'backoffice-app';
    const prefix = target === 'client-app' ? 'app/frontend/client-app' : 'app/frontend/backoffice-app';
    const url = target === 'client-app' ? 'http://127.0.0.1:3003' : 'http://127.0.0.1:3000/login';

    await withDockerStack(['db', 'redis', 'backend', target], async () => {
      await waitForHttp(url);
      npmPrefix(prefix, 'test:e2e:ui');
    });
  },
  async coverage() {
    npmPrefix('app/frontend/backoffice-app', 'test:coverage');
    npmPrefix('app/frontend/client-app', 'test:coverage');
  },
  async test() {
    await suites.lint();
    await suites.typecheck();
    await suites.build();
    await suites.unit();
    await suites.integration();
    await suites.e2e();
  },
};

const suiteName = process.argv[2];
const suite = suites[suiteName];

if (!suite) {
  console.error(`Unknown suite: ${suiteName}`);
  process.exit(1);
}

try {
  await suite();
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
}
