async function waitForApp(baseURL: string) {
  const deadline = Date.now() + 90_000;
  let lastError = 'No response received yet.';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseURL}/login`, { redirect: 'manual' });
      if (response.ok || response.status === 304) {
        return;
      }
      lastError = `Unexpected status ${response.status} on ${baseURL}/login`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  throw new Error(
    `Backoffice app is unreachable at ${baseURL}. Start Docker services first with "docker compose up -d --build backend backoffice-app". Last error: ${lastError}`,
  );
}

async function waitForAuthApi(baseURL: string) {
  const deadline = Date.now() + 90_000;
  let lastError = 'No response received yet.';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseURL}/api/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'healthcheck', password: 'healthcheck' }),
      });

      if ([200, 400, 401].includes(response.status)) {
        return;
      }

      lastError = `Unexpected status ${response.status} on ${baseURL}/api/users/login/`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  throw new Error(
    `Backoffice auth API is unreachable at ${baseURL}/api/users/login/. Start Docker services first with "docker compose up -d --build backend backoffice-app". Last error: ${lastError}`,
  );
}

export default async function globalSetup() {
  const baseURL = process.env.BACKOFFICE_BASE_URL ?? 'http://127.0.0.1:3000';
  await waitForApp(baseURL);
  if (process.env.BACKOFFICE_SKIP_AUTH_HEALTHCHECK === 'true') {
    return;
  }
  await waitForAuthApi(baseURL);
}
