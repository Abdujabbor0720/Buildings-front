import { Download, FileText, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage, resolveFileUrl } from '@/shared/api/client';
import { useDeleteDocument, useDocuments } from '@/shared/api/queries';
import type { ObjectDocument } from '@/shared/api/types';
import { DOCUMENT_TYPE_LABELS } from '@/shared/constants/health';
import {
  Badge, Button, Card, CardBody, CardHeader, EmptyState, LoadingBlock,
  Table, TableEmpty, TableWrap, TBody, Td, Th, THead, Tr
} from '@/shared/ui';
import { formatDateUz } from '@/shared/utils/date.utils';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/store/auth.store';
import { resolveExpiry } from '@/features/documents/document-expiry';
import { DocumentPreviewModal } from '@/features/documents/components/DocumentPreviewModal';
import { DocumentFormModal } from './DocumentFormModal';

export function ObjectDocumentsTab({ objectId }: { objectId: string }) {
  const { data, isLoading } = useDocuments({ objectId, limit: 50 });
  const remove = useDeleteDocument();
  const can = useAuthStore((state) => state.can);
  const canManage = can('documents.manage');
  const [addOpen, setAddOpen] = useState(false);
  // ⚠️ Tanlangan hujjat OBYEKT sifatida saqlanadi, `id` sifatida emas:
  // oyna ro‘yxatdagi qatordan to‘g‘ridan-to‘g‘ri to‘ladi va
  // qo‘shimcha so‘rov kutilmaydi.
  const [preview, setPreview] = useState<ObjectDocument | null>(null);

  const addButton = canManage ? (
    <Button size="sm" onClick={() => setAddOpen(true)} leftIcon={<Plus className="size-3.5" />}>
      Hujjat qo‘shish
    </Button>
  ) : null;

  if (isLoading) return <LoadingBlock />;
  const documents = data?.items ?? [];

  if (documents.length === 0) {
    return (
      <>
        <Card>
          <EmptyState
            title="Hujjat biriktirilmagan"
            description="Loyiha-smeta, shartnoma, ekspertiza xulosasi va ruxsatnomalarni shu yerga qo‘shing."
            icon={<FileText className="size-5" />}
            action={addButton}
          />
        </Card>
        <DocumentFormModal open={addOpen} onClose={() => setAddOpen(false)} objectId={objectId} />
      </>
    );
  }

  return (
    <Card flush>
      <div className="px-3.5 pt-3.5">
        <CardHeader
          title="Hujjatlar"
          subtitle={`${data?.meta.total ?? 0} ta hujjat`}
          action={addButton}
        />
      </div>
      <CardBody className="px-3.5 pb-1">
        <TableWrap>
          <Table>
            <THead>
              <Tr>
                <Th>Nomi</Th>
                <Th className="w-44">Turi</Th>
                <Th className="w-32">Raqami</Th>
                <Th className="w-36">Berilgan</Th>
                <Th className="w-44">Amal qiladi</Th>
                <Th className="w-20" />
              </Tr>
            </THead>
            <TBody>
              {documents.length === 0 ? (
                <TableEmpty colSpan={6} />
              ) : (
                documents.map((document) => {
                  // ⚠️ `file.url` BIRINCHI: `document.url` — uning
                  // nusxasi va eski yozuvlarda bo‘sh qolishi mumkin.
                  const url = resolveFileUrl(document.file?.url ?? document.url);
                  // ⚠️ Muddat mantig‘i YAGONA manbadan (`document-expiry.ts`).
                  // Ilgari bu yerda `daysLeft <= 30` yozilgan edi va
                  // muddati ALLAQACHON O‘TGAN hujjat ham «tugayapti»
                  // deb qahrabo rangda turardi — umumiy ro‘yxatda esa
                  // to‘g‘ri qizil edi.
                  const expiry = resolveExpiry(document);
                  return (
                    /* ⚠️ Qator BOSILADI va batafsil oyna ochiladi.
                       Ilgari jadvalda faqat raqam va sanalar ko‘rinardi:
                       izoh, biriktirilgan fayl va kim yuklagani
                       ekranda umuman yo‘q edi. */
                    <Tr key={document.id} onClick={() => setPreview(document)}>
                      <Td className="font-medium text-strong">{document.title}</Td>
                      <Td><Badge className="surface-muted text-muted">{DOCUMENT_TYPE_LABELS[document.type]}</Badge></Td>
                      <Td muted className="mono text-meta">{document.number ?? '—'}</Td>
                      <Td className="tabular whitespace-nowrap">{formatDateUz(document.issuedDate)}</Td>
                      <Td
                        className={cn(
                          'num whitespace-nowrap',
                          expiry.state === 'expired' && 'font-medium text-danger-600 dark:text-danger-500',
                          expiry.state === 'soon' && 'font-medium text-warn-600 dark:text-warn-500',
                        )}
                        title={expiry.detail ?? undefined}
                      >
                        {formatDateUz(document.expiryDate)}
                      </Td>
                      {/* ⚠️ Amal tugmalari qator bosilishini TO‘XTATADI
                          (`stopPropagation`): aks holda «o‘chirish» ni
                          bosganda orqa fonda batafsil oyna ham
                          ochilib, tasdiq oynasi ustiga chiqardi. */}
                      <Td
                        align="right"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <span className="inline-flex items-center gap-0.5">
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-white/5"
                              aria-label={`«${document.title}» hujjatini yuklab olish`}
                            >
                              <Download className="size-3.5" />
                            </a>
                          ) : null}
                          {canManage ? (
                            <button
                              type="button"
                              disabled={remove.isPending}
                              aria-label={`«${document.title}» hujjatini o‘chirish`}
                              onClick={async () => {
                                if (!window.confirm(`«${document.title}» o‘chirilsinmi?`)) return;
                                try {
                                  await remove.mutateAsync(document.id);
                                  toast.success('Hujjat o‘chirildi');
                                } catch (error) {
                                  toast.error(getErrorMessage(error));
                                }
                              }}
                              className="inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50 dark:hover:bg-danger-500/10"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          ) : null}
                        </span>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </TBody>
          </Table>
        </TableWrap>
      </CardBody>

      <DocumentFormModal open={addOpen} onClose={() => setAddOpen(false)} objectId={objectId} />
      {/* ⚠️ `showObject={false}` — obyekt kartasi ichidamiz va
          obyekt nomini qayta ko‘rsatish ortiqcha. */}
      <DocumentPreviewModal document={preview} onClose={() => setPreview(null)} showObject={false} />
    </Card>
  );
}
