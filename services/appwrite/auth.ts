import { OAuthProvider } from 'appwrite';
import { initAppwrite } from './client';

export async function loginWithGoogle() {
  const ctx = initAppwrite();
  try {
    await ctx.account.createOAuth2Session({
      provider: OAuthProvider.Google,
    });
  } catch (error: any) {
    console.error('Appwrite loginWithGoogle failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}

export async function logoutUser() {
  const ctx = initAppwrite();
  try {
    await ctx.account.deleteSession({ sessionId: 'current' });
  } catch (error: any) {
    console.error('Appwrite logoutUser failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}

export async function getUser() {
  const ctx = initAppwrite();
  try {
    return await ctx.account.get();
  } catch (error: any) {
    console.error('Appwrite getUser failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string) {
  const ctx = initAppwrite();
  try {
    // NOTE: Replace the URL below with your app's actual password reset/deep link URL
    const redirectUrl =
      (process.env as any)?.EXPO_PUBLIC_APPWRITE_PASSWORD_RESET_URL ?? 'https://example.com/reset';
    await ctx.account.createRecovery(email, redirectUrl);
  } catch (error: any) {
    console.error('Appwrite sendPasswordResetEmail failed', {
      errorMessage: error?.message,
      errorCode: error?.code ?? error?.status,
    });
    throw error;
  }
}


