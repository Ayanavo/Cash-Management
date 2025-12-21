import { Query } from 'appwrite';
import { ensureDbConfig, initAppwrite } from './client';

export async function resetCurrentUserData() {
  const ctx = initAppwrite();
  const { DATABASE_ID, INVESTMENTS_COLLECTION_ID, SETTINGS_COLLECTION_ID } =
    ensureDbConfig();
  try {
    const user = await ctx.account.get();
    const userId = user.$id;

    if (SETTINGS_COLLECTION_ID) {
      const settingsRes = await ctx.databases.listDocuments({
        databaseId: DATABASE_ID,
        collectionId: SETTINGS_COLLECTION_ID,
        queries: [Query.equal('userId', userId)],
      });
      for (const d of settingsRes.documents ?? []) {
        await ctx.databases.deleteDocument(
          DATABASE_ID,
          SETTINGS_COLLECTION_ID,
          d.$id,
        );
      }
    }

    const invRes = await ctx.databases.listDocuments(
      DATABASE_ID,
      INVESTMENTS_COLLECTION_ID,
      [Query.equal('userId', userId)],
    );
    for (const d of invRes.documents ?? []) {
      await ctx.databases.deleteDocument(
        DATABASE_ID,
        INVESTMENTS_COLLECTION_ID,
        d.$id,
      );
    }
    return true;
  } catch (error: any) {
    console.error('Appwrite resetCurrentUserData failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}

export async function resetAccount() {
  return await resetCurrentUserData();
}


