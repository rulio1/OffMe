export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Falha ao carregar imagem')));
    image.crossOrigin = 'anonymous';
    image.src = src;
  });
}

export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: CropArea,
  options: {
    round?: boolean;
    mimeType?: string;
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não suportado');

  let outputWidth = pixelCrop.width;
  let outputHeight = pixelCrop.height;

  if (options.maxWidth && outputWidth > options.maxWidth) {
    const ratio = options.maxWidth / outputWidth;
    outputWidth = options.maxWidth;
    outputHeight = Math.round(outputHeight * ratio);
  }
  if (options.maxHeight && outputHeight > options.maxHeight) {
    const ratio = options.maxHeight / outputHeight;
    outputHeight = options.maxHeight;
    outputWidth = Math.round(outputWidth * ratio);
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  if (options.round) {
    ctx.beginPath();
    ctx.arc(outputWidth / 2, outputHeight / 2, Math.min(outputWidth, outputHeight) / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  const mimeType = options.mimeType ?? 'image/jpeg';
  const quality = options.quality ?? 0.92;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Falha ao gerar imagem'));
      },
      mimeType,
      quality
    );
  });
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}