import { Query } from 'appwrite';
import { ensureDbConfig, initAppwrite } from './client';

export async function getProfileSettings() {
  const ctx = initAppwrite();
  const { DATABASE_ID, SETTINGS_COLLECTION_ID } = ensureDbConfig();
  if (!SETTINGS_COLLECTION_ID) {
    throw new Error(
      'Missing Appwrite SETTINGS_COLLECTION_ID (profilesettings).',
    );
  }
  try {
    const user = await ctx.account.get();
    const userId = user.$id;
    const res = await ctx.databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: SETTINGS_COLLECTION_ID,
      queries: [Query.equal('userId', userId), Query.limit(1)],
    });
    return res.documents?.[0] ?? null;
  } catch (error: any) {
    console.error('Appwrite getProfileSettings failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}

export async function upsertProfileSettings(data: Record<string, any>) {
  const ctx = initAppwrite();
  const { DATABASE_ID, SETTINGS_COLLECTION_ID } = ensureDbConfig();
  if (!SETTINGS_COLLECTION_ID) {
    throw new Error(
      'Missing Appwrite SETTINGS_COLLECTION_ID (profilesettings).',
    );
  }
  try {
    const user = await ctx.account.get();
    const userId = user.$id;
    const base = { ...data, userId };
    const existing = await ctx.databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: SETTINGS_COLLECTION_ID,
      queries: [Query.equal('userId', userId), Query.limit(1)],
    });
    const doc = existing.documents?.[0];
    if (doc) {
      return await ctx.databases.updateDocument(
        DATABASE_ID,
        SETTINGS_COLLECTION_ID,
        doc.$id,
        base,
      );
    }
    return await ctx.databases.createDocument(
      DATABASE_ID,
      SETTINGS_COLLECTION_ID,
      'unique()', // Using server-side unique id if supported; otherwise replace with ID.unique() on web SDK
      base,
    );
  } catch (error: any) {
    console.error('Appwrite upsertProfileSettings failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}


