#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');
const suite = process.argv[2];

if (!suite || suite.startsWith('-')) {
  console.error('Usage: node scripts/testing/run-suite.mjs <suite>');
  console.error('Supported suites: test, unit, integration, lint, typecheck, build, e2e, e2e:backoffice, e2e:client, e2e:cross-app, e2e:matrix, e2e:real-devices, preview:smoke, load, coverage');
  process.exit(1);
}

const composeEnv = {
  ...process.env,
  CI: process.env.CI ?? 'true',
};

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const appServices = ['db', 'redis', 'backend'];
const ciComposeFiles = ['docker-compose.yml', 'docker-compose.ci.yml'];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: options.env ?? process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const code = result.status ?? 1;
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${code}`);
  }
}

function runNpm(prefix, args, env = {}) {
  run(npmCommand, ['--prefix', prefix, ...args], {
    env: {
      ...process.env,
      ...env,
    },
  });
}

function composeBaseArgs(files) {
  return [
    'compose',
    ...files.flatMap((file) => ['-f', file]),
  ];
}

function runCompose(files, args, env = {}) {
  run('docker', [...composeBaseArgs(files), ...args], {
    env: {
      ...composeEnv,
      ...env,
    },
  });
}

function dumpComposeDiagnostics(files, services = []) {
  console.error('Docker compose service status:');
  try {
    runCompose(files, ['ps']);
  } catch {
    console.error('Unable to read docker compose service status.');
  }

  console.error('Docker compose logs:');
  try {
    runCompose(files, ['logs', '--no-color', '--tail=200', ...services]);
  } catch {
    console.error('Unable to read docker compose logs.');
  }
}

async function waitForHttp(url, { expectJson = false, timeoutMs = 180_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        headers: {
          'cache-control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (expectJson) {
        const payload = await response.json();
        if (payload?.status !== 'ok') {
          throw new Error('Unexpected JSON payload');
        }
      }

      return;
    } catch (error) {
      lastError = error;
      await delay(2000);
    }
  }

  throw new Error(`Timed out waiting for ${url}${lastError ? `: ${lastError.message}` : ''}`);
}

async function withCompose(files, upArgs, task, { diagnosticServices = [] } = {}) {
  runCompose(files, upArgs);

  try {
    return await task();
  } catch (error) {
    dumpComposeDiagnostics(files, diagnosticServices);
    throw error;
  } finally {
    try {
      runCompose(files, ['down', '--volumes', '--remove-orphans']);
    } catch {
      // Best-effort cleanup. The original failure should remain visible.
    }
  }
}

async function runPreviewSmoke() {
  const files = [...ciComposeFiles, 'docker-compose.preview.yml'];
  const services = [...appServices, 'backoffice-app', 'client-app'];

  await withCompose(
    files,
    ['up', '-d', '--build', '--remove-orphans', ...services],
    async () => {
      await waitForHttp('http://127.0.0.1:8000/api/health/', { expectJson: true });
      await waitForHttp('http://127.0.0.1:3000/');
      await waitForHttp('http://127.0.0.1:3003/');
    },
    { diagnosticServices: services },
  );
}

async function runLoadTests() {
  await withCompose(
    ciComposeFiles,
    ['up', '-d', '--build', '--remove-orphans', ...appServices],
    async () => {
      await waitForHttp('http://127.0.0.1:8000/api/health/', { expectJson: true });
      runCompose(ciComposeFiles, ['run', '--rm', 'load-tester']);
    },
    { diagnosticServices: appServices },
  );
}

async function runE2E(command, env = {}, extraComposeFiles = []) {
  const files = [...ciComposeFiles, ...extraComposeFiles];
  const backendReadyUrl = 'http://127.0.0.1:8000/api/health/';
  const backofficeBaseUrl = env.BACKOFFICE_BASE_URL ?? 'http://127.0.0.1:3000';
  const clientBaseUrl = env.CLIENT_BASE_URL ?? 'http://127.0.0.1:3003';
  const services = [...appServices];

  if (command !== 'e2e:client') {
    services.push('backoffice-app');
  }

  if (command !== 'e2e:backoffice' && command !== 'e2e:ui') {
    services.push('client-app');
  }

  await withCompose(
    files,
    ['up', '-d', '--build', '--remove-orphans', ...services],
    async () => {
      await waitForHttp(backendReadyUrl, { expectJson: true });

      if (command !== 'e2e:client') {
        await waitForHttp(`${backofficeBaseUrl}/`);
      }

      if (command !== 'e2e:backoffice') {
        await waitForHttp(`${clientBaseUrl}/`);
      }

      switch (command) {
        case 'e2e':
        case 'e2e:backoffice':
          runNpm('app/frontend/backoffice-app', ['run', 'test:e2e'], {
            ...env,
            BACKOFFICE_BASE_URL: backofficeBaseUrl,
          });
          break;
        case 'e2e:client':
          runNpm('app/frontend/client-app', ['run', 'test:e2e'], {
            ...env,
            CLIENT_BASE_URL: clientBaseUrl,
          });
          break;
        case 'e2e:cross-app':
          runNpm('app/frontend/client-app', ['run', 'test:e2e'], {
            ...env,
            CLIENT_BASE_URL: clientBaseUrl,
            PLAYWRIGHT_INCLUDE_CROSS_APP: 'true',
          });
          break;
        case 'e2e:matrix':
          runNpm('app/frontend/backoffice-app', ['run', 'test:e2e'], {
            ...env,
            BACKOFFICE_BASE_URL: backofficeBaseUrl,
            PLAYWRIGHT_EXPANDED_MATRIX: 'true',
          });
          runNpm('app/frontend/client-app', ['run', 'test:e2e'], {
            ...env,
            CLIENT_BASE_URL: clientBaseUrl,
            PLAYWRIGHT_EXPANDED_MATRIX: 'true',
          });
          break;
        case 'e2e:real-devices':
          runNpm('app/frontend/backoffice-app', ['run', 'test:e2e'], {
            ...env,
            BACKOFFICE_BASE_URL: backofficeBaseUrl,
            PLAYWRIGHT_EXPANDED_MATRIX: 'true',
          });
          runNpm('app/frontend/client-app', ['run', 'test:e2e'], {
            ...env,
            CLIENT_BASE_URL: clientBaseUrl,
            PLAYWRIGHT_EXPANDED_MATRIX: 'true',
          });
          break;
        case 'e2e:ui':
          runNpm('app/frontend/backoffice-app', ['run', 'test:e2e'], {
            ...env,
            BACKOFFICE_BASE_URL: backofficeBaseUrl,
          });
          break;
        default:
          throw new Error(`Unsupported E2E suite: ${command}`);
      }
    },
    { diagnosticServices: services },
  );
}

async function main() {
  switch (suite) {
    case 'test':
    case 'unit':
      runNpm('app/frontend/backoffice-app', ['run', 'test:unit']);
      runNpm('app/frontend/client-app', ['run', 'test:unit']);
      break;
    case 'integration':
      runCompose(ciComposeFiles, ['up', '-d', '--build', '--remove-orphans', ...appServices]);
      try {
        await waitForHttp('http://127.0.0.1:8000/api/health/', { expectJson: true });
        runCompose(ciComposeFiles, ['exec', '-T', 'backend', 'python', '-m', 'pytest', 'apps/commandes/tests/test_stock_integration.py']);
      } catch (error) {
        dumpComposeDiagnostics(ciComposeFiles, appServices);
        throw error;
      } finally {
        try {
          runCompose(ciComposeFiles, ['down', '--volumes', '--remove-orphans']);
        } catch {
          // Best-effort cleanup.
        }
      }
      break;
    case 'lint':
      runNpm('app/frontend/backoffice-app', ['run', 'lint']);
      runNpm('app/frontend/client-app', ['run', 'lint']);
      break;
    case 'typecheck':
      runNpm('app/frontend/backoffice-app', ['run', 'typecheck']);
      runNpm('app/frontend/client-app', ['run', 'typecheck']);
      break;
    case 'build':
      runNpm('app/frontend/backoffice-app', ['run', 'build']);
      runNpm('app/frontend/client-app', ['run', 'build']);
      break;
    case 'coverage':
      runNpm('app/frontend/backoffice-app', ['run', 'test:coverage']);
      runNpm('app/frontend/client-app', ['run', 'test:coverage']);
      break;
    case 'preview:smoke':
      await runPreviewSmoke();
      break;
    case 'load':
      await runLoadTests();
      break;
    case 'e2e':
    case 'e2e:backoffice':
      await runE2E('e2e:backoffice', process.env);
      break;
    case 'e2e:client':
      await runE2E('e2e:client', process.env);
      break;
    case 'e2e:cross-app':
      await runE2E('e2e:cross-app', process.env);
      break;
    case 'e2e:matrix':
      await runE2E('e2e:matrix', process.env);
      break;
    case 'e2e:real-devices':
      await runE2E('e2e:real-devices', process.env);
      break;
    case 'e2e:ui':
      await runE2E('e2e:ui', process.env);
      break;
    default:
      throw new Error(`Unsupported suite: ${suite}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
