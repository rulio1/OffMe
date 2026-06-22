import http2 from 'http2';
import jwt from 'jsonwebtoken';

export function apnsConfigured(): boolean {
  return !!(
    process.env.APNS_KEY &&
    process.env.APNS_KEY_ID &&
    process.env.APNS_TEAM_ID
  );
}

function apnsHost(): string {
  const production = process.env.APNS_PRODUCTION !== 'false';
  return production ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
}

function apnsTopic(): string {
  return process.env.APNS_TOPIC ?? process.env.APNS_BUNDLE_ID ?? 'com.offme.app';
}

function createApnsJwt(): string {
  const key = process.env.APNS_KEY!.replace(/\\n/g, '\n');
  return jwt.sign({}, key, {
    algorithm: 'ES256',
    issuer: process.env.APNS_TEAM_ID!,
    header: { alg: 'ES256', kid: process.env.APNS_KEY_ID! },
    expiresIn: '50m',
  });
}

export async function sendApnsNotification(input: {
  deviceToken: string;
  title: string;
  body: string;
  url?: string;
}): Promise<{ ok: boolean; status: number; shouldRemoveToken: boolean }> {
  if (!apnsConfigured()) {
    return { ok: false, status: 0, shouldRemoveToken: false };
  }

  const token = createApnsJwt();
  const payload = JSON.stringify({
    aps: {
      alert: { title: input.title, body: input.body },
      sound: 'default',
    },
    url: input.url ?? '/notifications',
  });

  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://${apnsHost()}`);

    client.on('error', (err) => {
      client.close();
      reject(err);
    });

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${input.deviceToken}`,
      authorization: `bearer ${token}`,
      'apns-topic': apnsTopic(),
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    });

    let responseStatus = 0;
    let responseBody = '';

    req.on('response', (headers) => {
      responseStatus = Number(headers[':status'] ?? 0);
    });

    req.on('data', (chunk) => {
      responseBody += chunk.toString();
    });

    req.on('end', () => {
      client.close();
      const shouldRemoveToken = responseStatus === 410 || responseStatus === 400;
      resolve({
        ok: responseStatus === 200,
        status: responseStatus,
        shouldRemoveToken,
      });
    });

    req.on('error', (err) => {
      client.close();
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}