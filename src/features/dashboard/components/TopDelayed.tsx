import { useNavigate } from 'react-router-dom';
import type { TopDelayedItem } from '@/shared/api/types';
import { HEALTH_META } from '@/shared/constants/health';
import {
  ObjectAddress,
  ObjectResponsible,
  ProgressBar,
  Table,
  TableEmpty,
  TableWrap,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '@/shared/ui';
import { formatDateUz } from '@/shared/utils/date.utils';

/** «Kechikayotgan obyektlar (TOP 5)» — ortda qolish kunlari bo‘yicha. */
export function TopDelayed({ items }: { items: TopDelayedItem[] }) {
  const navigate = useNavigate();

  return (
    /*
     * ⚠️ `[&_td]:py-1` — qator 24px. Bosh sahifa bitta ekranga
     * sig‘ishi kerak va bu jadval uchun ajratilgan joy ~130px:
     * sukutdagi 31px lik qatorda beshta qator sig‘masdi.
     * Ustun kengliklari maketdan olingan.
     */
    <TableWrap fill>
      <Table className="h-full text-micro [&_td]:py-0.5 [&_th]:py-1">
        <THead>
          <Tr>
            <Th className="w-7 px-2">#</Th>
            <Th className="px-2">Obyekt nomi</Th>
            {/*
              ⚠️ «Mas'ul» ustuni «Tuman» O'RNIGA turibdi, qo'shimcha
              ustun sifatida EMAS.

              1280px li ekranda bu kartaga ~606px tegadi. Qat'iy
              ustunlar allaqachon 485px ni egallaydi va obyekt nomiga
              ~120px qoladi. Sakkizinchi ustun qo'shilsa, nomga ~35px
              qolib, u «Ulug'no…» bo'lib qirqilardi — ya'ni jadvaldagi
              ASOSIY ma'lumot yo'qolardi.

              Tuman tanlandi, chunki u obyekt nomining O'ZIDA bor:
              «Marhamat tumani suv inshooti», «Izboskan tumani
              madaniyat uyi». Bu kartada tuman ikki marta yozilardi,
              mas'ul esa umuman yozilmasdi. Qo'shimcha kafolat sifatida
              tuman nomi obyekt katagining ko'rsatmasida (`title`)
              qoldi — hech narsa yo'qolmaydi.

              ⚠️ Yaqin muddatdagi obyektlar jadvalida ham tuman AYNI
              shu sababdan olib tashlangan — ikki jadval bitta ekranda.
            */}
            <Th className="w-[78px] px-2">Mas'ul</Th>
            <Th className="w-[102px] px-2">Reja muddati</Th>
            <Th align="right" className="w-[62px] px-2">Kechikish</Th>
            <Th className="w-[92px] px-2">Bajarilish</Th>
            <Th className="w-[144px] px-2">Asosiy sabab</Th>
          </Tr>
        </THead>
        <TBody>
          {items.length === 0 ? (
            <TableEmpty colSpan={7}>Kechikayotgan obyekt yo‘q — barchasi reja asosida</TableEmpty>
          ) : (
            items.map((item, index) => (
              <Tr key={item.id} onClick={() => navigate(`/objects/${item.id}`)}>
                <Td muted className="num px-2 text-meta">{index + 1}</Td>
                <Td className="max-w-[1px] px-2">
                  {/* ⚠️ Ko'rsatmada TUMAN ham bor: ustun olib tashlangan
                      (sarlavhadagi izohga qarang), lekin ma'lumotning
                      o'zi yo'qolmasligi kerak. */}
                  <span
                    className="block truncate font-medium text-strong"
                    title={`${item.name} · ${item.districtName}`}
                  >
                    {item.name}
                  </span>
                  {/* ⚠️ MANZIL — ikkinchi qatorda, alohida ustunda
                      emas: bu kartaga 606px ajratilgan va yettita
                      ustun allaqachon bor. Mas'ul yondagi ustunda
                      turgani uchun bu yerda faqat joylashuv. */}
                  <ObjectAddress brief={item} className="mt-px" />
                </Td>
                {/*
                  ⚠️ Mas'ul YO'Q bo'lsa «—» ko'rsatiladi, katak bo'sh
                  QOLDIRILMAYDI. Kechikayotgan obyektda javobgar
                  biriktirilmagani — aynan shu jadvalda ko'rinishi kerak
                  bo'lgan muammo; bo'sh katak esa «ma'lumot yuklanmadi»
                  bo'lib o'qilardi.
                */}
                {/* ⚠️ Mas'ul UMUMIY komponentda (`ObjectMeta.tsx`):
                    ilgari bu katak o'z mantig'ini yozardi va
                    biriktirilmagan holat xira «—» bo'lib ko'rinardi,
                    boshqa ekranlarda esa qahrabo ogohlantirish
                    bo'lardi. */}
                <Td className="max-w-[1px] px-2">
                  <ObjectResponsible brief={item} withIcon={false} />
                </Td>
                <Td className="px-2 text-meta whitespace-nowrap">{formatDateUz(item.plannedEndDate)}</Td>
                {/* ⚠️ Maketdagi kabi SOF QIZIL MATN, «pill» emas:
                    to‘ldirilgan fon qator balandligini 8px oshirardi va
                    beshta qator ajratilgan joyga sig‘masdi. Rang
                    o‘zi yetarli signal. */}
                <Td align="right" className="num px-2 font-semibold whitespace-nowrap text-danger-600 dark:text-danger-400">
                  {item.delayDays} kun
                </Td>
                <Td className="px-2">
                  {/* ⚠️ Rang BAJARILISH FOIZIDAN emas, HOLATDAN. Foiz
                      allaqachon chiziq uzunligi va yonidagi raqam bilan
                      aytilgan; rang ham shuni takrorlasa, u hech qanday
                      yangi ma'lumot bermaydi. Holat rangi esa «97% — bu
                      yetarlimi» degan savolga javob beradi: bu yerda
                      hamma qator kechikayotgan, lekin xavfli holatdagisi
                      qizil bo‘lib ajralib turadi. */}
                  <ProgressBar
                    value={item.progressPercent}
                    tone={HEALTH_META[item.healthStatus].bar}
                    showValue
                    size="sm"
                  />
                </Td>
                {/* ⚠️ Rangli nuqta OLIB TASHLANDI: u serverdagi eski
                    katalog rangini ishlatardi va sabab matnidan 14px joy
                    yeb, «Qurilish materiallari ye…» bo‘lib qirqilishiga
                    sabab bo‘lardi. Sabab — MATN, rang bu yerda hech
                    narsa qo‘shmaydi (yonidagi ustunda allaqachon holat bor). */}
                <Td className="max-w-[150px] px-2">
                  {item.primaryReason ? (
                    <span className="block truncate text-meta text-muted" title={item.primaryReason}>
                      {item.primaryReason}
                    </span>
                  ) : (
                    <span className="text-faint text-meta">—</span>
                  )}
                </Td>
              </Tr>
            ))
          )}
        </TBody>
      </Table>
    </TableWrap>
  );
}
