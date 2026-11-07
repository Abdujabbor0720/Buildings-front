import { Download, FileText, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage, resolveFileUrl } from '@/shared/api/client';
import type { ObjectDocument } from '@/shared/api/types';
import { resolveExpiry } from './document-expiry';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { useDistricts, useDocuments } from '@/shared/api/queries';
import { DOCUMENT_TYPE_LABELS } from '@/shared/constants/health';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  Badge,
  Card,
  ErrorState,
  LoadingBlock,
  ObjectMetaLines,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatPills,
  TBody,
  THead,
  Table,
  TableEmpty,
  TableWrap,
  Td,
  Th,
  Tr,
  toObjectBrief,
} from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatDateUz } from '@/shared/utils/date.utils';
import { formatCount } from '@/shared/utils/money.utils';
import { useFiltersStore } from '@/store/filters.store';

export default function DocumentsPage() {
  const { regionId } = useFiltersStore();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [type, setType] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [expiringOnly, setExpiringOnly] = useState(false);
  // ⚠️ Tanlangan hujjat OBYEKT sifatida saqlanadi: oyna qatordan
  // to‘g‘ridan-to‘g‘ri to‘ladi va qo‘shimcha so‘rov kutilmaydi.
  const [preview, setPreview] = useState<ObjectDocument | null>(null);

  const { data: districts } = useDistricts(regionId ?? undefined);

  const params = useMemo(
    () => ({
      page,
      limit,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(type ? { type } : {}),
      ...(districtId ? { districtId } : {}),
      ...(expiringOnly ? { expiringOnly: true } : {}),
    }),
    [page, limit, debouncedSearch, type, districtId, expiringOnly],
  );

  const { data, isLoading, isError, error, refetch } = useDocuments(params);

  return (
    <>
      <PageHeader
        title="Hujjatlar"
        description="Loyiha, shartnoma, ekspertiza va ruxsatnomalar"
        stats={data ? <StatPills items={[{ label: 'Jami hujjatlar', value: formatCount(data.meta.total) }]} /> : null}
      />

      <Card flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-subtle p-3 sm:p-4">
          <SearchInput
            value={search}
            onValueChange={(value) => { setSearch(value); setPage(1); }}
            placeholder="Hujjat nomi, raqami yoki obyekt…"
            className="min-w-[200px] flex-1"
          />
          <Select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            placeholder="Barcha turlar"
            options={Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            className="w-auto min-w-[170px]"
          />
          <Select
            value={districtId}
            onChange={(e) => { setDistrictId(e.target.value); setPage(1); }}
            placeholder="Barcha tumanlar"
            options={(districts ?? []).map((d) => ({ value: d.id, label: d.name }))}
            className="w-auto min-w-[160px]"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg surface-muted px-3 py-2 text-meta ring-1 ring-inset ring-[var(--border-subtle)]">
            <input
              type="checkbox"
              checked={expiringOnly}
              onChange={(event) => { setExpiringOnly(event.target.checked); setPage(1); }}
              className="size-3.5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
            />
            Muddati tugayotganlar
          </label>
        </div>

        <div className="p-3 sm:p-4">
          {/* ⚠️ XATO HOLATI MAJBURIY. Busiz so‘rov yiqilganda bu yerda
              BO‘SH ro‘yxat ko‘rinardi — foydalanuvchi «ma’lumot yo‘q»
              deb o‘ylab, aslida tarmoq uzilganini bilmay qolardi. */}
          {isLoading ? (
            <LoadingBlock />
          ) : isError ? (
            <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
          ) : (
            <>
              <TableWrap>
                <Table>
                  <THead>
                    <Tr>
                      <Th>Hujjat nomi</Th>
                      <Th className="w-44">Turi</Th>
                      <Th className="w-32">Raqami</Th>
                      <Th>Obyekt</Th>
                      <Th className="w-36">Berilgan</Th>
                      <Th className="w-44">Amal qiladi</Th>
                      <Th className="w-16" />
                    </Tr>
                  </THead>
                  <TBody>
                    {data?.items.length === 0 ? (
                      <TableEmpty colSpan={7}>Hujjat topilmadi</TableEmpty>
                    ) : (
                      data?.items.map((document) => {
                        // ⚠️ `file.url` BIRINCHI: `document.url` — uning
                        // nusxasi va eski yozuvlarda bo‘sh qolishi mumkin.
                        const url = resolveFileUrl(document.file?.url ?? document.url);
                        // ⚠️ Muddat mantig‘i YAGONA manbadan — obyekt
                        // kartasidagi tab bilan AYNI (`document-expiry.ts`).
                        const expiry = resolveExpiry(document);
                        const expiring = expiry.state === 'soon' || expiry.state === 'expired';
                        const expired = expiry.state === 'expired';

                        return (
                          /* ⚠️ Qator bosilganda batafsil oyna ochiladi —
                             obyekt kartasidagi «Hujjatlar» tabi bilan AYNI
                             komponent va AYNI ko‘rinish. */
                          <Tr key={document.id} onClick={() => setPreview(document)}>
                            <Td className="font-medium text-strong">{document.title}</Td>
                            <Td><Badge className="surface-muted text-muted">{DOCUMENT_TYPE_LABELS[document.type]}</Badge></Td>
                            <Td muted className="mono text-meta">{document.number ?? '—'}</Td>
                            <Td className="max-w-[240px]">
                              {document.object ? (
                                <>
                                  <Link to={`/objects/${document.object.id}`} className="block truncate text-meta hover:text-brand-600">
                                    {document.object.name}
                                  </Link>
                                  {/* ⚠️ Hujjatni YUKLAGAN odam bilan obyekt
                                      MAS'ULI boshqa-boshqa shaxslar: hujjat
                                      bo‘yicha savol tug‘ilganda kimga
                                      murojaat qilish shu yerda aytiladi. */}
                                  <ObjectMetaLines brief={toObjectBrief(document.object)} />
                                </>
                              ) : (
                                <span className="text-meta text-muted">Umumiy hujjat</span>
                              )}
                            </Td>
                            <Td className="tabular whitespace-nowrap">{formatDateUz(document.issuedDate)}</Td>
                            <Td className={cn('num whitespace-nowrap', expired ? 'font-medium text-danger-600 dark:text-danger-500' : expiring && 'font-medium text-warn-600 dark:text-warn-500')}>
                              <span className="inline-flex items-center gap-1.5">
                                {expiring ? <TriangleAlert className="size-3.5" /> : null}
                                {formatDateUz(document.expiryDate)}
                                {/* ⚠️ «3 kun qoldi» / «12 kun oldin tugagan»
                                    matni ham yagona manbadan: jadval va
                                    batafsil oyna bir xil so‘z bilan
                                    gapirishi kerak. */}
                                {expiry.detail && expiry.state !== 'none' ? (
                                  <span className="text-micro">({expiry.detail})</span>
                                ) : null}
                              </span>
                            </Td>
                            {/* ⚠️ Amal tugmalari qator bosilishini
                                TO‘XTATADI, aks holda «o‘chirish» bilan
                                birga batafsil oyna ham ochilardi. */}
                            <Td
                              align="right"
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              {url ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  aria-label="Yuklab olish"
                                  className="inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-white/5"
                                >
                                  <Download className="size-3.5" />
                                </a>
                              ) : (
                                <FileText className="mx-auto size-3.5 text-neutral-300" />
                              )}
                            </Td>
                          </Tr>
                        );
                      })
                    )}
                  </TBody>
                </Table>
              </TableWrap>

              <Pagination meta={data?.meta} onPageChange={setPage} onLimitChange={(value) => { setLimit(value); setPage(1); }} />
            </>
          )}
        </div>
      </Card>

      {/* ⚠️ Obyekt kartasidagi «Hujjatlar» tabi bilan AYNI komponent:
          ikki ekranda bir xil oyna ochiladi. Bu yerda obyekt nomi ham
          ko‘rsatiladi — umumiy ro‘yxatda u kontekstdan ma'lum emas. */}
      <DocumentPreviewModal document={preview} onClose={() => setPreview(null)} />
    </>
  );
}
