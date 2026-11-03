import { Download, FileText } from 'lucide-react';
import { resolveFileUrl } from '@/shared/api/client';
import { useDocuments } from '@/shared/api/queries';
import { DOCUMENT_TYPE_LABELS } from '@/shared/constants/health';
import {
  Badge, Card, CardBody, CardHeader, EmptyState, LoadingBlock,
  Table, TableEmpty, TableWrap, TBody, Td, Th, THead, Tr
} from '@/shared/ui';
import { diffInDays, formatDateUz, tashkentToday } from '@/shared/utils/date.utils';
import { cn } from '@/shared/utils/cn';

export function ObjectDocumentsTab({ objectId }: { objectId: string }) {
  const { data, isLoading } = useDocuments({ objectId, limit: 50 });
  // Bugungi kun BIR MARTA olinadi — har qator uchun emas.
  const today = tashkentToday();

  if (isLoading) return <LoadingBlock />;
  const documents = data?.items ?? [];

  if (documents.length === 0) {
    return (
      <Card>
        <EmptyState title="Hujjat biriktirilmagan" icon={<FileText className="size-5" />} />
      </Card>
    );
  }

  return (
    <Card flush>
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <CardHeader title="Hujjatlar" subtitle={`${data?.meta.total ?? 0} ta hujjat`} />
      </div>
      <CardBody className="px-4 pb-1 sm:px-5">
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
                  const url = resolveFileUrl(document.url);
                  const daysLeft = document.expiryDate ? diffInDays(today, document.expiryDate) : null;
                  const expiring = daysLeft !== null && daysLeft <= 30;
                  return (
                    <Tr key={document.id}>
                      <Td className="font-medium text-strong">{document.title}</Td>
                      <Td><Badge className="surface-muted text-muted">{DOCUMENT_TYPE_LABELS[document.type]}</Badge></Td>
                      <Td muted className="mono text-meta">{document.number ?? '—'}</Td>
                      <Td className="tabular whitespace-nowrap">{formatDateUz(document.issuedDate)}</Td>
                      <Td className={cn('num whitespace-nowrap', expiring && 'font-medium text-warn-600 dark:text-warn-500')}>
                        {formatDateUz(document.expiryDate)}
                      </Td>
                      <Td align="right">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-white/5"
                            aria-label="Yuklab olish"
                          >
                            <Download className="size-3.5" />
                          </a>
                        ) : null}
                      </Td>
                    </Tr>
                  );
                })
              )}
            </TBody>
          </Table>
        </TableWrap>
      </CardBody>
    </Card>
  );
}
