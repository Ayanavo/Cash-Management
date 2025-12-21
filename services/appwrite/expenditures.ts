import { Query } from 'appwrite';
import moment from 'moment';
import { ensureExpenditureConfig, initAppwrite } from './client';
import { getProfileSettings } from './settings';

function computePeriodKey(rangeRaw: string, now: Date = new Date()): string | null {
  const range = String(rangeRaw || '').toUpperCase();
  const m = moment(now).startOf('day');

  switch (range) {
    case '1M':
      return m.format('YYYY-MM');
    case '3M': {
      const q = Math.floor(m.month() / 3) + 1;
      return `${m.year()}-Q${q}`;
    }
    case '1W':
      return `${m.year()}-W${m.isoWeek()}`;
    case '1Y':
      return m.format('YYYY');
    default:
      // Unsupported or custom range – skip period fields
      return null;
  }
}

export async function getExpenditureTotal() {
  const ctx = initAppwrite();
  const { DATABASE_ID, EXPENDITURES_COLLECTION_ID } = ensureExpenditureConfig();

  try {
    const user = await ctx.account.get();
    const userId = user.$id;

    // Verify that the expenditures collection exists (404 => treat as no data yet)
    try {
      const res = await ctx.databases.listDocuments({
        databaseId: DATABASE_ID,
        collectionId: EXPENDITURES_COLLECTION_ID,
        queries: [Query.equal('userId', userId)],
      });

      const total = res.documents.reduce((acc: number, d: any) => {
        const n = Number(d.totalAmount ?? 0);
        return acc + (Number.isNaN(n) ? 0 : n);
      }, 0);

      return {
        totalExpense: total,
        documentId: null,
      };
    } catch (err: any) {
      const code = err?.code ?? err?.status;
      if (code === 404) {
        console.warn(
          'Expenditures collection not found in Appwrite; returning zero total.',
        );
        return {
          totalExpense: 0,
          documentId: null,
        };
      }
      throw err;
    }
  } catch (error: any) {
    console.error('Appwrite getExpenditureTotal failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}

// Create a new expenditure entry representing one addition to the total.
// Callers should pass the incremental amount, not the running aggregate.
export async function upsertExpenditureTotal(amountToAdd: number) {
  const ctx = initAppwrite();
  const { DATABASE_ID, EXPENDITURES_COLLECTION_ID } = ensureExpenditureConfig();

  try {
    const user = await ctx.account.get();
    const userId = user.$id;
    // Try to attach period metadata so server-side cron and timeline views
    // can reason about expenditures per period.
    let base: Record<string, any> = { userId, totalAmount: amountToAdd };
    try {
      const settings = await getProfileSettings();
      const range = String((settings as any)?.range ?? '');
      const key = computePeriodKey(range);
      if (key) {
        base = {
          ...base,
          periodKey: key,
          periodRange: range,
        };
      }
    } catch {
      // If profile settings are unavailable, fall back to creating
      // a plain expenditure entry without period metadata.
    }

    return await ctx.databases.createDocument(
      DATABASE_ID,
      EXPENDITURES_COLLECTION_ID,
      'unique()',
      base,
    );
  } catch (error: any) {
    console.error('Appwrite upsertExpenditureTotal failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}

/**
 * One‑time helper to add optional period fields to the Expenditures collection.
 *
 * Fields added:
 * - periodKey:   string, size 255, not required, not an array
 * - periodRange: string, size 20,  not required, not an array
 *
 * Call this from a secure/admin context; it will no‑op if the attributes already exist.
 */
export async function ensureExpenditurePeriodAttributes() {
  const ctx = initAppwrite();
  const { DATABASE_ID, EXPENDITURES_COLLECTION_ID } = ensureExpenditureConfig();
  const db = ctx.databases as any;

  // Helper to ignore "already exists" errors (409) while surfacing others
  const ignoreConflict = (err: any) => {
    const code = err?.code ?? err?.status;
    if (code === 409) {
      // Attribute already exists
      console.warn(
        '[Expenditures] Attribute already exists; skipping create:',
        err?.message ?? String(err),
      );
      return;
    }
    throw err;
  };

  try {
    // Attribute: periodKey (string, 255, not required, not array)
    await db
      .createStringAttribute(
        DATABASE_ID,
        EXPENDITURES_COLLECTION_ID,
        'periodKey',
        255,
        false, // required
      )
      .catch(ignoreConflict);
  } catch (err: any) {
    ignoreConflict(err);
  }

  try {
    // Attribute: periodRange (string, 20, not required, not array)
    await db
      .createStringAttribute(
        DATABASE_ID,
        EXPENDITURES_COLLECTION_ID,
        'periodRange',
        20,
        false, // required
      )
      .catch(ignoreConflict);
  } catch (err: any) {
    ignoreConflict(err);
  }
}

// Simple helper for local testing: logs one expenditures document and its fields.
// Call this manually from a debug screen; it has no side-effects on stored totals.
export async function debugLogExpendituresFields() {
  const ctx = initAppwrite();
  const { DATABASE_ID, EXPENDITURES_COLLECTION_ID } = ensureExpenditureConfig();

  try {
    const res = await ctx.databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: EXPENDITURES_COLLECTION_ID,
      queries: [Query.limit(1)],
    });
    const doc = res.documents?.[0];
    if (!doc) {
      console.log('[Expenditures debug] No documents found in expenditures collection.');
      return;
    }

    const keys = Object.keys(doc);
    console.log('[Expenditures debug] Sample document:', doc);
    console.log('[Expenditures debug] Field keys:', keys);
  } catch (error: any) {
    console.error('[Expenditures debug] Failed to read expenditures collection', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
  }
}


// List all expenditure documents for the current user (for history/timeline views)
export async function listExpenditureDocuments() {
  const ctx = initAppwrite();
  const { DATABASE_ID, EXPENDITURES_COLLECTION_ID } = ensureExpenditureConfig();

  try {
    const user = await ctx.account.get();
    const userId = user.$id;

    const res = await ctx.databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: EXPENDITURES_COLLECTION_ID,
      // We still filter by userId on server to avoid leaking cross-user data
      queries: [Query.equal('userId', userId)],
    });

    return res.documents;
  } catch (error: any) {
    console.error('Appwrite listExpenditureDocuments failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}