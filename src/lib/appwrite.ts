import { Account, Client } from 'appwrite';

function normalizeAppwriteEndpoint(value: string) {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error('VITE_APPWRITE_ENDPOINT must be a valid URL');
  }

  const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
  const isLocal = localHosts.has(parsed.hostname);

  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLocal)) {
    throw new Error('VITE_APPWRITE_ENDPOINT must use HTTPS unless it points to localhost');
  }

  return parsed.toString().replace(/\/+$/g, '');
}

function getAppwriteConfig() {
  const endpointRaw = String(import.meta.env.VITE_APPWRITE_ENDPOINT ?? '').trim();
  const projectId = String(import.meta.env.VITE_APPWRITE_PROJECT_ID ?? '').trim();

  if (!endpointRaw || endpointRaw.includes('YOUR_')) {
    throw new Error('Missing required environment variable: VITE_APPWRITE_ENDPOINT');
  }

  if (!projectId || projectId.includes('YOUR_')) {
    throw new Error('Missing required environment variable: VITE_APPWRITE_PROJECT_ID');
  }

  return {
    endpoint: normalizeAppwriteEndpoint(endpointRaw),
    projectId,
  };
}

let clientInstance: Client | null = null;
let accountInstance: Account | null = null;

export function getClient() {
  if (!clientInstance) {
    const config = getAppwriteConfig();
    clientInstance = new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.projectId);
  }

  return clientInstance;
}

export function getAccount() {
  if (!accountInstance) {
    accountInstance = new Account(getClient());
  }

  return accountInstance;
}
