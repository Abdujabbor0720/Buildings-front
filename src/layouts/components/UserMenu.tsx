import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { ChevronDown, LogOut, Settings, UserRound } from 'lucide-react';
import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROLE_LABELS } from '@/shared/constants/health';
import { Avatar } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/store/auth.store';

export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-neutral-100 focus:outline-none dark:hover:bg-white/8">
        <Avatar name={user.fullName} src={user.avatarUrl} size="sm" />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-ui leading-tight font-medium text-strong">
            {user.shortName}
          </span>
          <span className="text-faint block truncate text-micro leading-tight">
            {user.position ?? ROLE_LABELS[user.role]}
          </span>
        </span>
        <ChevronDown className="text-faint size-3.5 shrink-0" />
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition duration-150 ease-out" enterFrom="opacity-0 -translate-y-1" enterTo="opacity-100 translate-y-0"
        leave="transition duration-100 ease-in" leaveFrom="opacity-100" leaveTo="opacity-0"
      >
        <MenuItems className="pop absolute right-0 z-40 mt-2 w-60 overflow-hidden py-1 focus:outline-none">
          <div className="border-b border-subtle px-3 py-2.5">
            <p className="truncate text-ui font-semibold text-strong">{user.fullName}</p>
            <p className="t-meta truncate">{user.email}</p>
            <p className="mt-1.5 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-nano font-medium tracking-wide text-brand-700 uppercase dark:bg-brand-500/12 dark:text-brand-300">
              {ROLE_LABELS[user.role]}
            </p>
          </div>

          <MenuItem>
            {({ focus }) => (
              <Link
                to="/settings"
                className={cn('flex items-center gap-2.5 px-3 py-2 text-ui text-strong', focus && 'bg-neutral-100/70 dark:bg-white/6')}
              >
                <UserRound className="size-4 text-muted" />
                Mening profilim
              </Link>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <Link
                to="/settings"
                className={cn('flex items-center gap-2.5 px-3 py-2 text-ui text-strong', focus && 'bg-neutral-100/70 dark:bg-white/6')}
              >
                <Settings className="size-4 text-muted" />
                Sozlamalar
              </Link>
            )}
          </MenuItem>

          <div className="my-1 border-t border-subtle" />

          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate('/login', { replace: true });
                }}
                className={cn('flex w-full items-center gap-2.5 px-3 py-2 text-left text-ui text-danger-600 dark:text-danger-400', focus && 'bg-danger-50 dark:bg-danger-500/12')}
              >
                <LogOut className="size-4" />
                Tizimdan chiqish
              </button>
            )}
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
