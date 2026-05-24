import { spawnSync } from 'node:child_process';
import http from 'node:http';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const isWindows = process.platform === 'win32';

function getComposeArgs(files = ['docker-compose.yml']) {
  return ['compose', ...files.flatMap((file) => ['-f', file])];
}

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
  run('docker', [...getComposeArgs(options.files), ...args], options);
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

function requestHttpStatus(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 5_000;
  const parsedUrl = new URL(url);
  const transport = parsedUrl.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = transport.request(
      parsedUrl,
      {
        method: options.method ?? 'GET',
        headers: options.headers ?? {},
      },
      (response) => {
        response.resume();
        resolve(response.statusCode ?? 0);
      },
    );

    request.on('error', reject);
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    request.end();
  });
}

async function waitForHttp(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 120_000;
  const intervalMs = options.intervalMs ?? 2_000;
  const requestTimeoutMs = options.requestTimeoutMs ?? 5_000;
  const allowedStatuses = new Set(options.allowedStatuses ?? [200, 304]);
  const deadline = Date.now() + timeoutMs;
  let lastError = 'No response received yet.';
  let lastStatus = null;

  console.log(`Waiting for ${url}...`);

  while (Date.now() < deadline) {
    try {
      const status = await requestHttpStatus(url, {
        timeoutMs: requestTimeoutMs,
        method: options.method,
        headers: options.headers,
      });
      if (allowedStatuses.has(status)) {
        console.log(`Ready: ${url} (${status})`);
        return;
      }
      lastStatus = status;
      lastError = `Unexpected status ${status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await sleep(intervalMs);
  }

  const statusSummary = lastStatus === null ? 'no HTTP status observed' : `last status ${lastStatus}`;
  throw new Error(`Timed out waiting for ${url}. Observed ${statusSummary}. Last error: ${lastError}`);
}

async function withDockerStack(services, callback, options = {}) {
  ensureDockerAvailable();
  try {
    dockerCompose(['down', '--remove-orphans'], options);
  } catch {}
  dockerCompose(['up', '-d', '--build', ...services], options);
  try {
    await callback();
  } catch (error) {
    console.error(`Docker stack callback failed for services: ${services.join(', ')}`);
    printDockerDiagnostics(services, options);
    throw error;
  } finally {
    dockerCompose(['down', '--remove-orphans'], options);
  }
}

function printDockerDiagnostics(services = [], options = {}) {
  try {
    dockerCompose(['ps'], options);
  } catch {}

  if (services.length === 0) {
    return;
  }

  try {
    dockerCompose(['logs', '--tail=200', ...services], options);
  } catch {}
}

async function runE2EForTarget(target, options = {}) {
  const config =
    target === 'client'
      ? {
          services: ['db', 'redis', 'backend', 'client-app'],
          url: 'http://127.0.0.1:3003',
          prefix: 'app/frontend/client-app',
        }
      : {
          services: ['db', 'redis', 'backend', 'backoffice-app'],
          url: 'http://127.0.0.1:3000/login',
          prefix: 'app/frontend/backoffice-app',
        };

  await withDockerStack(
    config.services,
    async () => {
      await waitForHttp(config.url);
      npmPrefix(config.prefix, 'test:e2e', options.npmArgs ?? []);
    },
    { files: options.files },
  );
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
    await runE2EForTarget('backoffice');
    await runE2EForTarget('client');
  },
  async 'e2e:matrix'() {
    await runE2EForTarget('backoffice', {
      npmArgs: [
        '--',
        '--project=guest-firefox-smoke',
        '--project=gerant-mobile-smoke',
        'tests/e2e/auth.public.spec.ts',
        'tests/e2e/backoffice.quality.spec.ts',
      ],
      files: ['docker-compose.yml'],
    });
    await runE2EForTarget('client', {
      npmArgs: [
        '--',
        '--project=firefox-smoke',
        '--project=webkit-smoke',
        '--project=mobile-chrome-smoke',
        'tests/e2e/client.browser-matrix.spec.ts',
      ],
      files: ['docker-compose.yml'],
    });
  },
  async 'e2e:backoffice'() {
    await runE2EForTarget('backoffice');
  },
  async 'e2e:client'() {
    await runE2EForTarget('client');
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
  async load() {
    await withDockerStack(
      ['db', 'redis', 'backend'],
      async () => {
        await waitForHttp('http://127.0.0.1:8000/api/users/login/', {
          allowedStatuses: [405],
        });
        dockerCompose(['run', '--rm', 'load-tester'], {
          files: ['docker-compose.yml', 'docker-compose.ci.yml'],
          env: {
            LOCUST_USERS: process.env.LOCUST_USERS ?? '15',
            LOCUST_SPAWN_RATE: process.env.LOCUST_SPAWN_RATE ?? '3',
            LOCUST_RUN_TIME: process.env.LOCUST_RUN_TIME ?? '45s',
          },
        });
      },
      { files: ['docker-compose.yml', 'docker-compose.ci.yml'] },
    );
  },
  async 'preview:smoke'() {
    await withDockerStack(
      ['db', 'redis', 'backend', 'backoffice-app', 'client-app'],
      async () => {
        await waitForHttp('http://127.0.0.1:8000/api/schema/');
        await waitForHttp('http://127.0.0.1:3000/');
        await waitForHttp('http://127.0.0.1:3003/');
      },
      { files: ['docker-compose.yml', 'docker-compose.preview.yml'] },
    );
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
