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

function withDockerStack(services, callback) {
  ensureDockerAvailable();
  run('docker', ['compose', 'up', '-d', '--build', ...services]);
  try {
    callback();
  } finally {
    run('docker', ['compose', 'down', '--remove-orphans']);
  }
}

const backendCriticalTests = [
  'apps/users/tests/test_auth.py',
  'apps/users/tests/test_register.py',
  'apps/configuration/tests/test_settings_api.py',
  'apps/paiements/tests/test_api.py',
];

const suites = {
  lint() {
    npmPrefix('app/frontend/backoffice-app', 'lint');
    npmPrefix('app/frontend/client-app', 'lint');
  },
  typecheck() {
    npmPrefix('app/frontend/backoffice-app', 'typecheck');
    npmPrefix('app/frontend/client-app', 'typecheck');
  },
  build() {
    npmPrefix('app/frontend/backoffice-app', 'build');
    npmPrefix('app/frontend/client-app', 'build');
    ensureDockerAvailable();
    run('docker', ['compose', 'build', 'backend']);
  },
  unit() {
    npmPrefix('app/frontend/backoffice-app', 'test:unit');
    npmPrefix('app/frontend/client-app', 'test:unit');
  },
  integration() {
    withDockerStack(['db', 'redis', 'backend'], () => {
      run('docker', ['compose', 'exec', '-T', 'backend', 'python', 'manage.py', 'check']);
      run('docker', ['compose', 'exec', '-T', 'backend', 'python', 'manage.py', 'makemigrations', '--check', '--dry-run']);
      run('docker', ['compose', 'exec', '-T', 'backend', 'python', '-m', 'pytest', ...backendCriticalTests]);
    });
  },
  e2e() {
    withDockerStack(['db', 'redis', 'backend', 'backoffice-app'], () => {
      npmPrefix('app/frontend/backoffice-app', 'test:e2e');
    });

    withDockerStack(['db', 'redis', 'backend', 'client-app'], () => {
      npmPrefix('app/frontend/client-app', 'test:e2e');
    });
  },
  'e2e:ui'() {
    const target = process.env.PLAYWRIGHT_APP === 'client' ? 'client-app' : 'backoffice-app';
    const prefix = target === 'client-app' ? 'app/frontend/client-app' : 'app/frontend/backoffice-app';

    withDockerStack(['db', 'redis', 'backend', target], () => {
      npmPrefix(prefix, 'test:e2e:ui');
    });
  },
  coverage() {
    npmPrefix('app/frontend/backoffice-app', 'test:coverage');
    npmPrefix('app/frontend/client-app', 'test:coverage');
  },
  test() {
    suites.lint();
    suites.typecheck();
    suites.build();
    suites.unit();
    suites.integration();
    suites.e2e();
  },
};

const suiteName = process.argv[2];
const suite = suites[suiteName];

if (!suite) {
  console.error(`Unknown suite: ${suiteName}`);
  process.exit(1);
}

suite();
