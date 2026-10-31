import { ImagePlus, Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useCreatePhotoReport, useObjects, useUploadFiles } from '@/shared/api/queries';
import { Button, Field, Input, Modal, Select, Textarea } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatBytes } from '@/shared/utils/money.utils';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useFiltersStore } from '@/store/filters.store';

/** Serverdagi cheklov bilan AYNI — ikkisi ajralib ketmasligi kerak. */
const MAX_FILE_MB = 100;
const MAX_FILES = 10;

/** Brauzer `accept` ro‘yxati. ⚠️ Bu FAQAT qulaylik — haqiqiy tekshiruv serverda. */
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/heic,video/mp4,video/quicktime,video/webm';

interface Preview {
  file: File;
  url: string;
}

/**
 * YANGI FOTO-HISOBOT.
 *
 * Oqim ikki bosqichli: avval fayllar yuklanadi, keyin hisobot yaratiladi.
 * ⚠️ Bitta so‘rovga birlashtirilmagan: 100 MB lik video yuklanayotganda
 * tranzaksiya ochiq turishi va yuklov uzilsa yarim hisobot qolishi mumkin
 * edi. Hozirgi shaklda uzilish faqat biriktirilmagan fayl qoldiradi.
 */
export function NewPhotoReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { regionId } = useFiltersStore();
  const upload = useUploadFiles();
  const create = useCreatePhotoReport();

  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 350);
  const [objectId, setObjectId] = useState('');
  const [progress, setProgress] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<Preview[]>([]);
  const [percent, setPercent] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: objects, isFetching } = useObjects({
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'DESC',
    ...(regionId ? { regionId } : {}),
    ...(debounced.trim() ? { search: debounced.trim() } : {}),
  });

  // ⚠️ `URL.createObjectURL` xotirani band qiladi — oyna yopilganda
  // bo‘shatilmasa, bir nechta katta videodan keyin bu sezilarli bo‘ladi.
  useEffect(() => {
    return () => {
      for (const preview of files) URL.revokeObjectURL(preview.url);
    };
  }, [files]);

  const options = useMemo(
    () =>
      (objects?.items ?? []).map((object) => ({
        value: object.id,
        label: `${object.code} · ${object.name}`,
      })),
    [objects],
  );

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    const accepted: Preview[] = [];

    for (const file of Array.from(selected)) {
      if (files.length + accepted.length >= MAX_FILES) {
        toast.error(`Bir hisobotga ko‘pi bilan ${MAX_FILES} ta fayl biriktiriladi`);
        break;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        // Serverga yubormasdan to‘xtatamiz: 100 MB ni yuborib, keyin
        // rad javobini olish — bekorga sarflangan trafik va vaqt.
        toast.error(`«${file.name}» ${MAX_FILE_MB} MB dan katta`);
        continue;
      }
      accepted.push({ file, url: URL.createObjectURL(file) });
    }

    if (accepted.length > 0) setFiles((current) => [...current, ...accepted]);
  }

  function removeFile(index: number) {
    setFiles((current) => {
      URL.revokeObjectURL(current[index].url);
      return current.filter((_, i) => i !== index);
    });
  }

  function reset() {
    for (const preview of files) URL.revokeObjectURL(preview.url);
    setFiles([]);
    setObjectId('');
    setProgress('');
    setNote('');
    setSearch('');
    setPercent(0);
  }

  async function onSubmit() {
    const value = Number(progress);
    if (!objectId) return toast.error('Obyektni tanlang');
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return toast.error('Bajarilish 0–100 oralig‘ida bo‘lishi kerak');
    }
    if (files.length === 0) return toast.error('Kamida bitta surat biriktiring');

    try {
      setPercent(0);
      const uploaded = await upload.mutateAsync({
        files: files.map((preview) => preview.file),
        subdir: 'photos',
        onProgress: setPercent,
      });

      await create.mutateAsync({
        objectId,
        fileIds: uploaded.map((file) => file.id),
        progressPercent: value,
        note: note.trim() || undefined,
      });

      toast.success('Hisobot yuborildi — AI tahlili navbatga qo‘yildi');
      reset();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const busy = upload.isPending || create.isPending;

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      size="lg"
      title="Yangi foto-hisobot"
      description="Suratlar yuklangach, AI bajarilishni mustaqil baholaydi"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Bekor qilish
          </Button>
          <Button onClick={onSubmit} loading={busy}>
            {upload.isPending && percent > 0 ? `Yuklanmoqda ${percent}%` : 'Yuborish'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Obyekt" required>
          <Input
            placeholder="Nomi yoki kodi bo‘yicha qidirish…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mb-2"
          />
          <Select
            value={objectId}
            onChange={(event) => setObjectId(event.target.value)}
            placeholder={isFetching ? 'Yuklanmoqda…' : 'Obyektni tanlang'}
            options={options}
          />
        </Field>

        <Input
          type="number"
          label="Bajarilish, %"
          required
          min={0}
          max={100}
          step={1}
          value={progress}
          onChange={(event) => setProgress(event.target.value)}
          hint="Hisobotdagi bu raqam AI bahosi bilan solishtiriladi"
        />

        <Textarea
          label="Izoh"
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Qanday ishlar bajarildi"
        />

        {/* ───── Fayllar ───── */}
        <Field
          label={`Suratlar (${files.length}/${MAX_FILES})`}
          required
          hint={`Rasm va video, har biri ${MAX_FILE_MB} MB gacha`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = '';
            }}
          />

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {files.map((preview, index) => (
              <figure key={preview.url} className="surface-inset relative overflow-hidden rounded-lg">
                <div className="aspect-[4/3]">
                  {preview.file.type.startsWith('video/') ? (
                    <video src={preview.url} className="size-full object-cover" muted />
                  ) : (
                    <img src={preview.url} alt={preview.file.name} className="size-full object-cover" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  aria-label={`${preview.file.name} ni olib tashlash`}
                  disabled={busy}
                  className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-neutral-950/70 text-white transition-colors hover:bg-neutral-950"
                >
                  <X className="size-3" />
                </button>
                <figcaption className="text-faint truncate px-1.5 py-1 text-nano">
                  {formatBytes(preview.file.size)}
                </figcaption>
              </figure>
            ))}

            {files.length < MAX_FILES ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className={cn(
                  'text-faint grid aspect-[4/3] place-items-center rounded-lg transition-colors',
                  'shadow-[inset_0_0_0_1px_rgb(16_20_15/0.12)] hover:bg-neutral-100/70 hover:text-strong',
                  'dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] dark:hover:bg-white/6',
                )}
              >
                <span className="flex flex-col items-center gap-1">
                  <ImagePlus className="size-5" />
                  <span className="text-micro">Qo‘shish</span>
                </span>
              </button>
            ) : null}
          </div>
        </Field>

        {upload.isPending ? (
          <div>
            <div className="flex items-center justify-between text-meta">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Loader2 className="size-3.5 animate-spin" />
                Spaces'ga yuklanmoqda
              </span>
              <span className="num text-strong">{percent}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/12">
              <div
                className="h-full rounded-full bg-ok-500 transition-[width] duration-200"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
