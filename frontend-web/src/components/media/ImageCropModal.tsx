'use client';

import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { X, ZoomIn } from 'lucide-react';
import { blobToFile, getCroppedImageBlob } from '@/lib/crop-image';

export type CropMode = 'avatar' | 'banner';

interface ImageCropModalProps {
  imageSrc: string;
  mode: CropMode;
  title: string;
  onClose: () => void;
  onConfirm: (file: File) => void;
}

const MODE_CONFIG: Record<
  CropMode,
  { aspect: number; cropShape: 'round' | 'rect'; maxWidth: number; maxHeight: number; filename: string }
> = {
  avatar: {
    aspect: 1,
    cropShape: 'round',
    maxWidth: 512,
    maxHeight: 512,
    filename: 'avatar.jpg',
  },
  banner: {
    aspect: 3,
    cropShape: 'rect',
    maxWidth: 1500,
    maxHeight: 500,
    filename: 'banner.jpg',
  },
};

export function ImageCropModal({ imageSrc, mode, title, onClose, onConfirm }: ImageCropModalProps) {
  const config = MODE_CONFIG[mode];
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, {
        round: config.cropShape === 'round',
        maxWidth: config.maxWidth,
        maxHeight: config.maxHeight,
      });
      onConfirm(blobToFile(blob, config.filename));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-white/90 transition hover:bg-white/10"
          aria-label="Cancelar"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-bold text-white">{title}</h2>
        <button
          type="button"
          onClick={handleApply}
          disabled={processing || !croppedAreaPixels}
          className="rounded-full bg-offme-accent px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {processing ? '...' : 'Aplicar'}
        </button>
      </header>

      <div className="relative min-h-0 flex-1 bg-neutral-950">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={config.aspect}
          cropShape={config.cropShape}
          showGrid={mode === 'banner'}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          objectFit="horizontal-cover"
        />
      </div>

      <div className="border-t border-white/10 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <ZoomIn className="h-4 w-4 shrink-0 text-white/70" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-offme-accent"
            aria-label="Zoom"
          />
        </div>
        <p className="mt-2 text-center text-xs text-white/50">
          {mode === 'avatar' ? 'Arraste e dê zoom para enquadrar o rosto' : 'Proporção 3:1 — estilo banner do perfil'}
        </p>
      </div>
    </div>
  );
}