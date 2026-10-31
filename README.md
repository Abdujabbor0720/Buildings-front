# Qurilish obyektlari nazorati tizimi — Frontend

Andijon viloyati hokimligi monitoring platformasining admin paneli.

**Stek:** React 19 · TypeScript · Tailwind CSS 4 · Zustand · TanStack Query · Vite 8

---

## 1. Tez ishga tushirish

```bash
npm install
cp .env.example .env     # VITE_API_URL bo‘sh qolsa — Vite proksisi ishlatiladi
npm run dev              # http://localhost:4444
```

Backend `http://localhost:3333` da ishlayotgan bo‘lishi kerak.
`vite.config.ts` dagi proksi `/api` so‘rovlarini o‘sha yerga uzatadi —
shuning uchun dev rejimda CORS muammosi umuman tug‘ilmaydi.

Kirish: `hokim@andijon.uz` / `Hokim2026!` (qolgan hisoblar — backend README).

| Buyruq | Nima qiladi |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | `tsc -b` + prod yig‘ish |
| `npm run preview` | Yig‘ilgan versiyani ko‘rish |
| `npm run lint` | oxlint |

---

## 2. Tuzilma

```
src/
├─ app/           Router, providers, QueryClient
├─ layouts/       AppLayout + Sidebar, Header, qidiruv, bildirishnomalar
├─ features/      Sahifalar (har biri o‘z `components/` papkasi bilan)
├─ shared/
│  ├─ api/        client (axios + token refresh), types (shartnoma), queries (hooklar)
│  ├─ ui/         Dizayn tizimi: Card, Button, Table, Modal, ProgressBar …
│  ├─ constants/  Holat ranglari/yorliqlari, menyu
│  ├─ utils/      Sana, pul, `cn()`
│  └─ hooks/      useDebounce …
└─ store/         Zustand: auth, ui (mavzu), filters (global filtr)
```

### Sahifalar

Bosh sahifa · Obyektlar ro‘yxati · Obyekt kartasi (8 ta tab) · Interaktiv
xarita · Tumanlar kesimida · Kalendar (ish rejasi) · Kechikishlar va
risklar · Hisobotlar · Fotoarxiv · Hujjatlar · Mas’ullar · Pudratchilar
(+ karta) · Moliyalashtirish · AI tahlil · Sozlamalar

---

## 3. Asosiy qarorlar

### 3.1. Server holati ≠ mijoz holati

- **TanStack Query** — serverdan kelgan hamma narsa (kesh, qayta so‘rash,
  `keepPreviousData` bilan sahifalash).
- **Zustand** — faqat mijoz holati: sessiya, mavzu, global filtr.

So‘rov kalitlari bitta joyda (`shared/api/queries.ts` → `qk`). Qo‘lda
yozilgan kalit mutatsiyadan keyin keshni yangilamay qoldirardi.

### 3.2. Bosh sahifa — BITTA so‘rov

`GET /dashboard` butun ekranni to‘ldiradi. Sakkizta alohida endpoint
chaqirilsa, bloklar bir-biridan keyin «sakrab» chiqardi. Xarita
chegaralari alohida so‘raladi: ular og‘ir, lekin filtrdan deyarli
mustaqil va uzoq keshlanadi.

### 3.3. Token yangilash — bir marta

`shared/api/client.ts` da 401 bo‘lganda refresh **bitta** marta
yuboriladi (`refreshPromise`). Busiz sahifa ochilishida 8 ta parallel
401 → 8 ta refresh → rotatsiya tufayli foydalanuvchi tizimdan chiqib
ketardi.

### 3.4. Sana formati — yagona manba

`shared/utils/date.utils.ts`: `21-may, 2025`, `21-may, 2025 14:30`,
`Yanvar, 2026`. `toLocaleDateString('uz-UZ')` va `Intl.DateTimeFormat`
**taqiqlangan** — natija brauzer sozlamasiga bog‘liq bo‘lib qoladi.
ISO ko‘rinish (`toInputDate`) faqat `<input type=date>`, so‘rov
parametri va fayl nomi uchun.

