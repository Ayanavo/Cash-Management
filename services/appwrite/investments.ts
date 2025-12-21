import { ID, Permission, Role } from 'appwrite';
import { ensureDbConfig, initAppwrite } from './client';

export async function createInvestmentDocument(document: Record<string, any>) {
  const ctx = initAppwrite();
  const { DATABASE_ID, INVESTMENTS_COLLECTION_ID } = ensureDbConfig();

  try {
    const user = await ctx.account.get();
    const userId = user.$id;
    const data = { ...document, userId };

    return await ctx.databases.createDocument(
      DATABASE_ID,
      INVESTMENTS_COLLECTION_ID,
      ID.unique(),
      data,
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ],
    );
  } catch (error: any) {
    console.error('Appwrite createInvestmentDocument failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}

export async function listInvestmentDocuments() {
  const ctx = initAppwrite();
  const { DATABASE_ID, INVESTMENTS_COLLECTION_ID } = ensureDbConfig();

  try {
    const user = await ctx.account.get();
    const userId = user.$id;

    const res = await ctx.databases.listDocuments(
      DATABASE_ID,
      INVESTMENTS_COLLECTION_ID,
      [],
    );

    // Filter by userId client-side if query APIs differ across SDK versions
    return res.documents.filter((d: any) => String(d.userId) === userId);
  } catch (error: any) {
    console.error('Appwrite listInvestmentDocuments failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}

export async function updateInvestmentStatus(
  documentId: string,
  status: 'paid' | 'pending' | 'dismissed',
) {
  const ctx = initAppwrite();
  const { DATABASE_ID, INVESTMENTS_COLLECTION_ID } = ensureDbConfig();

  try {
    return await ctx.databases.updateDocument(
      DATABASE_ID,
      INVESTMENTS_COLLECTION_ID,
      documentId,
      { status },
    );
  } catch (error: any) {
    console.error('Appwrite updateInvestmentStatus failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}

export async function deleteInvestmentDocument(documentId: string) {
  const ctx = initAppwrite();
  const { DATABASE_ID, INVESTMENTS_COLLECTION_ID } = ensureDbConfig();
  try {
    return await ctx.databases.deleteDocument(
      DATABASE_ID,
      INVESTMENTS_COLLECTION_ID,
      documentId,
    );
  } catch (error: any) {
    console.error('Appwrite deleteInvestmentDocument failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}


