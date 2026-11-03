import { ImagePlus, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/shared/utils/cn';
import { formatBytes } from '@/shared/utils/money.utils';
import { Field } from './Form';

/** Serverdagi cheklov bilan AYNI — ikkisi ajralib ketmasligi kerak. */
export const MAX_FILE_MB = 100;
export const MAX_PHOTO_FILES = 10;

/** Brauzer `accept` ro‘yxati. ⚠️ Bu FAQAT qulaylik — haqiqiy tekshiruv serverda. */
const ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/heic,video/mp4,video/quicktime,video/webm';

export interface PickedFile {
  file: File;
  /** `URL.createObjectURL` natijasi — ro‘yxatdan chiqarilganda bo‘shatiladi. */
  url: string;
}

interface Props {
  files: PickedFile[];
  onChange: (files: PickedFile[]) => void;
  max?: number;
  disabled?: boolean;
  label?: string;
  hint?: string;
  required?: boolean;
  error?: string;
}

/**
 * SURAT TANLASH — foto-hisobot va bosqichni topshirish uchun BITTA komponent.
 *
 * ⚠️ Ikki nusxa bo‘lsa, fayl hajmi cheklovi yoki `revokeObjectURL`
 * tozalashi bittasida esdan chiqardi — ikkinchisi esa bir nechta
 * videodan keyin brauzer xotirasini band qilib turardi.
 *
 * ⚠️ Holat TASHQARIDA (`files` + `onChange`): yuborish tugmasi
 * ro‘yxatni ko‘rishi kerak, komponent ichida yashiringanda esa uni
 * `ref` yoki imperativ API bilan tortib olishga to‘g‘ri kelardi.
 */
export function PhotoPicker({
  files,
  onChange,
  max = MAX_PHOTO_FILES,
  disabled,
  label,
  hint,
  required,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * ⚠️ Faqat KOMPONENT YO‘Q BO‘LGANDA tozalanadi. `files` o‘zgarishiga
   * bog‘lansa, har qo‘shishda oldingi URL lar bekor qilinib, allaqachon
   * ko‘rinib turgan rasmlar o‘chib qolardi.
   */
  const latest = useRef(files);
  useEffect(() => {
    latest.current = files;
  }, [files]);
  useEffect(() => {
    return () => {
      for (const picked of latest.current) URL.revokeObjectURL(picked.url);
    };
  }, []);

  function add(selected: FileList | null) {
    if (!selected) return;
    const accepted: PickedFile[] = [];

    for (const file of Array.from(selected)) {
      if (files.length + accepted.length >= max) {
        toast.error(`Ko‘pi bilan ${max} ta fayl biriktiriladi`);
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

    if (accepted.length > 0) onChange([...files, ...accepted]);
  }

  function remove(index: number) {
    URL.revokeObjectURL(files[index].url);
    onChange(files.filter((_, i) => i !== index));
  }

  const grid = (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          add(event.target.files);
          event.target.value = '';
        }}
      />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {files.map((picked, index) => (
          <figure key={picked.url} className="surface-inset relative overflow-hidden rounded-lg">
            <div className="aspect-[4/3]">
              {picked.file.type.startsWith('video/') ? (
                <video src={picked.url} className="size-full object-cover" muted />
              ) : (
                <img src={picked.url} alt={picked.file.name} className="size-full object-cover" />
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`${picked.file.name} ni olib tashlash`}
              disabled={disabled}
              className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-neutral-950/70 text-white transition-colors hover:bg-neutral-950"
            >
              <X className="size-3" />
            </button>
            <figcaption className="text-faint truncate px-1.5 py-1 text-nano">
              {formatBytes(picked.file.size)}
            </figcaption>
          </figure>
        ))}

        {files.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className={cn(
              'text-faint grid aspect-[4/3] place-items-center rounded-lg transition-colors',
              'shadow-[inset_0_0_0_1px_rgb(16_42_76/0.12)] hover:bg-neutral-100/70 hover:text-strong',
              'dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] dark:hover:bg-white/6',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <span className="flex flex-col items-center gap-1">
              <ImagePlus className="size-5" />
              <span className="text-micro">Qo‘shish</span>
            </span>
          </button>
        ) : null}
      </div>
    </>
  );

  if (!label) return grid;
  return (
    <Field
      label={`${label} (${files.length}/${max})`}
      required={required}
      error={error}
      hint={hint ?? `Rasm va video, har biri ${MAX_FILE_MB} MB gacha`}
    >
      {grid}
    </Field>
  );
}

/** Yuklash jarayoni chizig‘i — yuklov davom etayotganda ko‘rinadi. */
export function UploadProgress({ percent }: { percent: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-meta">
        <span className="text-muted">Suratlar yuklanmoqda</span>
        <span className="num text-strong">{percent}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/12">
        <div
          className="h-full rounded-full bg-ok-500 transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
