// Playwright global setup: wait for backend and frontend to be ready before tests run.
const BACKEND_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5001/api';
const FRONTEND_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

async function waitFor(url: string, desc: string, timeoutMs = 90000, intervalMs = 1500) {
  const start = Date.now();
  let lastErr: any = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' } as any);
      if (res.ok) return;
      lastErr = new Error(`Non-OK status ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Timeout waiting for ${desc} at ${url}. Last error: ${lastErr}`);
}

module.exports = async () => {
  // Wait for backend health
  await waitFor('http://localhost:5001/health', 'backend health');
  // Wait for frontend root (200 OK or 3xx)
  await waitFor(FRONTEND_URL, 'frontend');
};
