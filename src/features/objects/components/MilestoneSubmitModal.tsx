import { Sparkles, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import {
  useSubmitMilestone,
  useUploadFiles,
  type SubmitMilestoneBody,
} from '@/shared/api/queries';
import type { Milestone, MilestoneSubmission } from '@/shared/api/types';
import { RISK_META } from '@/shared/constants/health';
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  PhotoPicker,
  Textarea,
  UploadProgress,
  type PickedFile,
} from '@/shared/ui';
import { tashkentToday, toInputDate } from '@/shared/utils/date.utils';
import { formatPercent } from '@/shared/utils/money.utils';

interface Props {
  open: boolean;
  onClose: () => void;
  objectId: string;
  milestone: Milestone | null;
}

/**
 * BOSQICHNI TOPSHIRISH.
 *
 * ⚠️ SURAT MAJBURIY. Tugma suratsiz o‘chiq turadi va server ham shu
 * shartni qo‘yadi: «poydevor quyildi» degan yozuv dalilsiz qolsa,
 * keyinroq uni tekshirib bo‘lmaydi.
 *
 * ⚠️ Natija oyna ichida KO‘RSATILADI va u darhol yopilmaydi: obyektning
 * yangi foizi va AI xulosasi aynan shu lahzada eng kerak. Oyna o‘zi
 * yopilib ketsa, foydalanuvchi «nima bo‘ldi» deb bosqichlar ro‘yxatini
 * qayta o‘qishga majbur bo‘lardi.
 */
