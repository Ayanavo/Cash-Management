const API_HOST = '192.168.31.126';
const API_BASE = `http://${API_HOST}:4000`;

export type SendCodeBody = { phone: string; countryDial: string };
export type VerifyCodeBody = {
  phone: string;
  countryDial: string;
  code: string;
};

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function readApiMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    if (typeof o.error === 'string') return o.error;
  }
  return fallback;
}

export async function sendAuthCode(
  body: SendCodeBody,
): Promise<{ ok: boolean; message: string; status: number }> {
  const res = await fetch(`${API_BASE}/api/auth/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: body.phone, countryDial: body.countryDial }),
  });
  const data = await parseJsonSafe(res);
  const fallback =
    res.status === 200
      ? 'Code sent.'
      : res.ok
        ? `Unexpected status ${res.status} (expected 200)`
        : `Request failed (${res.status})`;
  const message = readApiMessage(data, fallback);
  const ok = res.status === 200;
  return { ok, message, status: res.status };
}

export type VerifyCodeSuccess = {
  user?: { code?: string; phone?: string; countryDial?: string };
};

export async function verifyAuthCode(
  body: VerifyCodeBody,
): Promise<{ ok: boolean; message: string; payload?: VerifyCodeSuccess }> {
  const res = await fetch(`${API_BASE}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: body.phone,
      countryDial: body.countryDial,
      code: body.code,
    }),
  });
  const data = await parseJsonSafe(res);
  const message = readApiMessage(
    data,
    res.ok ? 'Verified.' : `Verification failed (${res.status})`,
  );
  if (!res.ok) {
    return { ok: false, message };
  }
  return { ok: true, message, payload: data as VerifyCodeSuccess };
}