### 3.5. Pul — frontendda hisoblanmaydi

Summalar serverdan **string** bo‘lib keladi.
`shared/utils/money.utils.ts` faqat formatlaydi (`7.4 trln so‘m`).
Yig‘indi har doim SQL `SUM()` dan keladi.

### 3.6. Dizayn tizimi

Butun ko‘rinish ikkita faylda belgilanadi; komponentlarda rang, o‘lcham
yoki soya **qo‘lda yozilmaydi**.

| Fayl | Nima |
|---|---|
| `src/index.css` | Ranglar, shriftlar, o‘lcham shkalasi, radius, soya, `.card` / `.num` / `.t-*` utilitalari |
| `src/shared/constants/health.ts` | Holat yorliqlari va ranglari, kategorik palitra |

**Shriftlar — har biri bitta vazifa uchun** (o‘z serverimizdan,
`@fontsource`, CDN emas):

| Shrift | Vazifasi |
|---|---|
| Outfit | butun interfeys |
| Bricolage Grotesque | sahifa sarlavhalari (`.t-page`) |
| Source Serif 4 | **raqamlar** (`.num`) va asosiy tugma (kursiv) |
| IBM Plex Mono | kod, STIR, shartnoma raqami (`.mono`) |

**O‘lchamlar vazifa bo‘yicha nomlangan**: `text-nano/micro/meta/ui/body/
lede/head/sub/display/major/figure`. ⚠️ Yangi o‘lcham qo‘shilsa, u
`shared/utils/cn.ts` dagi `FONT_SIZES` ro‘yxatiga ham qo‘shiladi —
aks holda `tailwind-merge` uni matn RANGI deb hisoblab, yonidagi
`text-white` ni o‘chirib yuboradi.

⚠️ Matn ranglari `--ink-*` deb nomlangan, `--text-*` EMAS: `--text-*`
maydonidan Tailwind o‘lcham utilitalarini yasaydi va nom to‘qnashsa
`text-body` `font-size: #27272a` bo‘lib buziladi.

### 3.6.1. Rang qoidalari

- **Brend sarig‘i (`brand-*`) — faqat interfeys urg‘usi**: faol menyu,
  havola, fokus halqasi. Ma’lumot rangi sifatida ishlatilmaydi, aks holda
  «faol bo‘lim» bilan «kechikayotgan obyekt» bir ko‘rinishda bo‘lardi.
- **Asosiy tugma QORA**, sariq emas: ekranda o‘nlab tugma bo‘ladi,
  hammasi sariq bo‘lsa urg‘u ma’nosini yo‘qotadi.
- **Holat rangi** (`HEALTH_META`) komponent ichida yozilmaydi — aks holda
  xaritadagi «kechikayotgan» bir rangda, jadvaldagisi boshqa rangda
  bo‘lib qolardi.
- **Kategorik palitra** (`CATEGORICAL_HEX`) — tartibi o‘zgarmas va rang
  aylantirilmaydi: qo‘shni juftliklar deyteranopiya/protanopiyada
  ajralishi tekshirilgan (OKLab ΔE ≥ 8; oddiy ko‘rishda ≥ 15).
- **Tartibli qatorlar** (muddat guruhlari, reja → ajratilgan → to‘langan)
  turli ranglar emas, BITTA rangning yorug‘lik pog‘onalari bilan
  ko‘rsatiladi — tartib rangning o‘zida ko‘rinishi uchun. Qorong‘i
  rejimda pog‘onalar teskari (`useChartColors`).
- **Bitta belgi — bitta ma’no**: progress chizig‘ining uzunligi ham,
  rangi ham bajarilishni bildiradi. Ilgari rangi obyekt holatini
  bildirgan va bir ekranda ikkita 65% ikki xil rangda turgan.
