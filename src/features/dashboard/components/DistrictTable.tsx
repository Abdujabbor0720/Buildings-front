import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DistrictStats } from '@/shared/api/types';
import { HEALTH_META } from '@/shared/constants/health';
import { ProgressBar, Table, TableEmpty, TableWrap, TBody, Td, Th, THead, Tr, Tabs, type TabOption } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';

type Filter = 'all' | 'on_schedule' | 'delayed' | 'at_risk';

const TABS: ReadonlyArray<TabOption<Filter>> = [
  { value: 'all', label: 'Barchasi' },
  { value: 'on_schedule', label: 'Reja asosida' },
  { value: 'delayed', label: 'Kechikayotgan' },
  { value: 'at_risk', label: 'Xavfli' },
];

/**
 * «Tumanlar kesimida obyektlar» jadvali.
 *
 * ⚠️ Tab TANLOVNI emas, SARALASHNI o‘zgartiradi: foydalanuvchi «kechikayotgan»
 * ni bosganda tumanlarni yo‘qotishni emas, eng ko‘p kechikkanini tepada
 * ko‘rishni kutadi. Obyekti yo‘q tuman esa chetlab o‘tiladi.
 */
export function DistrictTable({ districts }: { districts: DistrictStats[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const visible = districts.filter((d) => (filter === 'all' ? true : d[camel(filter)] > 0));
    return [...visible].sort((a, b) =>
      filter === 'all' ? b.total - a.total : b[camel(filter)] - a[camel(filter)],
    );
  }, [districts, filter]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Tabs options={TABS} value={filter} onChange={setFilter} fill className="mx-3 mb-1.5 shrink-0" />

      {/* ⚠️ Chegara KARTADA (`DashboardPage` dagi `max-h`), bu yerda
          EMAS. Jadvalga `max-h` qo‘yilganda u kartadan past bo‘lib
          qolardi va ostida bo‘sh joy ochilardi: karta balandligini
          gridning o‘sha qatori (o‘ng ustun) belgilaydi, jadval esa
          o‘zining 400px ida to‘xtab turardi.

          Endi jadval `flex-1` bilan kartani TO‘LDIRADI va ortig‘i
          skroll bo‘ladi — qancha joy bo‘lsa, shuncha qator ko‘rinadi. */}
      <TableWrap fill className="min-h-0 flex-1 overflow-y-auto">
        <Table className="h-full text-micro [&_td]:py-0.5 [&_th]:py-px">
          <THead>
            <Tr>
              <Th className="w-6 px-1.5">#</Th>
              <Th className="px-1.5">Tuman nomi</Th>
              <Th align="right" className="w-8 px-0.5">Jami</Th>
              <Th align="right" className="w-8 px-0.5">Reja</Th>
              {/* ⚠️ Qisqartma ATAYLAB: 1280px li ekranda kartaga 344px
                  joy tegadi va «Kechik.» / «Xavfli» to‘liq yozilsa,
                  oxirgi ustundagi foiz qirqilib, gorizontal skroll
                  paydo bo‘lardi. */}
              <Th align="right" className="w-9 px-0.5">Kech.</Th>
              <Th align="right" className="w-8 px-0.5">Xavf.</Th>
              {/* ⚠️ Kenglik FOIZDA, piksel emas: keng monitorda ortiqcha joy
                  faqat tuman nomiga ketib, chiziq 26px lik «dog‘» bo‘lib
                  qolardi. Foiz bilan u karta bilan birga o‘sadi, eng
                  kichik kenglik esa 1280px li ekranni kafolatlaydi. */}
              <Th className="w-[22%] min-w-[88px] px-1.5">Bajarilish</Th>
            </Tr>
          </THead>
          <TBody>
            {rows.length === 0 ? (
              <TableEmpty colSpan={7}>Tanlangan kesimda tuman topilmadi</TableEmpty>
            ) : (
              rows.map((district, index) => (
                <Tr key={district.districtId} onClick={() => navigate(`/objects?districtIds=${district.districtId}`)}>
                  <Td className="num text-faint px-1.5">{index + 1}</Td>
                  <Td className="px-1.5 font-medium whitespace-nowrap text-strong">{district.shortName}</Td>

                  {/* ⚠️ «Jami» — qatorning TAYANCH raqami: u yarim qalin va
                      to‘q, qolganlari esa odatiy. Hammasi bir xil
                      og‘irlikda bo‘lsa, ko‘z qaysi birini avval o‘qishni
                      bilmaydi. */}
                  <Td align="right" className="num px-0.5 font-semibold text-strong">
                    {district.total}
                  </Td>

                  {/* ⚠️ NOL qiymat XIRA ko‘rsatiladi. Ilgari u ham to‘q
                      qora edi va «0 ta kechikish» bilan «5 ta kechikish»
                      bir xil og‘irlikda ko‘rinardi — holbuki bu jadvalda
                      ko‘z aynan NOLDAN FARQLI raqamlarni qidiradi. */}
                  <Count value={district.onSchedule} tone="text-ok-600 dark:text-ok-500" />
                  <Count value={district.delayed} tone="text-warn-600 dark:text-warn-500" />
                  <Count value={district.atRisk} tone="text-danger-600 dark:text-danger-500" />

                  <Td className="px-1.5">
                    {/* ⚠️ Rang BAJARILISH FOIZIDAN emas, HOLATDAN olinadi.
                        Foiz allaqachon chiziq uzunligi va yonidagi raqam
                        bilan aytilgan — rang ham shuni aytsa, u hech qanday
                        yangi ma'lumot bermaydi. Holat rangi esa «66% — bu
                        yaxshimi yoki yomonmi» degan savolga javob beradi. */}
                    <ProgressBar
                      value={district.avgProgress}
                      tone={HEALTH_META[district.dominantHealth].bar}
                      showValue
                      size="sm"
                    />
                  </Td>
                </Tr>
              ))
            )}
          </TBody>
        </Table>
      </TableWrap>
    </div>
  );
}

/** Sanoq katagi: noldan farqli qiymat RANGLI, nol esa xira. */
function Count({ value, tone }: { value: number; tone: string }) {
  return (
    <Td align="right" className={cn('num px-0.5', value > 0 ? tone : 'text-faint')}>
      {value}
    </Td>
  );
}

function camel(filter: Exclude<Filter, 'all'>): 'onSchedule' | 'delayed' | 'atRisk' {
  if (filter === 'on_schedule') return 'onSchedule';
  if (filter === 'at_risk') return 'atRisk';
  return 'delayed';
}
