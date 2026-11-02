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
          <div className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-6 lg:px-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
