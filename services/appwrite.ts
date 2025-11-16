import { Client, Account, Databases, Storage, ID } from 'appwrite';

type EnvConfig = {
	APPWRITE_ENDPOINT?: string;
	APPWRITE_PROJECT_ID?: string;
};

const env: EnvConfig = {
	APPWRITE_ENDPOINT:
		(process.env as any)?.EXPO_PUBLIC_APPWRITE_ENDPOINT ??
		(process.env as any)?.APPWRITE_ENDPOINT,
	APPWRITE_PROJECT_ID:
		(process.env as any)?.EXPO_PUBLIC_APPWRITE_PROJECT_ID ??
		(process.env as any)?.APPWRITE_PROJECT_ID,
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
const dbIds = {
	DATABASE_ID:
		(process.env as any)?.EXPO_PUBLIC_APPWRITE_DATABASE_ID ??
		(process.env as any)?.APPWRITE_DATABASE_ID,
	INVESTMENTS_COLLECTION_ID:
		(process.env as any)?.EXPO_PUBLIC_APPWRITE_INVESTMENTS_COLLECTION_ID ??
		(process.env as any)?.APPWRITE_INVESTMENTS_COLLECTION_ID,
};

export async function createInvestmentDocument(document: Record<string, any>) {
	const ctx = initAppwrite();
	if (!dbIds.DATABASE_ID || !dbIds.INVESTMENTS_COLLECTION_ID) {
		throw new Error('Missing Appwrite database/collection IDs for Investments.');
	}
	try {
		return await ctx.databases.createDocument({
			databaseId: dbIds.DATABASE_ID,
			collectionId: dbIds.INVESTMENTS_COLLECTION_ID,
			documentId: ID.unique(),
			data: document,
		});
	} catch (error: any) {
		// Log helpful context for debugging, then rethrow so caller can handle (e.g., toast)
		console.error('Appwrite createInvestmentDocument failed', {
			databaseId: dbIds.DATABASE_ID,
			collectionId: dbIds.INVESTMENTS_COLLECTION_ID,
			errorMessage: error?.message,
			errorCode: error?.code ?? error?.status,
		});
		
		throw error;
	}
}

export async function listInvestmentDocuments() {
	const ctx = initAppwrite();
	if (!dbIds.DATABASE_ID || !dbIds.INVESTMENTS_COLLECTION_ID) {
		throw new Error('Missing Appwrite database/collection IDs for Investments.');
	}
	try {
		const res = await ctx.databases.listDocuments({
			databaseId: dbIds.DATABASE_ID,
			collectionId: dbIds.INVESTMENTS_COLLECTION_ID,
		});
		return res.documents;
	} catch (error: any) {
		console.error('Appwrite listInvestmentDocuments failed', {
			databaseId: dbIds.DATABASE_ID,
			collectionId: dbIds.INVESTMENTS_COLLECTION_ID,
			errorMessage: error?.message,
			errorCode: error?.code ?? error?.status,
		});
		throw error;
	}
}

export async function updateInvestmentStatus(documentId: string, status: 'paid' | 'pending' | 'dismissed') {
	const ctx = initAppwrite();
	if (!dbIds.DATABASE_ID || !dbIds.INVESTMENTS_COLLECTION_ID) {
		throw new Error('Missing Appwrite database/collection IDs for Investments.');
	}
	try {
		return await ctx.databases.updateDocument({
			databaseId: dbIds.DATABASE_ID,
			collectionId: dbIds.INVESTMENTS_COLLECTION_ID,
			documentId,
			data: { status },
		});
	} catch (error: any) {
		console.error('Appwrite updateInvestmentStatus failed', {
			databaseId: dbIds.DATABASE_ID,
			collectionId: dbIds.INVESTMENTS_COLLECTION_ID,
			documentId,
			errorMessage: error?.message,
			errorCode: error?.code ?? error?.status,
		});
		throw error;
	}
}
