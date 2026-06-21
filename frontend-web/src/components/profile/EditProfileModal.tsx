'use client';

import { useRef, useState } from 'react';
import { Camera, ImageIcon, X } from 'lucide-react';
import { updateProfile, uploadImage } from '@/lib/api';
import { updateStoredUser } from '@/lib/auth';
import { ImageCropModal, type CropMode } from '@/components/media/ImageCropModal';
import type { User } from '@/types';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSaved: (user: User) => void;
}

type PendingCrop = { src: string; mode: CropMode };

export function EditProfileModal({ user, onClose, onSaved }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');
  const [bannerUrl, setBannerUrl] = useState(user.bannerUrl ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl ?? null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(user.bannerUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [error, setError] = useState('');
  const [pendingCrop, setPendingCrop] = useState<PendingCrop | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const openCropper = (file: File, mode: CropMode) => {
    const src = URL.createObjectURL(file);
    setPendingCrop({ src, mode });
  };

  const closeCropper = () => {
    if (pendingCrop?.src.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCrop.src);
    }
    setPendingCrop(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, mode: CropMode) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    openCropper(file, mode);
  };

  const handleCropConfirm = async (file: File) => {
    const mode = pendingCrop?.mode;
    closeCropper();
    if (!mode) return;

    if (mode === 'avatar') setUploadingAvatar(true);
    else setUploadingBanner(true);
    setError('');

    try {
      const uploaded = await uploadImage(file);
      const preview = URL.createObjectURL(file);
      if (mode === 'avatar') {
        setAvatarUrl(uploaded.url);
        setAvatarPreview(preview);
      } else {
        setBannerUrl(uploaded.url);
        setBannerPreview(preview);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem');
    } finally {
      if (mode === 'avatar') setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim() || null,
        bannerUrl: bannerUrl.trim() || null,
      });
      updateStoredUser(updated);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const isBusy = saving || uploadingAvatar || uploadingBanner;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-start sm:pt-16">
        <div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl border border-offme-border bg-offme-bg shadow-xl sm:mx-4 sm:max-w-lg sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-offme-border px-4 py-3">
            <button onClick={onClose} className="rounded-full p-2 hover:bg-black/5">
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-bold">Editar perfil</h2>
            <button
              onClick={handleSave}
              disabled={isBusy}
              className="offme-btn-primary px-4 py-1.5 text-sm disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

          <div className="space-y-4 p-4">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-offme-muted">Banner</p>
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="group relative h-28 w-full overflow-hidden rounded-xl bg-offme-surface"
              >
                {bannerPreview ? (
                  <img src={bannerPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-offme-muted">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                  <span className="rounded-full bg-black/60 px-3 py-1.5 text-sm font-semibold text-white">
                    {uploadingBanner ? 'Enviando...' : 'Alterar banner'}
                  </span>
                </span>
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'banner')}
              />
              <p className="mt-1 text-xs text-offme-muted">Proporção 3:1 · JPEG, PNG, WebP ou GIF</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-offme-surface ring-2 ring-offme-border"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-offme-muted">
                    <Camera className="h-8 w-8" />
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                </span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'avatar')}
              />
              <div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="text-sm font-semibold text-offme-accent hover:underline disabled:opacity-50"
                >
                  {uploadingAvatar ? 'Enviando...' : 'Alterar foto'}
                </button>
                <p className="mt-1 text-xs text-offme-muted">Corte redondo · máx. 5 MB</p>
              </div>
            </div>

            <label className="block">
              <span className="text-sm text-offme-muted">Nome</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="mt-1 w-full rounded-lg border border-offme-border bg-offme-surface px-3 py-2 outline-none focus:ring-1 focus:ring-offme-accent"
              />
            </label>

            <label className="block">
              <span className="text-sm text-offme-muted">Bio</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={3}
                className="mt-1 w-full resize-none rounded-lg border border-offme-border bg-offme-surface px-3 py-2 outline-none focus:ring-1 focus:ring-offme-accent"
              />
              <span className="text-xs text-offme-muted">{160 - bio.length} restantes</span>
            </label>
          </div>
        </div>
      </div>

      {pendingCrop && (
        <ImageCropModal
          imageSrc={pendingCrop.src}
          mode={pendingCrop.mode}
          title={pendingCrop.mode === 'avatar' ? 'Cortar avatar' : 'Cortar banner'}
          onClose={closeCropper}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  );
}