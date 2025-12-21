import { Account, Client, Databases, Storage } from 'appwrite';
import type { EnvConfig } from './client.types';

export const env: EnvConfig = {
  APPWRITE_ENDPOINT: (process.env as any)?.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID: (process.env as any)?.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
};

const client = new Client();

export function initAppwrite() {
  if (!env.APPWRITE_ENDPOINT || !env.APPWRITE_PROJECT_ID) {
    throw new Error(
      'Missing Appwrite configuration. Ensure APPWRITE_ENDPOINT and APPWRITE_PROJECT_ID are set in app.json extra or env.',
    );
  }

  client.setEndpoint(env.APPWRITE_ENDPOINT).setProject(env.APPWRITE_PROJECT_ID);

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  };
}

export const appwrite = (() => {
  try {
    return initAppwrite();
  } catch {
    // Lazy init for callers that want to handle missing config
    return null as unknown as ReturnType<typeof initAppwrite>;
  }
})();

// Database IDs (provided via env)
export const dbIds = {
  DATABASE_ID: (process.env as any)?.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  INVESTMENTS_COLLECTION_ID: (process.env as any)?.EXPO_PUBLIC_APPWRITE_INVESTMENTS_COLLECTION_ID,
  SETTINGS_COLLECTION_ID: (process.env as any)?.EXPO_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID,
  EXPENDITURES_COLLECTION_ID: (process.env as any)?.EXPO_PUBLIC_APPWRITE_EXPENDITURES_COLLECTION_ID,
};

export function ensureDbConfig() {
  const { DATABASE_ID, INVESTMENTS_COLLECTION_ID, SETTINGS_COLLECTION_ID } =
    dbIds;
  if (!DATABASE_ID || !INVESTMENTS_COLLECTION_ID) {
    throw new Error(
      'Missing Appwrite database/collection IDs for Investments. Make sure DATABASE_ID and INVESTMENTS_COLLECTION_ID env variables are set.',
    );
  }
  return { DATABASE_ID, INVESTMENTS_COLLECTION_ID, SETTINGS_COLLECTION_ID };
}

export function ensureExpenditureConfig() {
  const { DATABASE_ID, EXPENDITURES_COLLECTION_ID } = dbIds;
  if (!DATABASE_ID || !EXPENDITURES_COLLECTION_ID) {
    throw new Error(
      'Missing Appwrite database/collection IDs for Expenditures. Make sure DATABASE_ID and EXPO_PUBLIC_APPWRITE_EXPENDITURES_COLLECTION_ID env variables are set.',
    );
  }
  return { DATABASE_ID, EXPENDITURES_COLLECTION_ID };
}
