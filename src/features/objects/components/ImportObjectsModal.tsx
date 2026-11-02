import { useRef, useState } from 'react';
import { CircleAlert, Download, FileSpreadsheet, TriangleAlert, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import {
  downloadImportTemplate,
  useImportObjects,
  type ImportReport,
  type ImportRowIssue,
} from '@/shared/api/queries';
import { Button, Modal } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ACCEPT = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
/** Serverdagi chegara bilan AYNI — mijozda ham aytiladi, so‘rov bekorga ketmasin. */
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * EXCEL ORQALI OMMAVIY YUKLASH — uch bosqich.
 *
 *   1. Shablonni yuklab olish va qanday ma’lumot kerakligini o‘qish
 *   2. Faylni tanlash → server TEKSHIRADI (hech narsa yozilmaydi)
 *   3. Hisobotni ko‘rib, tasdiqlash → yoziladi
 *
 * ⚠️ 2-bosqichni o‘tkazib yuborib bo‘lmaydi. «Yuklash» tugmasi faqat
 * tekshiruvdan keyin va faqat XATO BO‘LMAGANDA faollashadi: 500 ta
 * obyektni ko‘rmasdan yozish — orqaga qaytarib bo‘lmaydigan amal.
 */
export function ImportObjectsModal({ open, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [downloading, setDownloading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const importer = useImportObjects();

  const reset = () => {
    setFile(null);
    setReport(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const close = () => {
    reset();
    onClose();
  };

  const pick = (picked: File | null) => {
    if (!picked) return;
    if (!picked.name.toLowerCase().endsWith('.xlsx')) {
      toast.error('Faqat .xlsx fayl. .xls va .csv qo‘llanmaydi');
      return;
    }
    if (picked.size > MAX_BYTES) {
      toast.error(`Fayl juda katta: ${(picked.size / 1024 / 1024).toFixed(1)} MB. Chegara — 5 MB`);
      return;
    }
    setFile(picked);
    setReport(null);
    void check(picked);
  };

  const check = async (target: File) => {
    try {
      setReport(await importer.mutateAsync({ file: target, dryRun: true }));
    } catch (error) {
      setReport(null);
      toast.error(getErrorMessage(error));
    }
  };

  const commit = async () => {
    if (!file || !report || report.errors.length > 0) return;
    try {
      const result = await importer.mutateAsync({ file, dryRun: false });
      toast.success(`${result.created} ta obyekt qo‘shildi`);
      close();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const getTemplate = async () => {
    setDownloading(true);
    try {
      await downloadImportTemplate();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloading(false);
    }
  };

  const ready = report !== null && report.errors.length === 0 && report.validRows > 0;

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title="Excel orqali yuklash"
      description="Bir vaqtda ko‘p obyekt qo‘shish. Avval shablonni yuklab oling."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={importer.isPending}>
            Yopish
          </Button>
          <Button onClick={() => void commit()} disabled={!ready} loading={importer.isPending}>
            {ready ? `${report.validRows} ta obyektni yuklash` : 'Yuklash'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* ───── 1. Shablon ───── */}
        <section className="surface-inset rounded-xl p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-ui font-semibold text-strong">1. Shablonni yuklab oling</h3>
              <p className="t-meta mt-1">
                Shablonda ustunlar, to‘ldirish qoidalari va tuman / qurilish turi / pudratchi /
                mas’ullarning HAQIQIY nomlari bor.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void getTemplate()}
              loading={downloading}
              leftIcon={<Download className="size-4" />}
            >
              Shablon (.xlsx)
            </Button>
          </div>

          <ul className="t-meta mt-3 space-y-1">
            <li>
              <strong className="text-strong">Majburiy:</strong> obyekt nomi, tuman, qurilish turi,
              qiymati, reja boshlanishi va tugashi.
            </li>
            <li>
              <strong className="text-strong">Ixtiyoriy:</strong> manzil, buyurtmachi, pudratchi,
              mas’ul shaxs, moliya manbasi, koordinata, quvvat, qavatlar.
            </li>
            <li>
              Mas’ul shaxs biriktirilmasa ham fayl yuklanadi — tizim ogohlantiradi, keyin
              biriktirasiz.
            </li>
            <li>Bir faylda ko‘pi bilan 500 qator, hajmi 5 MB gacha.</li>
          </ul>
        </section>

        {/* ───── 2. Fayl ───── */}
        <section>
          <h3 className="text-ui font-semibold text-strong">2. To‘ldirilgan faylni tanlang</h3>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />

          {file ? (
            <div className="surface mt-2 flex items-center gap-3 rounded-xl p-3 shadow-[0_0_0_1px_rgb(16_42_76/0.08)]">
              <span className="tile bg-ok-100 text-ok-600 dark:bg-ok-500/15 dark:text-ok-300">
                <FileSpreadsheet className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-ui font-medium text-strong">{file.name}</span>
                <span className="t-meta">{(file.size / 1024).toFixed(0)} KB</span>
              </span>
              <button
                type="button"
                onClick={reset}
                aria-label="Faylni olib tashlash"
                className="text-faint grid size-8 place-items-center rounded-lg transition-colors hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/8"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-2 flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-subtle py-7 transition-colors hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-500/8"
            >
              <Upload className="text-faint size-6" />
              <span className="text-ui font-medium text-strong">Faylni tanlang</span>
              <span className="t-meta">.xlsx · 5 MB gacha</span>
            </button>
          )}
        </section>

        {/* ───── 3. Hisobot ───── */}
        {importer.isPending && !report ? (
          <p className="t-meta py-4 text-center">Fayl tekshirilmoqda…</p>
        ) : null}

        {report ? <ReportBlock report={report} /> : null}
      </div>
    </Modal>
  );
}

function ReportBlock({ report }: { report: ImportReport }) {
  const blocked = report.errors.length > 0;

  return (
    <section>
      <h3 className="text-ui font-semibold text-strong">3. Tekshiruv natijasi</h3>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <Tally label="Jami qator" value={report.totalRows} tone="neutral" />
        <Tally label="Yuklanadi" value={report.validRows} tone={blocked ? 'neutral' : 'ok'} />
        <Tally label="Xato" value={report.errors.length} tone={blocked ? 'danger' : 'neutral'} />
      </div>

      {blocked ? (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-danger-50 p-2.5 text-meta text-danger-700 dark:bg-danger-500/12 dark:text-danger-300">
          <CircleAlert className="mt-px size-4 shrink-0" />
          {/* ⚠️ «Hammasi yoki hech narsa» qoidasi AYNAN shu yerda
              tushuntiriladi — foydalanuvchi «nega to‘g‘ri qatorlar ham
              yuklanmadi» deb so‘ramasligi uchun. */}
          <span>
            Bitta xato bo‘lsa ham <strong>hech narsa yuklanmaydi</strong>. Shu sababli faylni
            tuzatib qayta yuklaganingizda takror yozuv paydo bo‘lmaydi.
          </span>
        </p>
      ) : null}

      {report.errors.length > 0 ? (
        <IssueList title="Xatolar — tuzatish shart" items={report.errors} tone="danger" />
      ) : null}

      {report.warnings.length > 0 ? (
        <IssueList
          title="Ogohlantirishlar — yuklashga to‘sqinlik qilmaydi"
          items={report.warnings}
          tone="warn"
        />
      ) : null}

      {!blocked && report.warnings.length === 0 ? (
        <p className="t-meta mt-3">Hammasi joyida — yuklashingiz mumkin.</p>
      ) : null}
    </section>
  );
}

function Tally({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'ok' | 'danger' | 'neutral';
}) {
  return (
    <div className="surface-inset rounded-lg px-3 py-2">
      <p className="t-label">{label}</p>
      <p
        className={cn(
          'num text-head',
          tone === 'ok' && 'text-ok-700 dark:text-ok-300',
          tone === 'danger' && 'text-danger-600 dark:text-danger-300',
          tone === 'neutral' && 'text-strong',
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * ⚠️ Ro‘yxat 12 ta bilan CHEKLANADI va qolgani «yana N ta» deb
 * aytiladi: 500 qatorli faylda 400 ta xato bo‘lsa, oyna cheksiz uzayib
 * tugmalar ekrandan chiqib ketardi.
 */
function IssueList({
  title,
  items,
  tone,
}: {
  title: string;
  items: ImportRowIssue[];
  tone: 'danger' | 'warn';
}) {
  const shown = items.slice(0, 12);
  const rest = items.length - shown.length;

  return (
    <div className="mt-3">
      <p className="flex items-center gap-1.5 text-meta font-medium text-strong">
        {tone === 'danger' ? (
          <CircleAlert className="size-3.5 text-danger-500" />
        ) : (
          <TriangleAlert className="size-3.5 text-warn-500" />
        )}
        {title}
        <span className="num text-faint">({items.length})</span>
      </p>

      <ul className="mt-1.5 max-h-52 space-y-0.5 overflow-y-auto">
        {shown.map((issue, index) => (
          <li
            key={`${issue.rowNumber}-${issue.column ?? ''}-${index}`}
            className="flex items-baseline gap-2 rounded-md px-2 py-1 text-meta odd:bg-neutral-50 dark:odd:bg-white/[0.03]"
          >
            <span className="num w-14 shrink-0 text-faint">{issue.rowNumber}-qator</span>
            {issue.column ? (
              <span className="shrink-0 font-medium text-strong">{issue.column}:</span>
            ) : null}
            <span
              className={cn(
                'min-w-0',
                tone === 'danger'
                  ? 'text-danger-700 dark:text-danger-300'
                  : 'text-warn-700 dark:text-warn-300',
              )}
            >
              {issue.message}
            </span>
          </li>
        ))}
      </ul>

      {rest > 0 ? <p className="t-meta mt-1">…va yana {rest} ta</p> : null}
    </div>
  );
}