export function MilestoneSubmitModal({ open, onClose, objectId, milestone }: Props) {
  const upload = useUploadFiles();
  const submit = useSubmitMilestone(objectId);

  const [files, setFiles] = useState<PickedFile[]>([]);
  const [percent, setPercent] = useState('100');
  const [note, setNote] = useState('');
  const [workers, setWorkers] = useState('');
  const [actualEnd, setActualEnd] = useState(toInputDate(tashkentToday()));
  const [uploadPercent, setUploadPercent] = useState(0);
  const [result, setResult] = useState<MilestoneSubmission | null>(null);

  const sessionKey = open && milestone ? milestone.id : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (sessionKey !== lastKey) {
    setLastKey(sessionKey);
    setFiles([]);
    setNote('');
    setResult(null);
    setUploadPercent(0);
    setPercent('100');
    setWorkers(milestone?.workerCount === null || milestone?.workerCount === undefined ? '' : String(milestone.workerCount));
    setActualEnd(toInputDate(tashkentToday()));
  }

  if (!milestone) return null;

  const value = Number(percent);
  const validPercent = Number.isFinite(value) && value >= 0 && value <= 100;
  // ⚠️ Pasayish uchun izoh MAJBURIY — server ham shu qoidani qo‘yadi,
  // lekin foydalanuvchi buni yuborishdan OLDIN bilishi kerak.
  const decreasing = validPercent && value < milestone.progressPercent;
  const busy = upload.isPending || submit.isPending;
  const canSubmit =
    files.length > 0 && validPercent && !(decreasing && !note.trim()) && !busy;

  async function onSubmit() {
    if (!milestone || !canSubmit) return;
    try {
      setUploadPercent(0);
      const uploaded = await upload.mutateAsync({
        files: files.map((picked) => picked.file),
        subdir: 'photos',
        onProgress: setUploadPercent,
      });

      const body: SubmitMilestoneBody = {
        fileIds: uploaded.map((file) => file.id),
        progressPercent: value,
        actualEnd,
      };
      if (note.trim()) body.note = note.trim();
      if (workers.trim()) body.workerCount = Number(workers);

      const response = await submit.mutateAsync({ id: milestone.id, body });
      setResult(response);
      setFiles([]);
      toast.success(`«${milestone.name}» topshirildi`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  /* ───── Natija ekrani ───── */
  if (result) {
    const risk = result.analysis ? RISK_META[result.analysis.riskLevel] : null;
    return (
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        title={`«${result.milestone.name}» topshirildi`}
        description="Suratlar fotoarxivga tushdi va moderator ko‘rigini kutmoqda."
        footer={<Button onClick={onClose}>Yopish</Button>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Bosqich bajarilishi" value={formatPercent(result.milestone.progressPercent)} />
            <Stat
              label="Obyektning umumiy bajarilishi"
              value={
                result.objectProgress
                  ? `${formatPercent(result.objectProgress.previous)} → ${formatPercent(result.objectProgress.current)}`
                  : 'O‘zgarmadi'
              }
              tone={result.objectProgress ? 'text-ok-600 dark:text-ok-500' : undefined}
              icon={result.objectProgress ? <TrendingUp className="size-3.5" /> : undefined}
            />
          </div>

          {result.analysis ? (
            <div className="rounded-xl surface-muted p-3.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-meta font-semibold text-strong">
                  <Sparkles className="size-3.5 text-brand-500" />
                  AI tahlili
                </span>
                {risk ? <Badge className={risk.chip}>Xavf: {risk.label}</Badge> : null}
              </div>
              <p className="text-ui leading-relaxed text-strong">{result.analysis.summary}</p>
              {result.analysis.recommendations?.length ? (
                <ul className="mt-2 space-y-1">
                  {result.analysis.recommendations.map((item, index) => (
                    <li key={index} className="text-meta text-muted">
                      • {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            /* ⚠️ Tahlil yiqilsa TOPSHIRUV BARIBIR o‘tgan — buni aytib
               qo‘yish shart, aks holda odam suratni qayta yuborardi. */
            <p className="rounded-lg bg-warn-50 px-3 py-2 text-meta text-warn-700 dark:bg-warn-500/10 dark:text-warn-500">
              Topshiruv saqlandi, lekin AI tahlili hozir bajarilmadi. Uni «AI tahlil»
              bo‘limidan qayta ishga tushirishingiz mumkin.
            </p>
          )}
        </div>
      </Modal>
    );
  }

  /* ───── Topshirish formasi ───── */
  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      size="lg"
      title={`«${milestone.name}» — topshirish`}
      description={`Ulushi ${milestone.weight}% · joriy bajarilishi ${formatPercent(milestone.progressPercent)}`}
      footer={
        <>
          {/* ⚠️ Tugma nega o‘chiq ekani AYTILADI: sababsiz o‘chiq tugma
              «tizim buzuq» bo‘lib ko‘rinadi va odam qayta-qayta bosadi. */}
          {files.length === 0 ? (
            <span className="mr-auto text-meta text-muted">Surat biriktirilmagan</span>
          ) : null}
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Bekor qilish
          </Button>
          <Button onClick={onSubmit} loading={busy} disabled={!canSubmit}>
            {upload.isPending && uploadPercent > 0 ? `Yuklanmoqda ${uploadPercent}%` : 'Topshirish'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Bajarilishi, %"
            required
            error={validPercent ? undefined : '0 … 100 oralig‘ida'}
            hint="To‘liq topshirilsa — 100"
          >
            <Input value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Ishchilar soni" hint="Maydonda bo‘lganlar">
            <Input
              value={workers}
              onChange={(e) => setWorkers(e.target.value)}
              inputMode="numeric"
              placeholder="18"
            />
          </Field>
          <Field label="Ish tugagan sana" hint="Kelajakdagi sana qabul qilinmaydi">
            <Input
              type="date"
              value={actualEnd}
              max={toInputDate(tashkentToday())}
              onChange={(e) => setActualEnd(e.target.value)}
            />
          </Field>
        </div>

        {/*
          ⚠️ Bu yerda QIZIL XATO ko‘rsatilmaydi. `Field` xatoni ko‘rsatsa
          maslahatni ALMASHTIRADI — ya’ni oyna ochilishi bilan
          foydalanuvchi hali hech narsa qilmasdan turib qizil yozuv
          ko‘rardi va «surat nima uchun kerakligi» tushuntirilmay
          qolardi. Talab uchta joyda aytilgan: yorliqdagi yulduzcha,
          maslahat matni va O‘CHIQ turgan «Topshirish» tugmasi.
        */}
        <PhotoPicker
          label="Suratlar"
          required
          files={files}
          onChange={setFiles}
          disabled={busy}
          hint="MAJBURIY: bosqich bajarilganini surat tasdiqlaydi. Bir nechta rakurs yuklash mumkin."
        />

        <Textarea
          label="Izoh"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Qanday ishlar bajarildi"
          required={decreasing}
          error={
            decreasing && !note.trim()
              ? 'Bajarilish kamaymoqda — sababini izohda ko‘rsating'
              : undefined
          }
        />

        {upload.isPending ? <UploadProgress percent={uploadPercent} /> : null}
      </div>
    </Modal>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl surface-muted px-3.5 py-3">
      <p className="text-micro text-muted">{label}</p>
      <p className={`num mt-1 inline-flex items-center gap-1.5 text-lede font-bold ${tone ?? 'text-strong'}`}>
        {icon}
        {value}
      </p>
    </div>
  );
}