- **Rang hech qachon yagona belgi emas**: holat chipida matn, xaritada
  afsona, diagrammada to‘g‘ridan-to‘g‘ri yorliq bor. Issiq ranglar
  (qizil ↔ sariq) deyteranopiyada baribir yaqin ko‘rinadi — buni rang
  bilan hal qilib bo‘lmaydi.

### 3.7. Ruxsat — menyuda ham

Ruxsati yo‘q bo‘lim menyuda **ko‘rsatilmaydi** (bosib bo‘lmaydigan
tugma emas, umuman yo‘q). Backend baribir tekshiradi — bu faqat UX.

### 3.8. Xarita

`react-leaflet` + GeoJSON choropleth.

⚠️ **Fon xaritasi (basemap) sukut bo‘yicha O‘CHIQ.** Tuman chegaralari va
holat ranglari o‘zi yetarli ma’lumot beradi. Bepul CARTO plitkalari endi
API kalit talab qiladi va kalitsiz so‘rovga «API KEY REQUIRED» yozuvini
RASM sifatida qaytaradi — butun xarita shu yozuv bilan qoplanadi.
Litsenziyalangan manba bo‘lsa, `.env` da yoqiladi:

```
VITE_BASEMAP_URL=https://{s}.tile.example.uz/{z}/{x}/{y}.png
VITE_BASEMAP_ATTRIBUTION=© Xarita manbasi
```
`zoomSnap={0}` — Leaflet'ning butun zoom darajalari chegarani
konteynerga to‘liq joylashtirmaydi va atrofida keng bo‘sh joy qoladi.

### 3.9. Kod bo‘linishi

Sahifalar `lazy()` bilan. Recharts (~430 KB) va Leaflet (~154 KB)
alohida bo‘laklarda — ular bosh sahifa bilan birga yuklanmaydi.

---

## 4. Mavzu (dark mode)

`class` strategiyasi (`<html class="dark">`), tokenlar
`src/index.css` dagi `@theme` va CSS o‘zgaruvchilarida. Tanlov
`localStorage` da saqlanadi va sahifa yuklanishida darhol qo‘llanadi —
oq fon «chaqnab» ketmasligi uchun.

---

## 5. Deploy

```bash
npm ci --include=dev && npm run build     # → dist/
```

`dist/` — statik fayllar. Ularni **nginx** tarqatadi; tayyor namuna:
**`deploy/nginx.example.conf`** (izohlar bilan).

### 5.1. API manzili — ikki yo'l

Ilova sukut bo'yicha **`/api/v1`** nisbiy yo'lini chaqiradi
(`shared/api/client.ts`).

**Tavsiya etiladigan: bitta domen.** Nginx frontendni tarqatadi va
`/api/` ni backendga (`127.0.0.1:3333`) uzatadi. Shunda:

- CORS umuman tug'ilmaydi;
- `VITE_API_URL` **kerak emas**;
- backend manzili o'zgarsa frontendni **qayta qurish shart emas** —
  faqat nginx sozlamasi o'zgaradi.

**Alohida domen.** U holda `VITE_API_URL=https://api.example.uz/api/v1`
va backendda `CORS_ORIGINS` frontend domenini o'z ichiga olishi kerak.

⚠️ **`VITE_*` o'zgaruvchilari YIG'ISH PAYTIDA kodga yoziladi**, ishga
tushganda emas. Deploy paneli ularni faqat runtime'da bersa, ular
bandlga TUSHMAYDI va ilova baribir `/api/v1` ga murojaat qiladi.
Ular `npm run build` dan OLDIN muhitda bo'lishi shart.

### 5.2. Nginx'dagi uchta majburiy qator

| Qator | Busiz nima bo'ladi |
|---|---|
| `try_files $uri $uri/ /index.html` | `/objects/123` sahifasini yangilaganda **404** |
| `client_max_body_size 110M` | 100 MB li fayl yuklashda **413** (Node'ga yetib bormaydi) |
| `index.html` keshlanmasligi | Deploydan keyin foydalanuvchi eski sahifa va yo'q fayllar bilan **oq ekran** ko'radi |
