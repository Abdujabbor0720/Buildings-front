import { Eye, EyeOff, Headset, Lock, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { Button, Input } from '@/shared/ui';
import { useAuthStore } from '@/store/auth.store';

/** Modul yuklanganda BIR MARTA hisoblanadi — har renderda emas. */
const COPYRIGHT_YEAR = new Date().getFullYear();

/** Chap paneldagi raqamlar — tizim nimani qamrab olishini bir qarashda aytadi. */
const FACTS: Array<{ value: string; unit?: string; label: string }> = [
  { value: '220', label: 'qurilish obyekti nazoratda' },
  { value: '16', label: 'tuman va shahar' },
  { value: '7.4', unit: 'trln', label: 'so‘m umumiy qiymat' },
];

export function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await login(email.trim(), password);
      toast.success('Tizimga muvaffaqiyatli kirdingiz');
    } catch (cause) {
      // ⚠️ Xato FORMADA ko‘rsatiladi, faqat toast bilan emas: toast
      // o‘z-o‘zidan yo‘qoladi va foydalanuvchi nima xato bo‘lganini
      // unutib qoladi.
      const message = getErrorMessage(cause);
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* ───── Chap taraf: brend ─────
          ⚠️ To‘q ko‘k gradient panel ATAYLAB tashlandi. Uning o‘rnida
          «qog‘oz» fon va yirik tipografika: ekran reklama bannerga emas,
          rasmiy hujjat muqovasiga o‘xshashi kerak. */}
      <aside className="app-wash surface-sunken relative hidden overflow-hidden border-r border-subtle p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="relative">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-ui leading-tight font-semibold text-strong">Andijon viloyati hokimligi</p>
              <p className="text-faint text-micro leading-tight">Qurilish obyektlari nazorati tizimi</p>
            </div>
          </div>

          <h1 className="t-page mt-14 max-w-xl text-[clamp(32px,3.4vw,52px)]">
            Viloyatdagi har bir qurilish obyekti —{' '}
            <span className="text-brand-600 dark:text-brand-400">bitta ekranda</span>
          </h1>

          <p className="t-lede mt-5 max-w-lg">
            Muddatlar, bajarilish foizi, moliyalashtirish va kechikish sabablari real vaqtda
            kuzatiladi. Foto-hisobotlar avtomatik tekshiruvdan o‘tadi.
          </p>
        </div>

        {/* Raqamlar — serif, yirik: sahifaning ikkinchi urg‘u nuqtasi. */}
        <div className="relative mt-12 grid grid-cols-3 gap-6 border-t border-subtle pt-7">
          {FACTS.map((fact) => (
            <div key={fact.label}>
              <p className="num flex items-baseline gap-1 text-[34px] leading-none">
                {fact.value}
                {fact.unit ? <span className="text-ui font-normal text-muted">{fact.unit}</span> : null}
              </p>
              <p className="t-meta mt-1.5 leading-snug">{fact.label}</p>
            </div>
          ))}
        </div>

        <p className="text-faint relative mt-10 text-micro">
          © {COPYRIGHT_YEAR} Andijon viloyati hokimligi. Barcha huquqlar himoyalangan.
        </p>
      </aside>

      {/* ───── O‘ng taraf: forma ───── */}
      <main className="surface flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <BrandMark />
          </div>

          <h2 className="t-page mt-6 text-[26px] lg:mt-0">Tizimga kirish</h2>
          <p className="t-meta mt-2">
            Hisob ma’lumotlaringizni kiriting. Hisob yo‘q bo‘lsa — administratorga murojaat qiling.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <Input
              type="email"
              label="Email"
              placeholder="ism@andijon.uz"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              leftIcon={<Mail className="size-4" />}
              autoComplete="username"
              required
              autoFocus
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Parol"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                leftIcon={<Lock className="size-4" />}
                autoComplete="current-password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
                className="text-faint absolute top-[25px] right-2 grid size-7 place-items-center rounded-full transition-colors hover:text-strong"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-lg bg-danger-50 px-3 py-2 text-meta text-danger-700 dark:bg-danger-500/12 dark:text-danger-300"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" loading={isLoggingIn} className="w-full justify-center">
              Kirish
            </Button>
          </form>

          <div className="surface-inset mt-8 flex items-center gap-3 rounded-xl p-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-500/12 text-brand-600 dark:text-brand-400">
              <Headset className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-faint text-micro">Yordam markazi · 24/7</p>
              <a href="tel:1148" className="num text-head leading-tight transition-colors hover:text-brand-600">
                1148
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Brend belgisi — yon menyudagi bilan AYNI (ikki joyda ikki xil bo‘lmasin). */
function BrandMark() {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-[9px] bg-brand-500 shadow-[0_1px_3px_rgb(179_89_0/0.35)]">
      <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" aria-hidden>
        <path d="M3.5 21V8.6l6.2-3.6 6.2 3.6V21H3.5Z" fill="#fff" fillOpacity="0.95" />
        <path d="M16.2 21v-8.1l4.3-2.5v10.6h-4.3Z" fill="#fff" fillOpacity="0.62" />
        <g fill="#E87200">
          <rect x="5.9" y="10.6" width="2.1" height="2.1" rx="0.4" />
          <rect x="11.1" y="10.6" width="2.1" height="2.1" rx="0.4" />
          <rect x="5.9" y="14.6" width="2.1" height="2.1" rx="0.4" />
          <rect x="11.1" y="14.6" width="2.1" height="2.1" rx="0.4" />
        </g>
      </svg>
    </span>
  );
}
