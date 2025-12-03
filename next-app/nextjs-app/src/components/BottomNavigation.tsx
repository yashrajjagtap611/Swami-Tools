'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, Users, Settings } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 lg:hidden safe-area-inset-bottom">
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                isActive
                  ? 'text-zinc-950 dark:text-zinc-50'
                  : 'text-zinc-500 active:text-zinc-700 dark:text-zinc-400 dark:active:text-zinc-200'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-zinc-950 dark:bg-zinc-50 rounded-full" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium leading-tight sm:text-xs mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

