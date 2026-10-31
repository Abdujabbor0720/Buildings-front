import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { Bell, CheckCheck, Info, TriangleAlert, OctagonAlert } from 'lucide-react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useMarkAllRead, useMarkNotificationRead, useNotifications, useUnreadCount } from '@/shared/api/queries';
import type { AppNotification } from '@/shared/api/types';
import { EmptyState, Spinner } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatRelativeUz } from '@/shared/utils/date.utils';

const SEVERITY = {
  info: { icon: Info, className: 'bg-neutral-100 text-neutral-600 dark:bg-white/8 dark:text-neutral-300' },
  warning: { icon: TriangleAlert, className: 'bg-warn-50 text-warn-700 dark:bg-warn-500/12 dark:text-warn-300' },
  critical: { icon: OctagonAlert, className: 'bg-danger-50 text-danger-700 dark:bg-danger-500/12 dark:text-danger-300' },
} as const;

export function NotificationsBell() {
  const { data: unread } = useUnreadCount();
  const count = unread?.count ?? 0;

  return (
    <Popover className="relative">
      <PopoverButton
        className="relative grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-neutral-100 hover:text-strong focus:outline-none dark:hover:bg-white/8"
        aria-label={`Bildirishnomalar${count > 0 ? ` (${count} ta o‘qilmagan)` : ''}`}
      >
        <Bell className="size-[18px]" />
        {count > 0 ? (
          <span className="tabular absolute top-0.5 right-0.5 grid min-w-[17px] place-items-center rounded-full bg-danger-500 px-1 text-nano leading-[17px] font-semibold text-white ring-2 ring-[var(--surface)]">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </PopoverButton>

      <Transition
        as={Fragment}
        enter="transition duration-150 ease-out" enterFrom="opacity-0 -translate-y-1" enterTo="opacity-100 translate-y-0"
        leave="transition duration-100 ease-in" leaveFrom="opacity-100" leaveTo="opacity-0"
      >
        <PopoverPanel className="absolute right-0 z-40 mt-2 w-[22rem] overflow-hidden pop">
          {({ close }) => <NotificationsList onNavigate={close} />}
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}

function NotificationsList({ onNavigate }: { onNavigate: () => void }) {
  const { data, isLoading } = useNotifications({ limit: 12 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const items = data?.items ?? [];
  const hasUnread = items.some((item) => !item.isRead);

  return (
    <>
      <header className="flex items-center justify-between border-b border-subtle px-4 py-3">
        <h3 className="t-section">Bildirishnomalar</h3>
        {hasUnread ? (
          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="inline-flex items-center gap-1 text-meta font-medium text-brand-700 underline decoration-brand-500/40 underline-offset-4 transition-colors hover:text-brand-500 disabled:opacity-50 dark:text-brand-400"
          >
            <CheckCheck className="size-3.5" />
            Hammasini o‘qilgan deb belgilash
          </button>
        ) : null}
      </header>

      <div className="max-h-[26rem] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState title="Bildirishnoma yo‘q" description="Yangi ogohlantirishlar shu yerda ko‘rinadi." icon={<Bell className="size-5" />} />
        ) : (
          <ul>
            {items.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onOpen={() => {
                  if (!item.isRead) markRead.mutate(item.id);
                  onNavigate();
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function NotificationRow({ item, onOpen }: { item: AppNotification; onOpen: () => void }) {
  const severity = SEVERITY[item.severity] ?? SEVERITY.info;
  const Icon = severity.icon;

  const content = (
    <div className={cn('flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-white/[0.03]', !item.isRead && 'bg-brand-500/[0.05] dark:bg-brand-500/8')}>
      <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg', severity.className)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-ui font-medium text-strong">
          <span className="truncate">{item.title}</span>
          {!item.isRead ? <span className="size-1.5 shrink-0 rounded-full bg-brand-500" aria-label="O‘qilmagan" /> : null}
        </p>
        <p className="t-meta mt-0.5 line-clamp-2">{item.body}</p>
        <p className="text-faint mt-1 text-micro">{formatRelativeUz(item.createdAt)}</p>
      </div>
    </div>
  );

  return (
    <li className="border-b border-subtle last:border-0">
      {item.objectId ? (
        <Link to={`/objects/${item.objectId}`} onClick={onOpen} className="block">
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onOpen} className="block w-full text-left">
          {content}
        </button>
      )}
    </li>
  );
}
