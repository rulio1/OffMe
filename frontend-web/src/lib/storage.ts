import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;

function getConfig() {
  let endpoint = process.env.S3_ENDPOINT ?? 'http://localhost:9000';
  const accessKey = process.env.S3_ACCESS_KEY ?? 'offme';
  const secretKey = process.env.S3_SECRET_KEY ?? 'offme_dev';
  const bucket = process.env.S3_BUCKET ?? 'offme-media';
  // Strip trailing /bucket if user pasted full bucket URL as endpoint
  if (endpoint.endsWith('/' + bucket)) {
    endpoint = endpoint.slice(0, - (bucket.length + 1));
  }
  const publicUrl = (process.env.S3_PUBLIC_URL ?? `${endpoint}/${bucket}`).replace(/\/$/, '');

  return { endpoint, accessKey, secretKey, bucket, publicUrl };
}

function useLocalUploads(): boolean {
  if (process.env.USE_LOCAL_UPLOADS === 'true') {
    return true;
  }
  const hasRealS3 = !!process.env.S3_ACCESS_KEY && 
                    !!process.env.S3_SECRET_KEY && 
                    process.env.S3_ENDPOINT !== 'local';
  if (hasRealS3) return false;

  return process.env.S3_ENDPOINT === 'local';
}

function useImgBB(): boolean {
  return !!process.env.IMGBB_API_KEY;
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    const { endpoint, accessKey, secretKey } = getConfig();
    client = new S3Client({
      endpoint,
      region: process.env.S3_REGION ?? 'us-east-1',
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      forcePathStyle: true,
    });
  }
  return client;
}

function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'bin';
  }
}

export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_MIME.has(file.type)) {
    return 'Formato não suportado. Use JPEG, PNG, WebP ou GIF.';
  }
  if (file.size > MAX_BYTES) {
    return 'Imagem muito grande. Máximo 5 MB.';
  }
  if (file.size <= 0) {
    return 'Arquivo vazio.';
  }
  return null;
}

async function uploadImageLocal(
  userId: number,
  buffer: Buffer,
  mimeType: string
): Promise<{ url: string; storageKey: string }> {
  const ext = extensionForMime(mimeType);
  const storageKey = `uploads/${userId}/${randomUUID()}.${ext}`;
  const publicDir = join(process.cwd(), 'public');
  const targetDir = join(publicDir, 'uploads', String(userId));
  const targetPath = join(publicDir, storageKey);

  await mkdir(targetDir, { recursive: true });
  await writeFile(targetPath, buffer);

  return {
    url: `/${storageKey}`,
    storageKey,
  };
}

async function uploadImageImgBB(
  userId: number,
  buffer: Buffer,
  mimeType: string
): Promise<{ url: string; storageKey: string }> {
  const key = process.env.IMGBB_API_KEY!;
  const base64 = buffer.toString('base64');

  const form = new FormData();
  form.append('image', base64);
  // opcional: form.append('name', `user-${userId}-${Date.now()}`);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`ImgBB upload failed: ${res.status} ${txt}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(`ImgBB error: ${json.error?.message || JSON.stringify(json.error)}`);
  }

  const data = json.data;
  return {
    url: data.url || data.display_url,
    storageKey: data.delete_url || data.id,
  };
}

export async function uploadImage(
  userId: number,
  buffer: Buffer,
  mimeType: string
): Promise<{ url: string; storageKey: string }> {
  if (useLocalUploads()) {
    return uploadImageLocal(userId, buffer, mimeType);
  }

  if (useImgBB()) {
    return uploadImageImgBB(userId, buffer, mimeType);
  }

  const { bucket, publicUrl } = getConfig();
  const ext = extensionForMime(mimeType);
  const storageKey = `uploads/${userId}/${randomUUID()}.${ext}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return {
    url: `${publicUrl}/${storageKey}`,
    storageKey,
  };
}

export { MAX_BYTES as MAX_UPLOAD_BYTES, ALLOWED_MIME as ALLOWED_IMAGE_MIME };