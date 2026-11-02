import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;

/**
 * Modal — Headless UI asosida.
 * ⚠️ Qo‘lda yozilgan modal fokus tuzog‘i (focus trap), Escape va
 * `aria-modal` ni deyarli har doim unutadi; bu yerda ular tayyor keladi.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="duration-200 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-120 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-neutral-950/35 backdrop-blur-[3px]" aria-hidden />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
          <div className="flex min-h-full items-center justify-center">
            <TransitionChild
              as={Fragment}
              enter="duration-200 ease-out"
              enterFrom="opacity-0 translate-y-2 scale-[0.98]"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="duration-120 ease-in"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-[0.98]"
            >
              <DialogPanel
                className={cn(
                  'surface w-full rounded-2xl shadow-[0_0_0_1px_rgb(16_42_76/0.07),0_1px_2px_rgb(16_42_76/0.04),0_24px_56px_-20px_rgb(16_42_76/0.4)]',
                  SIZES[size],
                )}
              >
                <header className="flex items-start justify-between gap-4 border-b border-subtle px-5 py-4">
                  <div className="min-w-0">
                    <DialogTitle className="t-section">{title}</DialogTitle>
                    {description ? <p className="t-meta mt-1">{description}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Yopish"
                    className="-m-1 grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/8"
                  >
                    <X className="size-4" />
                  </button>
                </header>

                <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>

                {footer ? (
                  <footer className="surface-muted flex items-center justify-end gap-2 rounded-b-2xl border-t border-subtle px-5 py-3.5">
                    {footer}
                  </footer>
                ) : null}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
