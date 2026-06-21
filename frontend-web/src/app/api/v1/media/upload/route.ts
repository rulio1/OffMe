import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { createMediaAsset, toApiMedia } from '@/lib/media-repository';
import { getRequestUser } from '@/lib/request-auth';
import { uploadImage, validateImageFile } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return jsonError('Envie um arquivo no campo "file"', 400);
    }

    const blob = file as Blob & { name?: string; type: string; size: number };
    const validationError = validateImageFile({ type: blob.type, size: blob.size });
    if (validationError) return jsonError(validationError, 400);

    const buffer = Buffer.from(await blob.arrayBuffer());
    const { url, storageKey } = await uploadImage(user.id, buffer, blob.type);

    const asset = await createMediaAsset({
      uploaderId: user.id,
      url,
      storageKey,
      mimeType: blob.type,
      fileSizeBytes: blob.size,
    });

    return jsonOk(toApiMedia(asset), 201);
  } catch (err) {
    console.error('[media/upload]', err);
    const message = err instanceof Error ? err.message : 'Erro ao enviar imagem';
    if (message.includes('ECONNREFUSED') || message.includes('connect') || message.includes('handshake') || message.includes('ImgBB')) {
      return jsonError('Falha ao enviar imagem para o serviço de armazenamento. Verifique IMGBB_API_KEY ou configuração.', 503);
    }
    return jsonError('Erro ao enviar imagem', 500);
  }
}