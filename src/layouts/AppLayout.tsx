import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, type ReactNode } from 'react';
import { useUiStore } from '@/store/ui.store';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
  const setMobileNav = useUiStore((state) => state.setMobileNav);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* ───── Desktop yon menyu ───── */}
      <div className="hidden shrink-0 lg:block">
        <Sidebar />
      </div>

      {/* ───── Mobil yon menyu ───── */}
      <Transition show={mobileNavOpen} as={Fragment}>
        <Dialog onClose={() => setMobileNav(false)} className="relative z-50 lg:hidden">
          <TransitionChild
            as={Fragment}
            enter="duration-200 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="duration-150 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-[2px]" aria-hidden />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="duration-200 ease-out"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="duration-150 ease-in"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel className="fixed inset-y-0 left-0 w-[264px]">
              <Sidebar mobile />
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>

      {/* ───── Asosiy qism ───── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        {/* ⚠️ Skroll AYNAN shu elementda: `body` da bo‘lsa, yopishqoq
            sarlavha va yon menyu birga siljib ketardi. */}
        <main className="surface-sunken min-h-0 flex-1 overflow-y-auto">
          {/*
            ⚠️ `flex min-h-full flex-col` — bosh sahifa shu tufayli
            «bir ekranga» sig‘adi.

            `min-h-full` konteynerga KAMIDA `main` balandligini beradi
            (shuning uchun ichidagi `flex-1` bolasi qolgan joyni
            egallaydi), lekin kontent balandroq bo‘lsa o‘sishga ham
            ruxsat beradi va `main` odatdagidek skroll bo‘ladi.

            ⚠️ `h-full` EMAS: u uzun sahifalarni (obyektlar ro‘yxati)
            qirqib qo‘yardi. Balandlikni `100dvh` dan hisoblash ham
            ishlamaydi — skrollbar va brauzer paneli hisobga
            olinmagani uchun bosh sahifa ostida ~110px bo‘sh joy
            qolib ketgan edi.
          */}
          <div className="mx-auto flex min-h-full w-full max-w-[1560px] flex-col px-3.5 py-3 sm:px-4 lg:px-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
