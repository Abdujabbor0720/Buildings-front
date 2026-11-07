import { useState, type ReactNode } from 'react';
import {
  CalendarClock,
  Download,
  ExternalLink,
  FileText,
  FileWarning,
  Hash,
  Trash2,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { getErrorMessage, resolveFileUrl } from '@/shared/api/client';
import { useDeleteDocument } from '@/shared/api/queries';
import type { ObjectDocument } from '@/shared/api/types';
import { DOCUMENT_TYPE_LABELS } from '@/shared/constants/health';
import {
  Badge,
  Button,
  Modal,
  ObjectAddress,
  ObjectResponsible,
  toObjectBrief,
} from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatDateTimeUz, formatDateUz } from '@/shared/utils/date.utils';
import { formatBytes } from '@/shared/utils/money.utils';
import { useAuthStore } from '@/store/auth.store';
import { resolveExpiry } from '../document-expiry';

/**
 * HUJJATNING BATAFSIL OYNASI — obyekt kartasida ham, umumiy
 * «Hujjatlar» bo‘limida ham AYNI komponent.
 *
 * ⚠️ Alohida SAHIFA emas, MODAL. Hujjat — obyektning ichidagi kichik
 * yozuv: sahifaga o‘tish foydalanuvchini obyekt kartasidan olib
 * chiqib, qaytib kelishga majbur qilardi. Fayl ko‘rinishi esa aynan
 * shu yerda, kontekstni yo‘qotmasdan ochiladi.
 *
 * ⚠️ QO‘SHIMCHA SO‘ROV YUBORILMAYDI. Ro‘yxat endpointi fayl, izoh,
 * yuklagan odam va obyektni ALLAQACHON qaytaradi
 * (`documents.service.list`): `GET /documents/:id` ni qayta
 * chaqirish oynani kutish bilan ochardi va bir xil ma'lumotni
 * ikkinchi marta olib kelardi.
 */

const IMAGE_TYPES = /^image\//;
const PDF_TYPE = 'application/pdf';

interface Props {
  document: ObjectDocument | null;
  onClose: () => void;
  /** Obyekt nomi ko‘rsatilsinmi (obyekt kartasi ichida u ortiqcha). */
  showObject?: boolean;
}

