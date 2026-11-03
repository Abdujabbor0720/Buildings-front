import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useCreatePhotoReport, useObjects, useUploadFiles } from '@/shared/api/queries';
import {
  Button,
  Field,
  Input,
  Modal,
  PhotoPicker,
  Select,
  Textarea,
  UploadProgress,
  type PickedFile,
} from '@/shared/ui';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useFiltersStore } from '@/store/filters.store';

/**
 * YANGI FOTO-HISOBOT.
 *
 * Oqim ikki bosqichli: avval fayllar yuklanadi, keyin hisobot yaratiladi.
 * ⚠️ Bitta so‘rovga birlashtirilmagan: 100 MB lik video yuklanayotganda
 * tranzaksiya ochiq turishi va yuklov uzilsa yarim hisobot qolishi mumkin
 * edi. Hozirgi shaklda uzilish faqat biriktirilmagan fayl qoldiradi.
 */
/**
 * @param lockedObject Berilsa — obyekt TANLOVI ko‘rsatilmaydi va o‘sha
 *   obyekt qat‘iy ishlatiladi. Obyekt kartasidan ochilganda qidiruv
 *   maydoni ortiqcha: odam allaqachon qaysi obyektda ekanini biladi va
 *   boshqasini tanlab yuborishi XATO bo‘lardi.
 */
export function NewPhotoReportModal({
  open,
  onClose,
  lockedObject,
}: {
  open: boolean;
  onClose: () => void;
  lockedObject?: { id: string; code: string; name: string };
}) {
  const { regionId } = useFiltersStore();
  const upload = useUploadFiles();
  const create = useCreatePhotoReport();

  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 350);
  const [objectId, setObjectId] = useState(lockedObject?.id ?? '');
  const [progress, setProgress] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [percent, setPercent] = useState(0);

  const { data: objects, isFetching } = useObjects(
    {
      limit: 20,
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
      ...(regionId ? { regionId } : {}),
      ...(debounced.trim() ? { search: debounced.trim() } : {}),
    },
    // ⚠️ Obyekt qat'iy bo‘lsa ro‘yxat UMUMAN so‘ralmaydi — u ko‘rinmasa
    // ham har ochilishda tarmoqni band qilardi.
    { enabled: !lockedObject },
  );

  const options = useMemo(
    () =>
      (objects?.items ?? []).map((object) => ({
        value: object.id,
        label: `${object.code} · ${object.name}`,
      })),
    [objects],
  );

  function reset() {
    // ⚠️ `URL.revokeObjectURL` ni `PhotoPicker` o‘zi bajaradi — bu yerda
    // ikkinchi marta chaqirilsa, hali ko‘rinib turgan rasm o‘chib qolardi.
    setFiles([]);
    setObjectId(lockedObject?.id ?? '');
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
        files: files.map((picked) => picked.file),
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
        {lockedObject ? (
          <Field label="Obyekt">
            <p className="rounded-lg surface-muted px-3 py-2 text-ui text-strong">
              <span className="mono mr-2 text-micro text-muted">{lockedObject.code}</span>
              {lockedObject.name}
            </p>
          </Field>
        ) : (
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
        )}

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

        <PhotoPicker
          label="Suratlar"
          required
          files={files}
          onChange={setFiles}
          disabled={busy}
        />

        {upload.isPending ? <UploadProgress percent={percent} /> : null}
      </div>
    </Modal>
  );
}
