import { FileUp, X } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useCreateDocument, useUploadFiles, type CreateDocumentBody } from '@/shared/api/queries';
import type { DocumentType } from '@/shared/api/types';
import { DOCUMENT_TYPE_LABELS } from '@/shared/constants/health';
import { Button, Field, Input, Modal, Select, Textarea, UploadProgress } from '@/shared/ui';
import { formatBytes } from '@/shared/utils/money.utils';

const MAX_FILE_MB = 100;

interface FormState {
  type: DocumentType;
  title: string;
  number: string;
  issuedDate: string;
  expiryDate: string;
  note: string;
}

const EMPTY: FormState = {
  type: 'project',
  title: '',
  number: '',
  issuedDate: '',
  expiryDate: '',
  note: '',
};

/**
 * HUJJAT QO‘SHISH.
 *
 * ⚠️ FAYL IXTIYORIY. Hujjat raqami va muddati bo‘lgan, lekin skaneri
 * hali tayyor bo‘lmagan holat odatiy: faylni majburiy qilsak, odam
 * hujjatni umuman kiritmay qo‘yardi va «muddati tugayotgan hujjatlar»
 * ogohlantirishi bo‘sh ishlardi.
 */
export function DocumentFormModal({
  open,
  onClose,
  objectId,
}: {
  open: boolean;
  onClose: () => void;
  objectId: string;
}) {
  const upload = useUploadFiles();
  const create = useCreateDocument();
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [percent, setPercent] = useState(0);
  const [touched, setTouched] = useState(false);

  const sessionKey = open ? objectId : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (sessionKey !== lastKey) {
    setLastKey(sessionKey);
    setForm(EMPTY);
    setFile(null);
    setPercent(0);
    setTouched(false);
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const errors: Partial<Record<keyof FormState, string>> = {};
  if (form.title.trim().length < 3) errors.title = 'Kamida 3 belgi';
  if (form.issuedDate && form.expiryDate && form.expiryDate < form.issuedDate) {
    errors.expiryDate = 'Berilgan sanadan oldin bo‘la olmaydi';
  }
  const show = (key: keyof FormState) => (touched ? errors[key] : undefined);
  const busy = upload.isPending || create.isPending;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    try {
      let fileId: string | undefined;
      if (file) {
        setPercent(0);
        const uploaded = await upload.mutateAsync({
          files: [file],
          subdir: 'documents',
          onProgress: setPercent,
        });
        fileId = uploaded[0]?.id;
      }

      const body: CreateDocumentBody = {
        objectId,
        type: form.type,
        title: form.title.trim(),
      };
      // ⚠️ Bo‘sh ixtiyoriy maydon UMUMAN yuborilmaydi: server `''` ni
      // `@IsDateString` bilan tekshirib rad etardi.
      if (form.number.trim()) body.number = form.number.trim();
      if (form.issuedDate) body.issuedDate = form.issuedDate;
      if (form.expiryDate) body.expiryDate = form.expiryDate;
      if (form.note.trim()) body.note = form.note.trim();
      if (fileId) body.fileId = fileId;

      await create.mutateAsync(body);
      toast.success(`«${body.title}» qo‘shildi`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      size="lg"
      title="Hujjat qo‘shish"
      description="Fayl ixtiyoriy — hujjat ma’lumotini skanersiz ham kiritish mumkin."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Bekor qilish
          </Button>
          <Button type="submit" form="document-form" loading={busy}>
            {upload.isPending && percent > 0 ? `Yuklanmoqda ${percent}%` : 'Qo‘shish'}
          </Button>
        </>
      }
    >
      <form id="document-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Hujjat nomi" required error={show('title')}>
          <Input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Loyiha-smeta hujjatlari"
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Turi"
            required
            value={form.type}
            onChange={(e) => set('type', e.target.value as DocumentType)}
            options={Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Field label="Raqami">
            <Input
              value={form.number}
              onChange={(e) => set('number', e.target.value)}
              placeholder="№ 142/2026"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Berilgan sana">
            <Input type="date" value={form.issuedDate} onChange={(e) => set('issuedDate', e.target.value)} />
          </Field>
          <Field
            label="Amal qilish muddati"
            error={show('expiryDate')}
            hint="Muddati tugashiga 30 kun qolganda ogohlantiriladi"
          >
            <Input type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
          </Field>
        </div>

        <Field label="Fayl" hint={`PDF, rasm yoki hujjat — ${MAX_FILE_MB} MB gacha`}>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              if (selected && selected.size > MAX_FILE_MB * 1024 * 1024) {
                toast.error(`«${selected.name}» ${MAX_FILE_MB} MB dan katta`);
              } else {
                setFile(selected);
              }
              event.target.value = '';
            }}
          />
          {file ? (
            <div className="flex items-center gap-2 rounded-lg surface-muted px-3 py-2">
              <FileUp className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate text-meta text-strong">{file.name}</span>
              <span className="text-faint shrink-0 text-micro">{formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={busy}
                aria-label="Faylni olib tashlash"
                className="grid size-6 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-neutral-200 hover:text-strong dark:hover:bg-white/10"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              leftIcon={<FileUp className="size-3.5" />}
            >
              Fayl tanlash
            </Button>
          )}
        </Field>

        <Textarea
          label="Izoh"
          rows={2}
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="Ixtiyoriy"
        />

        {upload.isPending ? <UploadProgress percent={percent} /> : null}
      </form>
    </Modal>
  );
}
