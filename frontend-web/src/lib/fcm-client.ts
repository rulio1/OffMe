export function fcmConfigured(): boolean {
  return !!process.env.FCM_SERVER_KEY;
}

export async function sendFcmNotification(input: {
  deviceToken: string;
  title: string;
  body: string;
  url?: string;
}): Promise<{ ok: boolean; shouldRemoveToken: boolean }> {
  if (!fcmConfigured()) {
    return { ok: false, shouldRemoveToken: false };
  }

  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${process.env.FCM_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: input.deviceToken,
      notification: { title: input.title, body: input.body },
      data: { url: input.url ?? '/notifications' },
      priority: 'high',
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    success?: number;
    failure?: number;
    results?: Array<{ error?: string }>;
  };

  const error = data.results?.[0]?.error;
  const shouldRemoveToken =
    error === 'NotRegistered' ||
    error === 'InvalidRegistration' ||
    error === 'MismatchSenderId';

  return {
    ok: res.ok && (data.success ?? 0) > 0,
    shouldRemoveToken,
  };
}