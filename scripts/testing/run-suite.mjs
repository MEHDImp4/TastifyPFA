import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const isWindows = process.platform === 'win32';

function getComposeArgs(files = ['docker-compose.yml'], envFile = null) {
  return ['compose', ...(envFile ? ['--env-file', envFile] : []), ...files.flatMap((file) => ['-f', file])];
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
  run('docker', [...getComposeArgs(options.files, options.envFile), ...args], options);
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
  const body = options.body ?? null;
  const headers = { ...(options.headers ?? {}) };

  if (body !== null && !Object.keys(headers).some((header) => header.toLowerCase() === 'content-length')) {
    headers['Content-Length'] = Buffer.byteLength(body);
  }

  return new Promise((resolve, reject) => {
    const request = transport.request(
      parsedUrl,
      {
        method: options.method ?? 'GET',
        headers,
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
    if (body !== null) {
      request.write(body);
    }
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

function buildTestEnvFile(overrides = {}) {
  const sourcePath = fs.existsSync(path.resolve(repoRoot, '.env'))
    ? path.resolve(repoRoot, '.env')
    : path.resolve(repoRoot, 'app/backend/.env.example');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tastify-runner-'));
  const tempEnvPath = path.join(tempDir, '.env');
  let content = fs.readFileSync(sourcePath, 'utf8');

  for (const [key, value] of Object.entries(overrides)) {
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    const line = `${key}=${value}`;
    content = pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`;
  }

  fs.writeFileSync(tempEnvPath, content, 'utf8');
  return {
    envFile: tempEnvPath,
    cleanup() {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    },
  };
}

function buildComposeOverrideFile(content) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tastify-compose-'));
  const overridePath = path.join(tempDir, 'docker-compose.override.yml');
  fs.writeFileSync(overridePath, content, 'utf8');
  return {
    file: overridePath,
    cleanup() {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    },
  };
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
  const backendReadiness = {
    url: 'http://127.0.0.1:8000/api/users/login/',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'healthcheck', password: 'healthcheck' }),
    allowedStatuses: [200, 400, 401, 405],
  };
  const config =
    target === 'client'
      ? {
          services: ['db', 'redis', 'backend', 'client-app'],
          readinessChecks: [backendReadiness, { url: 'http://127.0.0.1:3003' }],
          prefix: 'app/frontend/client-app',
        }
      : {
          services: ['db', 'redis', 'backend', 'backoffice-app'],
          readinessChecks: [
            backendReadiness,
            { url: 'http://127.0.0.1:3000/login' },
            {
              url: 'http://127.0.0.1:3000/api/users/login/',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: 'healthcheck', password: 'healthcheck' }),
              allowedStatuses: [200, 400, 401],
            },
          ],
          prefix: 'app/frontend/backoffice-app',
        };

  const emailOverride =
    target === 'client'
      ? buildComposeOverrideFile(`services:
  backend:
    environment:
      EMAIL_BACKEND: django.core.mail.backends.console.EmailBackend
  celery-worker:
    environment:
      EMAIL_BACKEND: django.core.mail.backends.console.EmailBackend
  celery-beat:
    environment:
      EMAIL_BACKEND: django.core.mail.backends.console.EmailBackend
`)
      : null;

  try {
    await withDockerStack(
      config.services,
      async () => {
        for (const readinessCheck of config.readinessChecks) {
          await waitForHttp(readinessCheck.url, readinessCheck);
        }
        run('npm', ['run', 'test:e2e', ...(options.npmArgs ?? [])], {
          cwd: path.resolve(repoRoot, config.prefix),
          env: options.env,
        });
      },
      {
        files: emailOverride
          ? [...(options.files ?? ['docker-compose.yml']), emailOverride.file]
          : options.files,
      },
    );
  } finally {
    emailOverride?.cleanup();
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
    await runE2EForTarget('backoffice');
    await runE2EForTarget('client');
  },
  async 'e2e:matrix'() {
    await runE2EForTarget('backoffice', {
      npmArgs: [
        '--',
        '--project=guest-firefox-smoke',
        '--project=gerant-mobile-smoke',
        // No file filters — testMatch per project handles selection, and the
        // implicit 'setup' dependency runs auth.setup.ts to create .auth/*.json
        // before gerant-mobile-smoke loads its storageState.
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
  async 'e2e:cross-app'() {
    const composeOverride = buildComposeOverrideFile(`services:
  backend:
    environment:
      EMAIL_BACKEND: django.core.mail.backends.console.EmailBackend
  celery-worker:
    environment:
      EMAIL_BACKEND: django.core.mail.backends.console.EmailBackend
  celery-beat:
    environment:
      EMAIL_BACKEND: django.core.mail.backends.console.EmailBackend
`);

    try {
      await withDockerStack(
        ['db', 'redis', 'backend', 'backoffice-app', 'client-app'],
        async () => {
          await waitForHttp('http://127.0.0.1:3000/login');
          await waitForHttp('http://127.0.0.1:3000/api/users/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'healthcheck', password: 'healthcheck' }),
            allowedStatuses: [200, 400, 401],
          });
          await waitForHttp('http://127.0.0.1:3003');
          run('npm', ['run', 'test:e2e',
            '--',
            '--project=chromium',
            'tests/e2e/client.cross-app.spec.ts',
          ], {
            cwd: path.resolve(repoRoot, 'app/frontend/client-app'),
            env: {
              PLAYWRIGHT_INCLUDE_CROSS_APP: 'true',
            },
          });
        },
        { files: ['docker-compose.yml', composeOverride.file] },
      );
    } finally {
      composeOverride.cleanup();
    }
  },
  async 'e2e:real-devices'() {
    const provider = process.env.PLAYWRIGHT_REAL_DEVICE_PROVIDER;
    if (!provider) {
      console.log('Skipping real-device matrix: no PLAYWRIGHT_REAL_DEVICE_PROVIDER configured.');
      return;
    }

    console.log(`Running device-lab-ready smoke with provider profile: ${provider}`);
    await suites['e2e:matrix']();
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
    const loadContainerName = 'tastifypfa-load-tester-runner';

    await withDockerStack(
      ['db', 'redis', 'backend'],
      async () => {
        await waitForHttp('http://127.0.0.1:8000/api/users/login/', {
          allowedStatuses: [405],
        });

        try {
          run('docker', ['rm', '-f', loadContainerName], { stdio: 'ignore' });
        } catch {}

        try {
          dockerCompose(['run', '--name', loadContainerName, 'load-tester'], {
            files: ['docker-compose.yml', 'docker-compose.ci.yml'],
            env: {
              LOCUST_USERS: process.env.LOCUST_USERS ?? '15',
              LOCUST_SPAWN_RATE: process.env.LOCUST_SPAWN_RATE ?? '3',
              LOCUST_RUN_TIME: process.env.LOCUST_RUN_TIME ?? '45s',
            },
          });
        } finally {
          try {
            run('docker', ['cp', `${loadContainerName}:/workspace/artifacts/load-tests/.`, 'artifacts/load-tests'], {
              stdio: 'inherit',
            });
          } catch {}

          try {
            run('docker', ['rm', '-f', loadContainerName], { stdio: 'ignore' });
          } catch {}
        }

        run('node', ['scripts/testing/check-load-report.mjs', 'artifacts/load-tests'], {
          env: {
            LOAD_MAX_P95_MS: process.env.LOAD_MAX_P95_MS ?? '1500',
            LOAD_MAX_AVG_MS: process.env.LOAD_MAX_AVG_MS ?? '800',
            LOAD_MAX_FAIL_RATIO: process.env.LOAD_MAX_FAIL_RATIO ?? '0.02',
            LOAD_MIN_REQUESTS: process.env.LOAD_MIN_REQUESTS ?? '40',
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
