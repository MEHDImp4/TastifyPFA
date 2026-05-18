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

export default async function globalSetup() {
  const baseURL = process.env.BACKOFFICE_BASE_URL ?? 'http://127.0.0.1:3000';
  await waitForApp(baseURL);
}