export function DocumentPreviewModal({ document, onClose, showObject = true }: Props) {
  const can = useAuthStore((state) => state.can);
  const remove = useDeleteDocument();
  const [removing, setRemoving] = useState(false);

  const open = Boolean(document);

  /*
   * ⚠️ OXIRGI HUJJAT ESLAB QOLINADI. Ota komponent oynani yopganda
   * `document` ni darhol `null` qiladi; shu paytda ichki qism
   * chizilmasa, oyna yo‘qolish animatsiyasi davomida BO‘SHAB qolib,
   * «sakrab» yopilardi. Shuning uchun chiqish paytida oxirgi
   * ko‘rsatilgan yozuv ishlatiladi.
   *
   * ⚠️ Holat RENDER PAYTIDA yangilanadi, `useEffect` da emas: effekt
   * bir kadr kechikib ishlaydi va oyna bir lahzaga ESKI hujjatni
   * ko‘rsatib qolardi.
   */
  const [shown, setShown] = useState<ObjectDocument | null>(document);
  if (document && document !== shown) setShown(document);

  const current = document ?? shown;
  if (!current) return null;

  const expiry = resolveExpiry(current);
  // ⚠️ `file.url` BIRINCHI: `document.url` — uning nusxasi va eski
  // yozuvlarda bo‘sh qolishi mumkin.
  const fileUrl = resolveFileUrl(current.file?.url ?? current.url);
  const mime = current.file?.mimeType ?? '';
  const canManage = can('documents.manage');

  async function onDelete(): Promise<void> {
    if (!current) return;
    if (!window.confirm(`«${current.title}» o‘chirilsinmi?`)) return;
    setRemoving(true);
    try {
      await remove.mutateAsync(current.id);
      toast.success('Hujjat o‘chirildi');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={current.title}
      description={
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge className="surface-muted text-muted">{DOCUMENT_TYPE_LABELS[current.type]}</Badge>
          <Badge className={expiry.chip}>{expiry.label}</Badge>
        </span>
      }
      footer={
        <>
          {canManage ? (
            <Button
              variant="ghost"
              size="sm"
              loading={removing}
              onClick={() => void onDelete()}
              leftIcon={<Trash2 className="size-3.5" />}
              className="mr-auto text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10"
            >
              O‘chirish
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={onClose}>
            Yopish
          </Button>
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-meta font-semibold text-white transition-colors hover:bg-brand-600"
            >
              <Download className="size-3.5" />
              Yuklab olish
            </a>
          ) : null}
        </>
      }
    >
      <div className="space-y-4">
        {/* ───── Asosiy maydonlar ───── */}
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          <Row icon={<Hash className="size-3.5" />} label="Hujjat raqami">
            {current.number ? (
              <span className="mono text-strong">{current.number}</span>
            ) : (
              <Missing>Raqam kiritilmagan</Missing>
            )}
          </Row>

          <Row icon={<CalendarClock className="size-3.5" />} label="Berilgan sana">
            {current.issuedDate ? (
              <span className="tabular text-strong">{formatDateUz(current.issuedDate)}</span>
            ) : (
              <Missing>Sana kiritilmagan</Missing>
            )}
          </Row>

          <Row icon={<CalendarClock className="size-3.5" />} label="Amal qilish muddati">
            {current.expiryDate ? (
              <span className="flex flex-wrap items-baseline gap-1.5">
                <span
                  className={cn(
                    'tabular',
                    expiry.state === 'expired'
                      ? 'font-medium text-danger-600 dark:text-danger-400'
                      : expiry.state === 'soon'
                        ? 'font-medium text-warn-600 dark:text-warn-400'
                        : 'text-strong',
                  )}
                >
                  {formatDateUz(current.expiryDate)}
                </span>
                {expiry.detail ? <span className="text-nano text-muted">{expiry.detail}</span> : null}
              </span>
            ) : (
              <Missing>Muddatsiz</Missing>
            )}
          </Row>

          <Row icon={<FileText className="size-3.5" />} label="Qo‘shilgan">
            <span className="flex flex-col">
              <span className="tabular text-strong">{formatDateTimeUz(current.createdAt)}</span>
              {/* ⚠️ Kim yuklagani MAJBURIY ko‘rsatiladi: hujjat
                  bo‘yicha savol tug‘ilganda birinchi murojaat shu
                  odamga bo‘ladi. */}
              <span className="text-nano text-muted">
                {current.uploadedBy
                  ? `${current.uploadedBy.lastName} ${current.uploadedBy.firstName}${
                      current.uploadedBy.position ? ` · ${current.uploadedBy.position}` : ''
                    }`
                  : 'Kim yuklagani qayd etilmagan'}
              </span>
            </span>
          </Row>
        </dl>

        {/* ───── Obyekt ───── */}
        {showObject ? (
          <div className="surface-inset rounded-xl p-3">
            <p className="t-label mb-1.5 flex items-center gap-1.5">
              <Building2 className="size-3.5" />
              Obyekt
            </p>
            {current.object ? (
              <>
                <Link
                  to={`/objects/${current.object.id}`}
                  className="block truncate text-ui font-medium text-strong hover:text-brand-600"
                >
                  {current.object.name}
                </Link>
                {/* ⚠️ Joylashuv va mas'ul UMUMIY komponentdan: hujjat
                    oynasi ham obyekt ko‘rinadigan joy va u qolgan
                    ekranlar bilan bir xil bo‘lishi kerak. */}
                <span className="mt-1 flex flex-col gap-0.5">
                  <ObjectAddress brief={toObjectBrief(current.object)} variant="block" />
                  <ObjectResponsible brief={toObjectBrief(current.object)} variant="block" />
                </span>
              </>
            ) : (
              <p className="text-meta text-muted">
                Umumiy hujjat — aniq obyektga biriktirilmagan
              </p>
            )}
          </div>
        ) : null}

        {/* ───── Izoh ───── */}
        {current.note ? (
          <div>
            <p className="t-label mb-1">Izoh</p>
            {/* ⚠️ `whitespace-pre-line`: izoh ko‘p qatorli kiritiladi
                va qator uzilishlari saqlanmasa, matn bitta uzun
                paragrafga aylanib o‘qilmay qolardi. */}
            <p className="whitespace-pre-line text-ui text-muted">{current.note}</p>
          </div>
        ) : null}

        {/* ───── Fayl ───── */}
        <div>
          <p className="t-label mb-1.5">Biriktirilgan fayl</p>
          {fileUrl ? (
            <FileBlock
              url={fileUrl}
              mime={mime}
              name={current.file?.originalName ?? current.title}
              size={current.file?.size ?? null}
            />
          ) : (
            /* ⚠️ Fayl YO‘QLIGI yashirilmaydi. Hujjat raqami va muddati
               kiritilgan, lekin skaneri biriktirilmagan holat odatiy
               (`DocumentFormModal` izohiga qarang) — ekranda ochiq
               aytilmasa, foydalanuvchi faylni qidirib vaqt yo‘qotardi. */
            <div className="surface-inset flex items-center gap-2.5 rounded-xl px-3 py-3 text-muted">
              <FileWarning className="size-4 shrink-0 text-warn-600 dark:text-warn-400" />
              <span className="text-meta">
                Fayl biriktirilmagan — hujjatning faqat ma’lumotlari kiritilgan
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/**
 * FAYL BLOKI — turiga qarab ko‘rinish.
 *
 * ⚠️ Surat va PDF O‘SHA YERDA ochiladi: hujjatni ko‘rish uchun uni
 * yuklab olib, keyin ochish — uchta ortiqcha qadam. Qolgan turlar
 * (docx, xlsx) brauzerda ko‘rsatilmaydi, shuning uchun ular uchun
 * faqat karta va yuklab olish havolasi qoladi.
 */
function FileBlock({
  url,
  mime,
  name,
  size,
}: {
  url: string;
  mime: string;
  name: string;
  size: string | null;
}) {
  const isImage = IMAGE_TYPES.test(mime);
  const isPdf = mime === PDF_TYPE;

  return (
    <div className="overflow-hidden rounded-xl border border-subtle">
      {isImage ? (
        <a href={url} target="_blank" rel="noreferrer noopener" className="block surface-muted">
          <img
            src={url}
            alt={name}
            loading="lazy"
            className="max-h-[320px] w-full object-contain"
          />
        </a>
      ) : isPdf ? (
        /* ⚠️ `title` MAJBURIY: `iframe` siz uni ekran o‘qiyotgan
           dastur «noma'lum ramka» deb o‘qiydi. */
        <iframe src={url} title={name} className="h-[380px] w-full border-0 surface-muted" />
      ) : null}

      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <FileText className="size-4 shrink-0 text-muted" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-meta font-medium text-strong" title={name}>
            {name}
          </span>
          <span className="text-nano text-muted">
            {size ? formatBytes(Number(size)) : 'Hajmi noma’lum'}
            {mime ? ` · ${mime}` : ''}
          </span>
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex shrink-0 items-center gap-1 text-meta font-medium text-brand-700 hover:text-brand-500 dark:text-brand-400"
        >
          Yangi oynada
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="t-label flex items-center gap-1.5">
        <span className="text-faint">{icon}</span>
        {label}
      </dt>
      <dd className="mt-0.5 min-w-0 text-ui">{children}</dd>
    </div>
  );
}

/** Bo‘sh maydon — xira, lekin AYTILGAN («—» o‘rniga sabab). */
function Missing({ children }: { children: ReactNode }) {
  return <span className="text-faint text-meta">{children}</span>;
}
